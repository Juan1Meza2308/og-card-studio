import { useMemo, useRef, useState } from "react";
import { Check, Copy, Download, Globe2, ImageIcon, Sparkles } from "lucide-react";
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

const themes = {
  violet: { label: "Violet pulse", colors: ["#6d28d9", "#312e81", "#09090b"] },
  ocean: { label: "Electric ocean", colors: ["#0369a1", "#164e63", "#09090b"] },
  ember: { label: "Warm ember", colors: ["#be123c", "#7c2d12", "#09090b"] },
  mint: { label: "Signal mint", colors: ["#047857", "#134e4a", "#09090b"] },
};
const templates = [
    { value: "tech", label: "Tech", className: "og-tech" },
    { value: "minimalist", label: "Minimalist", className: "og-minimalist" },
    { value: "dark-gradient", label: "Dark Gradient", className: "og-dark-gradient" },
    { value: "clean-white", label: "Clean White", className: "og-clean-white og-light" },
  ] as const;

export function Playground() {
  const [title, setTitle] = useState("Ship ideas people remember.");
  const [subtitle, setSubtitle] = useState("ENGINEERING · PRODUCT · DESIGN");
  const [theme, setTheme] = useState<keyof typeof themes>("violet");
  const [template, setTemplate] = useState(templates[0].value);
  const [logoUrl, setLogoUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const url = useMemo(
    () =>
      `https://api.ogcraft.dev/v1/og?title=${encodeURIComponent(title)}&theme=${theme}&template=${encodeURIComponent(template)}`,
    [title, theme, template],
  );

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  function download() {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 630;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const currentTemplate = templates.find(t => t.value === template);
    const isLight = currentTemplate?.className.includes("og-light") ?? false;

    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    themes[theme].colors.forEach((color, index) => gradient.addColorStop(index / (themes[theme].colors.length - 1), color));

    ctx.fillStyle = isLight ? "#fafafa" : gradient;
    ctx.fillRect(0, 0, 1200, 630);
    ctx.fillStyle = isLight ? "#111113" : "#ffffff";
    ctx.font = "600 72px sans-serif";
    ctx.fillText(title.slice(0, 32), 72, 310);
    ctx.font = "500 24px monospace";
    ctx.fillText(subtitle.slice(0, 55), 76, 375);
    ctx.font = "600 24px sans-serif";
    ctx.fillText("OGCraft", 76, 90);
    const link = document.createElement("a");
    link.download = "ogcraft-preview.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
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
          <Sparkles className="size-3.5 text-primary" /> Updates instantly
        </div>
      </div>
      <div className="grid lg:grid-cols-[330px_1fr]">
        <div className="space-y-5 border-b border-border/70 p-5 lg:border-b-0 lg:border-r">
          <div>
            <p className="font-mono text-[11px] uppercase text-primary">01 / Content</p>
            <h3 className="mt-1 text-sm font-medium">Customize your card</h3>
          </div>
          <label className="block space-y-2">
            <Label htmlFor="og-title">Title</Label>
            <Input
              id="og-title"
              value={title}
              maxLength={70}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>
          <label className="block space-y-2">
            <Label htmlFor="og-subtitle">Subtitle / category</Label>
            <Input
              id="og-subtitle"
              value={subtitle}
              maxLength={70}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </label>
          <div className="space-y-2">
            <Label>Background gradient</Label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(themes).map(([key, value]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTheme(key as keyof typeof themes)}
                  aria-label={value.label}
                  className={`h-9 rounded-md border transition ${theme === key ? "border-primary ring-2 ring-primary/20" : "border-border"}`}
                  style={{ background: `linear-gradient(135deg, ${value.colors.join(",")})` }}
                />
              ))}
            </div>
          </div>
          <label className="block space-y-2">
            <Label htmlFor="logo-url">Logo URL</Label>
            <Input
              id="logo-url"
              value={logoUrl}
              placeholder="https://yourbrand.com/logo.png"
              onChange={(e) => setLogoUrl(e.target.value)}
            />
          </label>
          <div className="space-y-2">
            <Label>Template</Label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templates.map((item) => (
                  <SelectItem value={item.value} key={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="min-w-0 p-4 sm:p-6">
          <div
            ref={previewRef}
            className={`og-preview og-${theme} ${templates.find(t => t.value === template)?.className || ""}`}
          >
            <div className="og-grid" />
            <div className="relative z-10 flex h-full flex-col justify-between p-[7%]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 font-semibold">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Custom logo"
                      className="size-8 rounded-md object-contain"
                    />
                  ) : (
                    <span className="grid size-8 place-items-center rounded-md bg-preview-ink/10">
                      <ImageIcon className="size-4" />
                    </span>
                  )}
                  OGCraft
                </div>
                <span className="font-mono text-[10px] opacity-60">ogcraft.dev</span>
              </div>
              <div>
                <p className="mb-4 font-mono text-[clamp(9px,1.1vw,14px)] uppercase text-preview-accent">
                  {subtitle || "YOUR CATEGORY"}
                </p>
                <h3 className="max-w-3xl text-[clamp(24px,4.5vw,58px)] font-semibold leading-[1.02]">
                  {title || "Your title goes here"}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[clamp(9px,1vw,13px)] opacity-70">
                <Globe2 className="size-[1em]" /> Generated in 42ms
              </div>
            </div>
          </div>
          <div className="mt-3 flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background/60 p-2">
            <code className="min-w-0 flex-1 truncate px-2 font-mono text-[11px] text-muted-foreground">
              {url}
            </code>
            <Button size="icon" variant="ghost" onClick={() => copy(url)} aria-label="Copy API URL">
              {copied ? <Check /> : <Copy />}
            </Button>
            <Button size="icon" variant="outline" onClick={download} aria-label="Download PNG">
              <Download />
            </Button>
          </div>
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
