import { z } from "zod";

/**
 * Public origin for canonical links, Open Graph URLs and structured data.
 *
 * This has to be configured, never guessed. A canonical pointing at a domain
 * this app does not serve is worse than no canonical at all: it tells crawlers
 * the real page lives somewhere else, so the page never gets indexed as itself.
 */
const DEV_ORIGIN = "http://localhost:3000";

const siteUrlSchema = z
  .string()
  .trim()
  .min(1, "VITE_SITE_URL is empty")
  .url("VITE_SITE_URL must be a valid URL")
  // Trailing slashes would double up when paths are appended.
  .transform((value) => value.replace(/\/+$/, ""));

function resolveSiteUrl(): string {
  const configured = import.meta.env["VITE_SITE_URL"] || process.env["VITE_SITE_URL"] || "";

  if (!configured) {
    if (import.meta.env.DEV) return DEV_ORIGIN;
    throw new Error(
      "VITE_SITE_URL is required in production. Set it to the origin this app is served from, " +
        "otherwise canonical and og:url tags will point at a domain you do not control.",
    );
  }

  const parsed = siteUrlSchema.safeParse(configured);
  if (!parsed.success) {
    throw new Error(
      `Invalid VITE_SITE_URL (${configured}): ${parsed.error.issues
        .map((issue) => issue.message)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

export const siteUrl = resolveSiteUrl();

/**
 * Host without protocol, for the brand line drawn inside rendered cards.
 * Derived rather than written out so the mockups can never advertise a domain
 * this deployment does not actually serve.
 */
export const siteHost = new URL(siteUrl).host;
