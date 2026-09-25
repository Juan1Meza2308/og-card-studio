import { siteHost } from "@/lib/site";
import { LIMITS } from "./constants";
import { renderOgCard } from "./render";
import { parseOgRequest } from "./schema";
import { OG_IMAGE_PATH } from "./url";

/**
 * The image endpoint.
 *
 * Public and unauthenticated by design for now, so everything here assumes the
 * caller is hostile. What that rules out, deliberately:
 *
 * - No `logo` or any other URL parameter. Fetching a caller-supplied URL would
 *   make this an open SSRF proxy: cloud metadata endpoints, private hosts and
 *   request amplification, all reachable without a key. It arrives later,
 *   behind the dashboard's domain allowlist.
 * - No POST body. A GET with a bounded query string is the smallest surface
 *   that still lets a crawler and a social scraper both fetch the card.
 * - Bounded strings. Rendering is CPU bound, so a capped input is a capped
 *   cost; the caps live in `LIMITS`.
 *
 * Rate limiting is deliberately absent here. An in-process counter would only
 * ever see one lambda instance, so it would look like protection while
 * providing none against a distributed caller. The real controls are the
 * input caps and the CDN cache below; per-key limits arrive with the API key
 * in the phase that introduces auth.
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
type ApiErrorBody = {
  error: string;
  issues?: Array<{ field: string; reason: string }>;
};

function jsonError(status: number, body: ApiErrorBody, extraHeaders: HeadersInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, ...extraHeaders },
  });
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

  try {
    const { png } = await renderOgCard(parsed.value, { origin: url.origin, host: siteHost });

    return new Response(new Uint8Array(png), {
      status: 200,
      headers: {
        "content-type": "image/png",
        "content-length": String(png.byteLength),
        "cache-control": cacheControl,
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    // The detail goes to the log; the caller gets a code it can act on. An
    // exception message from satori can carry fragments of the input.
    console.error("[og] render failed", error);
    return jsonError(500, { error: "render_failed" });
  }
}
