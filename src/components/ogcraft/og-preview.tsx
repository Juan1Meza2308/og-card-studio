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
export function OgPreview({ title, subtitle, template, theme, templateOverrides, watermark }: OgPreviewProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setScale(entry.contentRect.width / CARD_WIDTH);
    });
    observer.observe(frame);
    return () => observer.disconnect();
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
