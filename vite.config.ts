import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { CRAWL_BLOCKED_PATHS, PUBLIC_ROUTES } from "./src/lib/public-routes";

function readSiteUrl(): string {
  const raw = process.env["VITE_SITE_URL"] ?? "";
  if (!raw) {
    throw new Error(
      "VITE_SITE_URL is required. robots.txt and sitemap.xml are generated from it, " +
        "and a sitemap pointing at a domain you do not serve gets the whole site ignored.",
    );
  }
  return raw.replace(/\/+$/, "");
}

function buildRobots(siteUrl: string): string {
  const agents = ["Googlebot", "Bingbot", "Twitterbot", "facebookexternalhit", "*"];
  const blocks = CRAWL_BLOCKED_PATHS.map((path) => `Disallow: ${path}`).join("\n");
  const groups = agents.map((agent) => `User-agent: ${agent}\nAllow: /\n${blocks}`).join("\n\n");

  return `${groups}\n\n# /dashboard and /auth stay crawlable on purpose: blocking them hides the\n# noindex tag from crawlers, which leaves the URL listed as "indexed, blocked".\n# The image endpoint is the opposite case — every crawl would burn a render.\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

function buildSitemap(siteUrl: string, lastmod: string): string {
  const entries = PUBLIC_ROUTES.map(
    ({ path, changefreq, priority }) =>
      `  <url><loc>${siteUrl}${path}</loc><lastmod>${lastmod}</lastmod>` +
      `<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

/**
 * robots.txt and sitemap.xml are generated instead of committed, because both
 * are absolute-URL documents. A committed copy drifts from the deployed origin
 * and quietly tells crawlers the real pages live somewhere else.
 */
function crawlFiles(): Plugin {
  let siteUrl = "";
  let lastmod = "";

  const resolve = () => {
    siteUrl = readSiteUrl();
    // Build date, not a hand-edited constant: Google re-crawls on a changed
    // lastmod, so a stale one costs crawl budget without buying anything.
    lastmod = new Date().toISOString().slice(0, 10);
  };

  return {
    name: "ogcraft-crawl-files",
    configResolved() {
      resolve();
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url ?? "").split("?")[0];
        const isRobots = url === "/robots.txt";
        const isSitemap = url === "/sitemap.xml";
        if (!isRobots && !isSitemap) return next();

        const body = isRobots ? buildRobots(siteUrl) : buildSitemap(siteUrl, lastmod);
        res.setHeader("content-type", "text/plain; charset=utf-8");
        res.end(body);
      });
    },
    generateBundle() {
      this.emitFile({ type: "asset", fileName: "robots.txt", source: buildRobots(siteUrl) });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: buildSitemap(siteUrl, lastmod),
      });
    },
  };
}

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
  },
  // nitro() emits the deploy-anywhere server build that Vercel runs as a
  // function. Without it the build only emits a bare fetch handler and the
  // "tanstack-start" preset has no output to serve.
  plugins: [
    tanstackStart(),
    // satori reaches text shaping through harfbuzzjs and lays text out through
    // yoga. Both are wasm, and both are loaded by a path computed at runtime
    // (`__dirname + "/hb.wasm"`) rather than by an import, so dependency
    // tracing sees no reference and leaves the files out of the build. Tracing
    // each package whole puts the wasm next to the code that opens it, which
    // is also what lets the renderer resolve that directory at request time
    // instead of hardcoding a layout.
    nitro({
      // The trailing * asks for a full package trace, wasm included.
      traceDeps: ["satori*", "harfbuzzjs*", "@resvg/resvg-js*"],
    }),
    crawlFiles(),
    viteReact(),
    tailwindcss(),
    viteTsConfigPaths(),
  ],
});
