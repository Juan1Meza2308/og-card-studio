/**
 * Geometry, limits and vocabulary for the OG image endpoint.
 *
 * Everything the renderer and the browser preview need to agree on lives here,
 * so the two can never drift: both read the same canvas size, the same
 * truncation rules and the same list of valid templates.
 */

/** Open Graph's recommended size. Twitter/X reads the same 1.91:1 ratio. */
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

/** Typeface files served as static assets and fetched once per cold start. */
export const FONT_ASSET_BASE = "/og/fonts";

export const FONT_FAMILY = "Inter";

/**
 * Input caps. Rendering is CPU-bound, so the length of the strings we accept
 * is the cheapest and most effective denial-of-service control we have: a
 * bounded string is a bounded render.
 */
export const LIMITS = {
  /**
   * Sized so the longest accepted title still fits the card in `titleLineClamp`
   * lines. Verified by the overflow probe, not by arithmetic.
   */
  titleMaxChars: 90,
  subtitleMaxChars: 140,
  /** A bare `?` still returns a usable card instead of an error. */
  titleFallback: "Una imagen para tu próxima publicación",
  subtitleFallback: "og:title, og:description, og:image",
  /** Refuse absurd URLs before spending anything on parsing them. */
  queryStringMaxChars: 2048,
} as const;

export const DEFAULT_TEMPLATE = "tech";
export const DEFAULT_THEME = "violet";

export const TEMPLATE_IDS = ["tech", "minimalist", "dark-gradient", "clean-white"] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const THEME_IDS = ["violet", "ocean", "ember", "mint"] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const TEMPLATE_LABELS: Record<TemplateId, string> = {
  tech: "Tech",
  minimalist: "Minimalist",
  "dark-gradient": "Dark Gradient",
  "clean-white": "Clean White",
};

export const THEME_LABELS: Record<ThemeId, string> = {
  violet: "Violet pulse",
  ocean: "Electric ocean",
  ember: "Warm ember",
  mint: "Signal mint",
};

/** How a template wants its text stacked, and how many lines it tolerates. */
export type CardLayout = {
  /** Whether the brand row sits above or below the text block. */
  brandPlacement: "top" | "bottom";
  /** Vertical justification of the text block within the free space. */
  bodyJustify: "flex-end" | "center";
  /** Horizontal placement of the text block. */
  textAlign: "left" | "center";
  /** Upper bound on wrapped lines, so a long title can never overflow. */
  titleLineClamp: number;
  subtitleLineClamp: number;
  /** Gap under the eyebrow row, above the title. */
  titleMarginTop: number;
  subtitleMarginTop: number;
  /** Size of the square accent mark next to the eyebrow. */
  ruleWidth: number;
  eyebrowFontSize: number;
  titleFontSize: number;
  subtitleFontSize: number;
};

/**
 * Per-template layout. The values are tuned so that a title at the maximum
 * allowed length still fits inside the canvas without clipping.
 */
export const CARD_LAYOUTS: Record<TemplateId, CardLayout> = {
  tech: {
    brandPlacement: "top",
    bodyJustify: "flex-end",
    textAlign: "left",
    titleLineClamp: 3,
    subtitleLineClamp: 2,
    titleMarginTop: 40,
    subtitleMarginTop: 24,
    ruleWidth: 40,
    eyebrowFontSize: 26,
    titleFontSize: 64,
    subtitleFontSize: 28,
  },
  minimalist: {
    brandPlacement: "bottom",
    bodyJustify: "center",
    textAlign: "center",
    titleLineClamp: 3,
    subtitleLineClamp: 2,
    titleMarginTop: 32,
    subtitleMarginTop: 20,
    ruleWidth: 24,
    eyebrowFontSize: 22,
    titleFontSize: 60,
    subtitleFontSize: 26,
  },
  "dark-gradient": {
    brandPlacement: "bottom",
    bodyJustify: "center",
    textAlign: "center",
    titleLineClamp: 3,
    subtitleLineClamp: 2,
    titleMarginTop: 36,
    subtitleMarginTop: 22,
    ruleWidth: 56,
    eyebrowFontSize: 24,
    titleFontSize: 72,
    subtitleFontSize: 28,
  },
  "clean-white": {
    brandPlacement: "bottom",
    bodyJustify: "center",
    textAlign: "center",
    titleLineClamp: 3,
    subtitleLineClamp: 2,
    titleMarginTop: 32,
    subtitleMarginTop: 20,
    ruleWidth: 32,
    eyebrowFontSize: 22,
    titleFontSize: 64,
    subtitleFontSize: 26,
  },
};

/** Padding of the card body, kept in sync for every template. */
export const CARD_PADDING = 72;
