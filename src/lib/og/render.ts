import { OgCard } from "./card";
import { ImageResponse } from "./vercel-og";
import { CARD_HEIGHT, CARD_WIDTH, FONT_ASSET_BASE, FONT_FAMILY } from "./constants";
import type { OgRequest } from "./schema";

/** Font descriptor in the shape `ImageResponse` expects. */
type OgFont = {
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
let fontsPromise: Promise<OgFont[]> | undefined;

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

async function loadFonts(origin: string): Promise<OgFont[]> {
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
async function getFonts(origin: string): Promise<OgFont[]> {
  return fontsPromise ?? loadFonts(origin);
}

export type RenderedCard = {
  png: Uint8Array;
  width: number;
  height: number;
};

export async function renderOgCard(
  request: OgRequest,
  options: { origin: string; host: string },
): Promise<RenderedCard> {
  const fonts = await getFonts(options.origin);

  const response = new ImageResponse(
    OgCard({
      title: request.title,
      subtitle: request.subtitle,
      template: request.template,
      theme: request.theme,
      host: options.host,
    }),
    { width: CARD_WIDTH, height: CARD_HEIGHT, fonts },
  );

  const buffer = await response.arrayBuffer();

  return { png: new Uint8Array(buffer), width: CARD_WIDTH, height: CARD_HEIGHT };
}

/** Test seam: drops the cached fonts. */
export function resetFontCache(): void {
  fontsPromise = undefined;
}
