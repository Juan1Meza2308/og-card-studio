import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { OgCard, type OgCardProps } from "./card";
import { CARD_HEIGHT, CARD_WIDTH, FONT_ASSET_BASE, FONT_FAMILY } from "./constants";
import type { OgRequest } from "./schema";

/** Font descriptor in the shape satori expects. */
type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 400 | 700;
  style: "normal";
};

const REGULAR_FILE = "Inter_400Regular.ttf";
const BOLD_FILE = "Inter_700Bold.ttf";

/** Guards against a slow or misconfigured static host stalling a cold start. */
const FONT_FETCH_TIMEOUT_MS = 5_000;

/**
 * Cached across the lifetime of the instance.
 *
 * Caching the *promise* rather than the result means concurrent first requests
 * share a single fetch instead of each starting their own. On a warm instance
 * this is one memory read; on a cold one it costs two parallel static requests.
 */
let fontsPromise: Promise<SatoriFont[]> | undefined;

async function fetchFont(origin: string, file: string): Promise<ArrayBuffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FONT_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${origin}${FONT_ASSET_BASE}/${file}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`font ${file} responded ${response.status}`);
    }
    return await response.arrayBuffer();
  } finally {
    clearTimeout(timer);
  }
}

async function loadFonts(origin: string): Promise<SatoriFont[]> {
  if (!fontsPromise) {
    fontsPromise = Promise.all([fetchFont(origin, REGULAR_FILE), fetchFont(origin, BOLD_FILE)])
      .then(([regular, bold]) => [
        {
          name: FONT_FAMILY,
          data: regular,
          weight: 400 as const,
          style: "normal" as const,
        },
        { name: FONT_FAMILY, data: bold, weight: 700 as const, style: "normal" as const },
      ])
      .catch((error: unknown) => {
        // Do not memoise a failure: a later request should be able to retry.
        fontsPromise = undefined;
        throw error;
      });
  }
  return fontsPromise;
}

/**
 * Fonts are served as static assets and fetched from the deployment that
 * received the request, rather than from a configured host, so a preview
 * deployment renders with its own fonts and never reaches across origins.
 */
async function getFonts(origin: string): Promise<SatoriFont[]> {
  return fontsPromise ?? loadFonts(origin);
}

export type RenderedCard = {
  png: Uint8Array;
  width: number;
  height: number;
};

/**
 * Card tree to PNG: satori lays the tree out and emits an SVG, resvg
 * rasterises it. The two are split because satori only understands a small
 * subset of CSS, which is why `OgCard` is written in plain inline styles.
 *
 * Fonts are a parameter rather than loaded here, so the same code path renders
 * from the CDN in production and from disk in the verification script. There is
 * only one renderer either way, which is the point.
 */
export async function rasterizeCard(
  props: OgCardProps,
  fonts: SatoriFont[],
): Promise<RenderedCard> {
  const svg = await satori(OgCard(props), {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts,
  });

  const png = new Resvg(svg, { fitTo: { mode: "width", value: CARD_WIDTH } }).render().asPng();

  return { png, width: CARD_WIDTH, height: CARD_HEIGHT };
}

/** Production path: fonts from the deployment's own static assets, then render. */
export async function renderOgCard(
  request: OgRequest,
  options: { origin: string; host: string },
): Promise<RenderedCard> {
  return rasterizeCard(
    {
      title: request.title,
      subtitle: request.subtitle,
      template: request.template,
      theme: request.theme,
      host: options.host,
    },
    await getFonts(options.origin),
  );
}

/** Test seam: drops the cached fonts. */
export function resetFontCache(): void {
  fontsPromise = undefined;
}
