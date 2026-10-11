import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { installCommonJsGlobals, REQUIRED_GLOBALS } from "./lib/og/cjs-globals";

/**
 * Security headers applied to all responses.
 * CSP is strict by default - only 'self' sources allowed.
 * Adjust script-src/style-src if you need inline scripts/styles.
 */
const SECURITY_HEADERS: Record<string, string> = {
  // Prevent MIME type sniffing
  "x-content-type-options": "nosniff",

  // Prevent clickjacking
  "x-frame-options": "DENY",

  // Enable XSS protection (legacy but harmless)
  "x-xss-protection": "1; mode=block",

  // Referrer policy - don't leak referrer to cross-origin
  "referrer-policy": "strict-origin-when-cross-origin",

  // Permissions policy - disable unused browser features
  "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",

  // HSTS - only set in production (via env check)
  // "strict-transport-security": "max-age=31536000; includeSubDomains; preload",
};

/**
 * Content Security Policy - strict by default.
 * Adjust based on your needs. Report violations to /api/csp-report if needed.
 */
function buildCspHeader(isDev: boolean): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    // Scripts: self + inline for theme/oauth scripts (required by TanStack Start)
    `script-src 'self' ${isDev ? "'unsafe-eval'" : ""} 'unsafe-inline'`,
    // Styles: self + inline for Tailwind/emotion
    "style-src 'self' 'unsafe-inline'",
    // Fonts: self + data URIs
    "font-src 'self' data:",
    // Images: self + data URIs + HTTPS (for og:image generation)
    "img-src 'self' data: https:",
    // Connect: self + Supabase + Stripe
    "connect-src 'self' https://*.supabase.co https://api.stripe.com wss://*.supabase.co",
    // Media: none for now
    "media-src 'none'",
    // Workers: self only
    "worker-src 'self' blob:",
    // Manifest: self
    "manifest-src 'self'",
  ];

  return directives.join("; ");
}

function applySecurityHeaders(response: Response, isDev: boolean): Response {
  const newHeaders = new Headers(response.headers);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    newHeaders.set(key, value);
  }
  newHeaders.set("content-security-policy", buildCspHeader(isDev));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}

/**
 * Fixed-window throttle for state-changing API requests.
 *
 * In-memory and per-instance on purpose: it is a cheap first line of defence,
 * while the durable limits live in Supabase and the CDN. Keyed by client IP
 * only. A shared user-agent bucket would punish every visitor behind the same
 * browser, so when no forwarding header is present we simply do not limit.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 30;
const RATE_LIMIT_SWEEP_INTERVAL_MS = 5 * 60_000;

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
let lastRateLimitSweep = Date.now();

function sweepRateLimitBuckets(now: number): void {
  if (now - lastRateLimitSweep < RATE_LIMIT_SWEEP_INTERVAL_MS) return;
  lastRateLimitSweep = now;
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
  }
}

function clientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0];
    if (first) return first.trim();
  }
  return request.headers.get("x-real-ip") ?? request.headers.get("cf-connecting-ip");
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  sweepRateLimitBuckets(now);
  const bucket = rateLimitBuckets.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
}

const installedGlobals = installCommonJsGlobals();
if (installedGlobals.length < REQUIRED_GLOBALS.length) {
  console.warn(
    `[og] renderer sin todos los globales de CommonJS (faltan: ${REQUIRED_GLOBALS.filter(
      (name) => !installedGlobals.includes(name),
    ).join(", ")})`,
  );
}

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type OgHandler = (request: Request) => Promise<Response | undefined>;

let ogHandlerPromise: Promise<OgHandler> | undefined;

/**
 * The image handler is loaded on the first request instead of at the top of
 * this file, and the ordering is the whole point.
 *
 * `@vercel/og` needs the CommonJS globals installed above, but static imports
 * are evaluated before the body of the importing module runs, so a plain
 * top-level import would load the library before the globals exist and it would
 * throw while loading. Rollup makes that worse rather than better: it hoists
 * external imports to the top of the output chunk, above everything else in the
 * file, so neither the order of the imports nor a top-level `await import()` can
 * win. A dynamic import inside `fetch` is the one form that stays lazy, and by
 * the time it runs this module's body has already executed.
 *
 * The cost is one chunk load on the first hit, after which it is cached.
 */
function getOgHandler(): Promise<OgHandler> {
  if (!ogHandlerPromise) {
    ogHandlerPromise = import("./lib/og/handler").then((m) => m.handleOgRequest);
  }
  return ogHandlerPromise;
}

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const isDev = import.meta.env.DEV;
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // Throttle state-changing API calls. The Stripe webhook is excluded: it is
    // signature-verified upstream and must never be dropped by a throttle.
    if (
      method !== "GET" &&
      method !== "HEAD" &&
      url.pathname.startsWith("/api/") &&
      url.pathname !== "/api/stripe/webhook"
    ) {
      const ip = clientIp(request);
      if (ip && isRateLimited(ip)) {
        return applySecurityHeaders(
          new Response(JSON.stringify({ error: "rate_limited" }), {
            status: 429,
            headers: { "content-type": "application/json; charset=utf-8", "retry-after": "60" },
          }),
          isDev,
        );
      }
    }

    // The OG image endpoint, served before the SSR handler because it never
    // touches the router. Returns undefined for every other path.
    const ogResponse = await (await getOgHandler())(request);
    if (ogResponse) return applySecurityHeaders(ogResponse, isDev);

    // Readiness probe for load balancers and uptime monitors. It reports the
    // renderer's real dependencies, and answers 503 when they are not there,
    // because a monitor that is told "ok" by a broken renderer is worse than
    // no monitor.
    if (url.pathname === "/api/health") {
      const { checkRendererReadiness } = await import("./lib/og/readiness");
      const readiness = await checkRendererReadiness();
      return applySecurityHeaders(
        new Response(
          JSON.stringify({
            ok: readiness.ok,
            service: "ogcraft",
            ts: Date.now(),
            checks: readiness.checks,
          }),
          {
            status: readiness.ok ? 200 : 503,
            headers: {
              "content-type": "application/json; charset=utf-8",
              "cache-control": "no-store",
            },
          },
        ),
        isDev,
      );
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applySecurityHeaders(normalized, isDev);
    } catch (error) {
      console.error(error);
      return applySecurityHeaders(
        new Response(renderErrorPage(), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
        isDev,
      );
    }
  },
};
