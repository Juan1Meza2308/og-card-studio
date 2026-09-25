import { useMemo, useState, useEffect, useRef } from "react";
import { Check, Copy, Download, Loader2, Sparkles, Save, Trash2, BookOpen, FolderPlus, Upload, Download as DownloadIcon, FileJson, AlertCircle } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ogCardUrl } from "@/lib/og/url";
import { siteUrl } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";

/**
 * Playground with presets functionality.
 * Users can save/load named configurations from localStorage.
 * Built-in example presets are provided for quick testing.
 */
export function Playground() {
  const [title, setTitle] = useState("Ship ideas people remember.");
  const [subtitle, setSubtitle] = useState("Engineering · Product · Design");
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [template, setTemplate] = useState<TemplateId>(DEFAULT_TEMPLATE);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Presets from localStorage
  const [presets, setPresets] = useState<UserPreset[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth state for cloud sync
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [syncMessage, setSyncMessage] = useState<string>("");

  // Load presets on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ogcraft-presets");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setPresets(parsed);
      }
    } catch (err) {
      console.error("[Playground] Failed to load presets", err);
    }
  }, []);

  // Save presets to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("ogcraft-presets", JSON.stringify(presets));
    } catch (err) {
      console.error("[Playground] Failed to save presets", err);
    }
  }, [presets]);

  // Check auth state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null);
    });
    // Initial check
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u ? { id: u.id, email: u.email ?? "" } : null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load cloud presets when user signs in
  useEffect(() => {
    if (user) {
      loadCloudPresets();
    }
  }, [user]);

  const url = useMemo(
    () => ogCardUrl(siteUrl, { title, subtitle, theme, template }),
    [title, subtitle, theme, template],
  );

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

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

  function savePreset() {
    if (!newPresetName.trim()) return;
    const preset: UserPreset = {
      id: crypto.randomUUID(),
      name: newPresetName.trim(),
      title,
      subtitle,
      theme,
      template,
      createdAt: Date.now(),
    };
    setPresets((prev) => [preset, ...prev]);
    setShowSaveDialog(false);
    setNewPresetName("");
  }

  function loadPreset(preset: UserPreset) {
    setTitle(preset.title);
    setSubtitle(preset.subtitle);
    setTheme(preset.theme);
    setTemplate(preset.template);
  }

  function deletePreset(id: string) {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }

  // Export presets to JSON file
  function exportPresets() {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      presets: presets.map(({ id, ...rest }) => rest), // Don't export IDs
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ogcraft-presets-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Import presets from JSON file
  function handleImport(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (!data.presets || !Array.isArray(data.presets)) {
          throw new Error("Invalid format: missing presets array");
        }
        // Validate each preset
        const validPresets = data.presets.filter((p: unknown) => {
          const preset = p as Partial<UserPreset>;
          return (
            typeof preset.name === "string" &&
            typeof preset.title === "string" &&
            typeof preset.subtitle === "string" &&
            THEME_IDS.includes(preset.theme as ThemeId) &&
            TEMPLATE_IDS.includes(preset.template as TemplateId)
          );
        }).map((p: unknown) => ({
          ...(p as Omit<UserPreset, "id">),
          id: crypto.randomUUID(),
          createdAt: Date.now(),
        }));
        if (validPresets.length === 0) {
          throw new Error("No valid presets found in file");
        }
        setPresets((prev) => [...validPresets, ...prev]);
        setImportError(null);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Failed to import presets");
      }
    };
    reader.readAsText(file);
  }

  // Load presets from cloud (Supabase)
  async function loadCloudPresets() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_presets")
        .select("data")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      if (data?.data) {
        const cloudPresets = data.data as Omit<UserPreset, "id">[];
        // Merge with local, avoiding duplicates by name
        setPresets((local) => {
          const merged = [...local];
          for (const cp of cloudPresets) {
            if (!local.some((lp) => lp.name === cp.name)) {
              merged.unshift({ ...cp, id: crypto.randomUUID(), createdAt: Date.now() });
            }
          }
          return merged;
        });
      }
    } catch (err) {
      console.error("[Playground] Failed to load cloud presets", err);
    }
  }

  // Save presets to cloud (Supabase)
  async function saveCloudPresets() {
    if (!user) return;
    setSyncStatus("syncing");
    setSyncMessage("Guardando en la nube...");
    try {
      const data = presets.map(({ id, ...rest }) => rest); // Don't store local IDs
      const { error } = await supabase
        .from("user_presets")
        .upsert({ user_id: user.id, data, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw error;
      setSyncStatus("success");
      setSyncMessage("Presets guardados en la nube");
      setTimeout(() => setSyncStatus("idle"), 3000);
    } catch (err) {
      setSyncStatus("error");
      setSyncMessage(err instanceof Error ? err.message : "Error al guardar");
      setTimeout(() => setSyncStatus("idle"), 5000);
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

          {/* Presets Panel */}
          <div className="border-t border-border/50 pt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-mono text-[11px] uppercase text-muted-foreground">Presets</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setNewPresetName(""); setShowSaveDialog(true); }}
              >
                <FolderPlus className="size-3.5 mr-2" />
                Save current
              </Button>
            </div>

            {/* Export / Import / Cloud sync */}
            <div className="border-t border-border/50 pt-3 mb-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportPresets}
                  disabled={presets.length === 0}
                >
                  <DownloadIcon className="size-3.5 mr-2" />
                  Export
                </Button>
                <div className="relative">
                  <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="size-3.5 mr-2" />
                    Import
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                    aria-label="Import presets JSON"
                  />
                </div>
                {user && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={saveCloudPresets}
                    disabled={syncStatus === "syncing"}
                  >
                    {syncStatus === "syncing" ? (
                      <Loader2 className="size-3.5 mr-2 animate-spin" />
                    ) : (
                      <FileJson className="size-3.5 mr-2" />
                    )}
                    Sync to cloud
                  </Button>
                )}
              </div>
              {importError && (
                <Alert variant="destructive" className="mt-2 text-xs">
                  <AlertCircle className="size-3.5" />
                  <AlertDescription>{importError}</AlertDescription>
                </Alert>
              )}
              {syncStatus !== "idle" && (
                <Alert className={`mt-2 text-xs ${syncStatus === "success" ? "" : "variant-destructive"}`}>
                  <AlertCircle className="size-3.5" />
                  <AlertDescription>{syncMessage}</AlertDescription>
                </Alert>
              )}
            </div>

            {/* Built-in examples */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Examples</p>
              <div className="grid grid-cols-2 gap-2">
                {BUILTIN_PRESETS.map((bp) => (
                  <button
                    key={bp.name}
                    type="button"
                    onClick={() => {
                      setTitle(bp.title);
                      setSubtitle(bp.subtitle);
                      setTheme(bp.theme);
                      setTemplate(bp.template);
                    }}
                    className="text-left p-2 rounded border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition text-xs"
                    title={bp.description}
                  >
                    <p className="font-medium truncate">{bp.name}</p>
                    <p className="text-muted-foreground/70 truncate">{bp.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* User presets */}
            {presets.length > 0 ? (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Your presets</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {presets.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2 rounded border border-border/50 hover:border-primary/50"
                    >
                      <button
                        type="button"
                        onClick={() => loadPreset(p)}
                        className="flex-1 text-left text-sm truncate font-medium"
                      >
                        {p.name}
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => deletePreset(p.id)}
                        aria-label={`Delete preset ${p.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No saved presets yet. Click "Save current" to create one.
              </p>
            )}
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

/** Shape of a user-saved preset in localStorage. */
interface UserPreset {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  theme: ThemeId;
  template: TemplateId;
  createdAt: number;
}

/** Built-in example presets for quick testing. */
const BUILTIN_PRESETS = [
  {
    name: "Launch Day",
    description: "Bold tech theme for product launches",
    title: "We're live! 🚀",
    subtitle: "The future of developer tools starts today",
    theme: "violet" as ThemeId,
    template: "tech" as TemplateId,
  },
  {
    name: "Blog Post",
    description: "Clean white template for articles",
    title: "How we built OGCraft",
    subtitle: "Engineering · Behind the scenes",
    theme: "mint" as ThemeId,
    template: "clean-white" as TemplateId,
  },
  {
    name: "Changelog",
    description: "Dark gradient for version updates",
    title: "v2.0 — Faster renders",
    subtitle: "Now with custom templates & Stripe billing",
    theme: "ember" as ThemeId,
    template: "dark-gradient" as TemplateId,
  },
  {
    name: "Minimal",
    description: "Minimalist for subtle announcements",
    title: "Small update, big impact",
    subtitle: "Performance improvements across the board",
    theme: "ocean" as ThemeId,
    template: "minimalist" as TemplateId,
  },
];