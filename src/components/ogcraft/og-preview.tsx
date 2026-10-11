import { useEffect, useRef, useState } from "react";
import { OgCard } from "@/lib/og/card";
import { CARD_HEIGHT, CARD_WIDTH, type TemplateId, type ThemeId } from "@/lib/og/constants";
import { siteHost } from "@/lib/site";
import type { TemplateOverrides } from "@/lib/og/handler";

export type OgPreviewProps = {
  title: string;
  subtitle: string;
  template: TemplateId;
  theme: ThemeId;
  templateOverrides?: TemplateOverrides;
  watermark?: boolean;
};

/**
 * Shows the card the API actually returns.
 *
 * It renders the same `OgCard` the server rasterises, at its native 1200x630,
 * and scales the whole thing down to whatever width the container has. The
 * earlier version rebuilt the layout in Tailwind and then reimplemented it a
 * third time on a canvas for the download button, which meant the preview was
 * an approximation and the downloaded PNG was a different picture. Scaling one
 * component removes that whole class of drift.
 *
 * The wrapper reserves the box with `aspect-ratio`, so the height is known
 * before the measurement lands and nothing shifts when the scale resolves.
 */
export function OgPreview({
  title,
  subtitle,
  template,
  theme,
  templateOverrides,
  watermark,
}: OgPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    // Firefox's ResizeObserver can re-fire with sub-pixel width jitter when a
    // scaled descendant changes its painted overflow. Committing a fresh,
    // fractional `contentRect.width` to state on every callback made the React
    // re-render feed back into the next observation, producing an infinite
    // main-thread loop on the playground and the landing page (Firefox only).
    // Two guards break that loop: coalesce observations through a single
    // rAF (a re-render can never land mid-batch), and commit only when the
    // snapped, whole-pixel width actually changed by at least one CSS pixel.
    let rafId = 0;
    let committedWidth = Math.round(frame.getBoundingClientRect().width);

    const update = () => {
      rafId = 0;
      const width = Math.round(frame.getBoundingClientRect().width);
      if (width === committedWidth) return;
      committedWidth = width;
      // Never upscale past the card's native size.
      setScale(Math.min(1, width / CARD_WIDTH));
    };

    const observer = new ResizeObserver(() => {
      if (rafId) return;
      rafId = requestAnimationFrame(update);
    });
    observer.observe(frame);
    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative w-full overflow-hidden rounded-xl border border-border"
      style={{ aspectRatio: `${CARD_WIDTH} / ${CARD_HEIGHT}` }}
    >
      <div
        style={{
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <OgCard
          title={title}
          subtitle={subtitle}
          template={template}
          theme={theme}
          host={siteHost}
          templateOverrides={templateOverrides}
          watermark={watermark ?? false}
        />
      </div>
    </div>
  );
}
