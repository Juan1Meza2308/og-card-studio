import type { CSSProperties, ReactElement } from "react";
import {
  CARD_HEIGHT,
  CARD_LAYOUTS,
  CARD_PADDING,
  CARD_WIDTH,
  FONT_FAMILY,
  type TemplateId,
  type ThemeId,
} from "./constants";
import { resolvePalette, withAlpha } from "./palette";

/** The public name shown in the card footer. */
export const BRAND_NAME = "OGCraft";

export type OgCardProps = {
  title: string;
  subtitle: string;
  template: TemplateId;
  theme: ThemeId;
  /**
   * Shown in the footer. Passed in rather than read from the environment so the
   * component stays pure: the same tree renders on the server, in the browser
   * preview and in tests, with no `import.meta.env` in sight.
   */
  host: string;
  brand?: string;
};

/**
 * The OG card, written once for two very different consumers: satori on the
 * server and React on the client.
 *
 * The constraint that shapes every line below is that satori only understands
 * a small subset of CSS — no Tailwind, no CSS variables, no `clamp()`, no
 * `oklch()`, no system font stacks. So this file is inline styles only, with
 * every value coming from `constants.ts` or the palette. The browser preview
 * renders this exact component and scales it, which is why what you see on
 * the playground is the same pixels the API returns.
 */
export function OgCard({
  title,
  subtitle,
  template,
  theme,
  host,
  brand = BRAND_NAME,
}: OgCardProps): ReactElement {
  const layout = CARD_LAYOUTS[template];
  const palette = resolvePalette(template, theme);

  // Satori reads the style object verbatim, so a key that is present but
  // undefined makes it throw while parsing the value. The gradient key is
  // therefore added only when there is a gradient to add.
  const root: CSSProperties = {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    display: "flex",
    flexDirection: "column",
    backgroundColor: palette.backgroundColor,
    color: palette.ink,
    fontFamily: FONT_FAMILY,
    // Keeps the flex children from spilling past the rounded canvas.
    overflow: "hidden",
    ...(palette.backgroundImage ? { backgroundImage: palette.backgroundImage } : {}),
  };

  const brandRow = (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            backgroundColor: palette.accent,
            marginRight: 14,
          }}
        />
        <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.4 }}>{brand}</div>
      </div>
      <div style={{ fontSize: 22, fontWeight: 400, color: palette.inkMuted }}>{host}</div>
    </div>
  );

  const body = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: layout.bodyJustify,
        flexGrow: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: layout.textAlign === "center" ? "center" : "flex-start",
        }}
      >
        <div
          style={{
            width: layout.ruleWidth,
            height: 4,
            borderRadius: 2,
            backgroundColor: withAlpha(palette.accent, palette.isLight ? 1 : 0.85),
            marginRight: 18,
          }}
        />
        <div
          style={{
            fontSize: layout.eyebrowFontSize,
            fontWeight: 400,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: palette.inkMuted,
          }}
        >
          {brand}
        </div>
      </div>

      <div
        style={{
          fontSize: layout.titleFontSize,
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: -1.6,
          marginTop: layout.titleMarginTop,
          textAlign: layout.textAlign,
          lineClamp: layout.titleLineClamp,
          overflow: "hidden",
        }}
      >
        {title}
      </div>

      {subtitle.length > 0 ? (
        <div
          style={{
            fontSize: layout.subtitleFontSize,
            fontWeight: 400,
            lineHeight: 1.35,
            marginTop: layout.subtitleMarginTop,
            textAlign: layout.textAlign,
            color: palette.inkMuted,
            lineClamp: layout.subtitleLineClamp,
            overflow: "hidden",
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );

  const padded: CSSProperties = {
    padding: CARD_PADDING,
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
  };

  return (
    <div style={root}>
      <div style={padded}>
        {layout.brandPlacement === "top" ? brandRow : null}
        {body}
        {layout.brandPlacement === "bottom" ? brandRow : null}
      </div>
    </div>
  );
}
