import { useMemo, useState } from "react";
import { Check, Copy, Download, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OgPreview } from "@/components/ogcraft/og-preview";
import {
  DEFAULT_TEMPLATE,
  DEFAULT_THEME,
  LIMITS,
  TEMPLATE_IDS,
  TEMPLATE_LABELS,
  THEME_IDS,
  THEME_LABELS,
  type TemplateId,
  type ThemeId,
} from "@/lib/og/constants";
import { themeSwatch } from "@/lib/og/palette";
import { siteUrl } from "@/lib/site";

/**
 * The playground renders the real card and downloads from the real endpoint.
 *
 * The vocabulary of templates, themes and length limits is imported from
 * `lib/og`, so a value that the API rejects cannot be offered here: the
 * inputs carry the same maximum length the schema enforces.
 */
export function Playground() {
  const [title, setTitle] = useState("Ship ideas people remember.");
  const [subtitle, setSubtitle] = useState("Engineering · Product · Design");
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const url = useMemo(() => {
    const params = new URLSearchParams({ title, subtitle, theme, template });
    return `${siteUrl}/v1/og?${params.toString()}`;
  }, [title, subtitle, theme, template]);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  /**
   * Fetches the card from our own endpoint rather than redrawing it on a
   * canvas. Downloading a different picture than the one on screen was the
   * whole problem, and the endpoint is the only renderer that matters.
   */
  async function download() {
    setDownloading(true);
    setDownloadError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        setDownloadError(`El endpoint respondió ${response.status}. Revisá los campos.`);
        return;
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "ogcraft-preview.png";
      link.href = objectUrl;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setDownloadError("No se pudo alcanzar el endpoint.");
    } finally {
      setDownloading(false);
    }
  }

  const snippet = {
    html: `<meta property="og:image" content="${url}" />`,
    next: `export const metadata = {\n  openGraph: { images: ['${url}'] }\n}`,
    curl: `curl "${url}" --output og.png`,
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-workspace shadow-panel">
      <div className="flex h-12 items-center justify-between border-b border-border/70 px-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-success" /> Live playground
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" /> Renders through /v1/og
        </div>
      </div>
      <div className="grid lg:grid-cols-[330px_1fr]">
        <div className="space-y-5 border-b border-border/70 p-5 lg:border-b-0 lg:border-r">
          <div>
            <p className="font-mono text-[11px] uppercase text-muted-foreground">Content</p>
            <h3 className="mt-1 text-sm font-medium">Customize your card</h3>
          </div>
          <label className="block space-y-2">
            <Label htmlFor="og-title">Title</Label>
            <Input
              id="og-title"
              value={title}
              maxLength={LIMITS.titleMaxChars}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              {title.length}/{LIMITS.titleMaxChars}
            </p>
          </label>
          <label className="block space-y-2">
            <Label htmlFor="og-subtitle">Subtitle / category</Label>
            <Input
              id="og-subtitle"
              value={subtitle}
              maxLength={LIMITS.subtitleMaxChars}
              onChange={(e) => setSubtitle(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              {subtitle.length}/{LIMITS.subtitleMaxChars}
            </p>
          </label>
          <div className="space-y-2">
            <Label>Background gradient</Label>
            <div className="grid grid-cols-4 gap-2">
              {THEME_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  aria-label={THEME_LABELS[id]}
                  aria-pressed={theme === id}
                  className={`h-9 rounded-md border transition ${theme === id ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                  style={{ background: themeSwatch(id) }}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="og-template">Template</Label>
            <Select value={template} onValueChange={(value) => setTemplate(value as TemplateId)}>
              <SelectTrigger id="og-template">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_IDS.map((id) => (
                  <SelectItem value={id} key={id}>
                    {TEMPLATE_LABELS[id]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="min-w-0 p-4 sm:p-6">
          <OgPreview title={title} subtitle={subtitle} template={template} theme={theme} />
          <div className="mt-3 flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background/60 p-2">
            <code className="min-w-0 flex-1 truncate px-2 font-mono text-[11px] text-muted-foreground">
              {url}
            </code>
            <Button size="icon" variant="ghost" onClick={() => copy(url)} aria-label="Copy API URL">
              {copied ? <Check /> : <Copy />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              onClick={download}
              disabled={downloading}
              aria-label="Download PNG"
            >
              {downloading ? <Loader2 className="animate-spin" /> : <Download />}
            </Button>
          </div>
          {downloadError ? (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {downloadError}
            </p>
          ) : null}
          <Tabs defaultValue="html" className="mt-5">
            <TabsList>
              <TabsTrigger value="html">HTML</TabsTrigger>
              <TabsTrigger value="next">Next.js</TabsTrigger>
              <TabsTrigger value="curl">cURL</TabsTrigger>
            </TabsList>
            {Object.entries(snippet).map(([key, value]) => (
              <TabsContent key={key} value={key}>
                <pre className="overflow-x-auto rounded-lg border border-border bg-code p-4 font-mono text-xs leading-6 text-code-foreground">
                  <code>{value}</code>
                </pre>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
