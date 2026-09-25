import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { installCommonJsGlobals, REQUIRED_GLOBALS } from "./lib/og/cjs-globals";

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
    // The OG image endpoint, served before the SSR handler because it never
    // touches the router. Returns undefined for every other path.
    const ogResponse = await (await getOgHandler())(request);
    if (ogResponse) return ogResponse;

    // Health probe for load balancers and uptime monitors.
    if (request.url.endsWith("/api/health")) {
      return new Response(JSON.stringify({ ok: true, service: "ogcraft", ts: Date.now() }), {
        status: 200,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
