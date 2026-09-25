import { DEFAULT_TEMPLATE, DEFAULT_THEME } from "./constants";
import type { TemplateId, ThemeId } from "./constants";

/**
 * The path prefix that pins a card design version.
 *
 * Every card URL carries it, so a redesign ships as `/v2/og` and every URL
 * already in the wild keeps rendering the picture it was promised. That is
 * what makes the endpoint safe to cache immutably: a cached response can
 * never be wrong, only outdated, and outdated is a different URL.
 */
export const OG_IMAGE_PATH = "/v1/og";

export type OgCardQuery = {
  title?: string;
  subtitle?: string;
  template?: TemplateId;
  theme?: ThemeId;
};

/**
 * Builds a card URL.
 *
 * `URLSearchParams` does the encoding, which matters: a title with an ampersand
 * or an accented character has to survive being embedded in an `og:image` meta
 * tag, which is parsed as an HTML attribute.
 *
 * Blank values are dropped rather than sent, so the endpoint applies its own
 * fallback and the preview and the served image can never disagree about what
 * an empty title means.
 */
export function ogCardUrl(origin: string, query: OgCardQuery = {}): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && value.trim() !== "") {
      params.set(key, value.trim());
    }
  }

  const search = params.toString();
  const base = `${origin.replace(/\/+$/, "")}${OG_IMAGE_PATH}`;
  return search ? `${base}?${search}` : base;
}

/** The card this site shares about itself, rendered by this site's endpoint. */
export function brandCardUrl(origin: string): string {
  return ogCardUrl(origin, {
    title: "OGCraft",
    subtitle: "Dynamic Open Graph images from a single URL",
    template: DEFAULT_TEMPLATE,
    theme: DEFAULT_THEME,
  });
}
