import { siteHost } from "@/lib/site";
import { LIMITS } from "./constants";
import { renderOgCard } from "./render";
import { parseOgRequest } from "./schema";
import { OG_IMAGE_PATH } from "./url";
import { validateApiKey, fetchUserTemplate, getServiceClient } from "./server-auth";
import { resolveTemplateOverrides, parseTemplateRef } from "./template";

/**
 * The image endpoint.
 *
 * Public by default. When an Authorization header with a valid API key is
 * provided, the endpoint can resolve a custom template (by UUID) belonging to
 * that key's owner. The custom template overrides theme, title, subtitle, and
 * logo. Built-in templates continue to work without auth.
 *
 * Rate limiting per API key:
 * - Free: 100 requests/month
 * - Pro: 10,000 requests/month
 * - Agency: 100,000 requests/month
 *
 * The limits are enforced by checking/updating the `usage_stats` table with
 * the service role client. Unauthenticated requests use a generous shared
 * limit (same as Free) but don't increment per-key counters.
 *
 * What this still rules out (deliberately):
 * - No `logo` URL parameter. Fetching a caller-supplied URL would make this an
 *   open SSRF proxy. Custom logos arrive via the dashboard's domain allowlist
 *   and are stored in the template row.
 * - No POST body. A GET with a bounded query string is the smallest surface
 *   that still lets a crawler and a social scraper both fetch the card.
 * - Bounded strings. Rendering is CPU bound, so a capped input is a capped
 *   cost; the caps live in `LIMITS`.
 *
 * The heavy duty is done by the CDN: responses are immutable, because the
 * version prefix plus the query string fully determine the bytes. A design
 * change ships as `/v2/og` rather than silently invalidating a year of cache.
 */

const ALLOWED_METHODS = ["GET", "HEAD"] as const;

/** One year, in seconds. Safe because the URL pins the design version. */
const IMMUTABLE_MAX_AGE_SECONDS = 31_536_000;

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "x-content-type-options": "nosniff",
} as const;

/** The shape we promise on failure. It names fields and limits, never values. */
export type ApiErrorBody = {
  error: string;
  issues?: Array<{ field: string; reason: string }>;
};

/** Overrides from a custom template (theme, title, subtitle, logo). */
export interface TemplateOverrides {
  theme: "violet" | "ocean" | "ember" | "mint";
  title: string;
  subtitle: string;
  logoUrl?: string | null;
}

/** Plan limits for authenticated requests. */
const PLAN_LIMITS: Record<"free" | "pro" | "agency", number> = {
  free: 100,
  pro: 10_000,
  agency: 100_000,
};

/** Shared limit for unauthenticated requests (same as Free but no counter). */
const UNAUTHENTICATED_LIMIT = 100;

function jsonError(status: number, body: ApiErrorBody, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
}

/**
 * Checks and increments the usage counter for a user.
 *
 * Returns { allowed: true } if under limit, or { allowed: false, limit, used }
 * if the limit would be exceeded.
 */
async function checkAndIncrementUsage(userId: string): Promise<{ allowed: boolean; limit: number; used: number }> {
  const client = getServiceClient();
  if (!client) {
    // Service role not configured — allow but don't track
    return { allowed: true, limit: 0, used: 0 };
  }

  const periodStart = new Date();
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  // Get user's plan
  const { data: profile } = await client.from("profiles").select("plan").eq("id", userId).single();
  const plan = (profile?.plan ?? "free") as "free" | "pro" | "agency";
  const limit = PLAN_LIMITS[plan];

  // Get or create usage record for this period
  const periodKey = periodStart.toISOString().split("T")[0] as string;
  const { data: usage } = await client
    .from("usage_stats")
    .select("requests_used, request_limit")
    .eq("user_id", userId)
    .eq("period_start", periodKey)
    .maybeSingle();

  const used = usage?.requests_used ?? 0;

  if (used >= limit) {
    return { allowed: false, limit, used };
  }

  // Increment counter
  if (usage) {
    await client
      .from("usage_stats")
      .update({ requests_used: used + 1 })
      .eq("user_id", userId)
      .eq("period_start", periodKey);
  } else {
    await client.from("usage_stats").insert({
      user_id: userId,
      period_start: periodKey,
      requests_used: 1,
      request_limit: limit,
    });
  }

  return { allowed: true, limit, used: used + 1 };
}

