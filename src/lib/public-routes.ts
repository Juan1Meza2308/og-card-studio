/**
 * Routes that belong in the sitemap, with their crawl hints.
 *
 * Private surfaces are deliberately absent: blocking them in robots.txt hides
 * the noindex tag from crawlers, which leaves the URL listed as
 * "indexed, blocked" instead of simply not indexed. Those pages carry a
 * noindex meta of their own.
 */
export type PublicRoute = {
  path: string;
  changefreq: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
  priority: string;
};

export const PUBLIC_ROUTES: readonly PublicRoute[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/features", changefreq: "monthly", priority: "0.8" },
  { path: "/playground", changefreq: "weekly", priority: "0.9" },
  { path: "/pricing", changefreq: "monthly", priority: "0.8" },
  { path: "/docs", changefreq: "weekly", priority: "0.7" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/status", changefreq: "hourly", priority: "0.4" },
];

/** Paths that must never be crawled. Each crawl of the image endpoint burns a render. */
export const CRAWL_BLOCKED_PATHS: readonly string[] = ["/api/", "/v1/"];
