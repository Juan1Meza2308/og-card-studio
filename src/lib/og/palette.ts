import type { TemplateId, ThemeId } from "./constants";

/**
 * Colours resolved for one (template, theme) pair.
 *
 * Satori only understands plain CSS colours, so everything here is hex or rgba.
 * The stylesheet keeps using oklch for the surrounding UI; these values are the
 * rasterised equivalent and are intentionally not read from CSS variables.
 */
export type CardPalette = {
  /** Solid layer, always present so the PNG never has transparent corners. */
  backgroundColor: string;
  /** Gradient layers, painted on top of the solid one. Optional. */
  backgroundImage?: string;
  ink: string;
  inkMuted: string;
  accent: string;
  /** True for the light template; flips rule and footer contrast. */
  isLight: boolean;
};

/** Accent / mid / deep for each theme, matching the playground's swatches. */
type ThemeRamp = {
  accent: string;
  mid: string;
  deep: string;
};

const THEME_RAMPS: Record<ThemeId, ThemeRamp> = {
  violet: { accent: "#6d28d9", mid: "#312e81", deep: "#09090b" },
  ocean: { accent: "#0369a1", mid: "#164e63", deep: "#09090b" },
  ember: { accent: "#be123c", mid: "#7c2d12", deep: "#09090b" },
  mint: { accent: "#047857", mid: "#134e4a", deep: "#09090b" },
};

const NEUTRAL_DARK = "#0a0a0c";
const NEUTRAL_INK = "#111113";

export function resolvePalette(template: TemplateId, theme: ThemeId): CardPalette {
  const ramp = THEME_RAMPS[theme];

  switch (template) {
    case "tech":
      return {
        backgroundColor: NEUTRAL_DARK,
        backgroundImage: `radial-gradient(1000px 700px at 10% 0%, ${withAlpha(ramp.accent, 0.38)} 0%, transparent 62%)`,
        ink: "#ffffff",
        inkMuted: "#d4d4d8",
        accent: ramp.accent,
        isLight: false,
      };
    case "minimalist":
      return {
        backgroundColor: NEUTRAL_DARK,
        backgroundImage: `radial-gradient(760px 520px at 50% 0%, ${withAlpha(ramp.accent, 0.2)} 0%, transparent 68%)`,
        ink: "#ffffff",
        inkMuted: "#a1a1aa",
        accent: ramp.accent,
        isLight: false,
      };
    case "dark-gradient":
      return {
        backgroundColor: ramp.deep,
        backgroundImage: `linear-gradient(135deg, ${ramp.accent} 0%, ${ramp.mid} 55%, ${ramp.deep} 100%)`,
        ink: "#ffffff",
        inkMuted: withAlpha("#ffffff", 0.82),
        accent: "#ffffff",
        isLight: false,
      };
    case "clean-white":
      return {
        backgroundColor: "#ffffff",
        ink: NEUTRAL_INK,
        inkMuted: "#52525b",
        accent: ramp.accent,
        isLight: true,
      };
  }
}

/**
 * CSS background for the theme swatches in the playground, built from the same
 * ramp the cards use so a swatch can never advertise a colour the API drops.
 */
export function themeSwatch(theme: ThemeId): string {
  const ramp = THEME_RAMPS[theme];
  return `linear-gradient(135deg, ${ramp.accent}, ${ramp.mid}, ${ramp.deep})`;
}

/** Transparent variant of a hex colour, for hairlines and muted text. */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