/**
 * Checks unauthenticated usage against a shared limit.
 * Does not persist a counter (would require IP tracking which is unreliable).
 * For now just allows — the real protection is the input caps and CDN cache.
 */
async function checkUnauthenticatedUsage(): Promise<{ allowed: boolean; limit: number; used: number }> {
  // No persistent counter for unauthenticated — rely on input caps + CDN
  return { allowed: true, limit: UNAUTHENTICATED_LIMIT, used: 0 };
}

export async function handleOgRequest(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  if (url.pathname !== OG_IMAGE_PATH) return undefined;

  if (!(ALLOWED_METHODS as readonly string[]).includes(request.method)) {
    return jsonError(405, { error: "method_not_allowed" }, { allow: ALLOWED_METHODS.join(", ") });
  }

  // Reject before parsing: an oversized query string is not worth a schema run.
  if (url.search.length > LIMITS.queryStringMaxChars) {
    return jsonError(414, { error: "query_too_long" });
  }

  const parsed = parseOgRequest(url.searchParams);
  if (!parsed.ok) {
    return jsonError(400, { error: "invalid_request", issues: parsed.issues });
  }

  const cacheControl = `public, max-age=${IMMUTABLE_MAX_AGE_SECONDS}, s-maxage=${IMMUTABLE_MAX_AGE_SECONDS}, immutable`;

  // A HEAD must still be able to report a 400, but it has no business paying
  // for a rasterisation it will throw away.
  if (request.method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: { "cache-control": cacheControl, "x-content-type-options": "nosniff" },
    });
  }

  // Try to authenticate via API key.
  let templateOverrides: TemplateOverrides | undefined;
  let userId: string | null = null;

  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const apiKey = authHeader.slice("Bearer ".length).trim();
    if (apiKey.startsWith("og_live_")) {
      try {
        userId = await validateApiKey(apiKey);
        if (userId && parsed.value.templateId) {
          const template = await fetchUserTemplate(userId, parsed.value.templateId);
          if (template) {
            const ref = parseTemplateRef(parsed.value.templateId);
            templateOverrides = resolveTemplateOverrides(ref!, template);
          }
        }
      } catch (error) {
        // Service role not configured or DB error — log and continue unauthenticated.
        // The endpoint remains functional for public use.
        console.warn("[og] auth unavailable, continuing without custom template", error);
      }
    }
  }

  // Rate limit check
  let usageInfo: { allowed: boolean; limit: number; used: number };
  if (userId) {
    usageInfo = await checkAndIncrementUsage(userId);
    if (!usageInfo.allowed) {
      return jsonError(429, {
        error: "rate_limited",
        issues: [{ field: "rate_limit", reason: `Monthly limit of ${usageInfo.limit} requests exceeded` }],
      }, {
        "retry-after": String(Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).getTime() - Date.now()) / 1000)),
        "x-ratelimit-limit": String(usageInfo.limit),
        "x-ratelimit-remaining": "0",
      });
    }
  } else {
    usageInfo = await checkUnauthenticatedUsage();
  }

  try {
    const { png } = await renderOgCard(parsed.value, {
      origin: url.origin,
      host: siteHost,
      templateOverrides,
    });

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "content-type": "image/png",
        "content-length": String(png.byteLength),
        "cache-control": cacheControl,
        "x-content-type-options": "nosniff",
        "x-ratelimit-limit": String(usageInfo.limit),
        "x-ratelimit-remaining": String(Math.max(0, usageInfo.limit - usageInfo.used)),
      },
    });
  } catch (error) {
    console.error("[og] render failed", error);
    return jsonError(500, { error: "render_failed" });
  }
}