import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageIntro, PublicFooter, PublicNav } from "@/components/ogcraft/marketing";
import { breadcrumbJsonLd, buildSeo } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, User, Heart, ExternalLink, Copy, GitFork, Search } from "lucide-react";
import { OgPreview } from "@/components/ogcraft/og-preview";
import { TEMPLATE_LABELS, THEME_LABELS } from "@/lib/og/constants";
import { siteUrl } from "@/lib/site";

interface PublicPreset {
  user_id: string;
  preset_id: string;
  name: string;
  title: string;
  subtitle: string;
  theme: string;
  template: string;
  created_at: string;
  author_email: string;
  author_name: string | null;
  author_avatar: string | null;
}

export const Route = createFileRoute("/gallery")({
  head: () =>
    buildSeo({
      title: "Preset Gallery — OGCraft",
      description: "Browse and fork community-shared presets for OGCraft.",
      path: "/gallery",
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Gallery", path: "/gallery" },
        ]),
      ],
    }),
  component: Gallery,
});

function Gallery() {
  const [presets, setPresets] = useState<PublicPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 12;
  const [hasMore, setHasMore] = useState(true);

  async function loadPresets() {
    if (!hasMore) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("public_presets")
        .select("*")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (error) throw error;
      const newPresets = data ?? [];
      setPresets((prev) => (page === 0 ? newPresets : [...prev, ...newPresets]));
      setHasMore(newPresets.length === PAGE_SIZE);
    } catch (err) {
      console.error("[Gallery] Failed to load presets", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(0);
    setPresets([]);
    setHasMore(true);
    loadPresets();
  }, [search]);

  useEffect(() => {
    if (!loading && hasMore) {
      const timer = setTimeout(() => setPage((p) => p + 1), 100);
      return () => clearTimeout(timer);
    }
  }, [loading, hasMore, page]);

  const filtered = presets.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="min-h-screen">
        <PublicNav />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <PageIntro
            eyebrow="Community"
            title="Preset Gallery"
            text="Explore presets shared by the OGCraft community. Fork any preset to make it your own."
          />

          <div className="mt-8 mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search presets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                aria-label="Search presets"
              />
            </div>
          </div>

          {loading && filtered.length === 0 ? (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <PresetCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <Search className="size-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">No presets found matching "{search}"</p>
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p) => (
                <PresetCard key={p.preset_id} preset={p} />
              ))}
            </div>
          )}

          {hasMore && !loading && (
            <div className="mt-12 text-center">
              <Button variant="outline" size="lg" onClick={() => setPage((p) => p + 1)} disabled={loading}>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Load more
              </Button>
            </div>
          )}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

function PresetCard({ preset }: { preset: PublicPreset }) {
  const [forking, setForking] = useState(false);

  async function handleFork() {
    const newName = window.prompt(`Fork "${preset.name}" as:`, `${preset.name} (fork)`);
    if (!newName) return;
    setForking(true);
    try {
      const { error } = await supabase.rpc("fork_preset", {
        original_user_id: preset.user_id,
        original_name: preset.name,
        new_name: newName,
      });
      if (error) throw error;
      alert(`Preset forked as "${newName}"! Check your presets in the playground.`);
    } catch (err) {
      console.error("[Gallery] Fork failed", err);
      alert(err instanceof Error ? err.message : "Failed to fork preset");
    } finally {
      setForking(false);
    }
  }

  return (
    <article className="dash-card group overflow-hidden transition-shadow hover:shadow-lg">
      <OgPreview
        title={preset.title}
        subtitle={preset.subtitle}
        template={preset.template as any}
        theme={preset.theme as any}
      />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold truncate">{preset.name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {preset.title} · {preset.subtitle}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-mono">
            {TEMPLATE_LABELS[preset.template as keyof typeof TEMPLATE_LABELS] ?? preset.template}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {preset.author_avatar ? (
            <img src={preset.author_avatar} alt="" className="size-5 rounded-full" />
          ) : (
            <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="size-3 text-primary" />
            </div>
          )}
          <span className="truncate max-w-[120px]">
            {preset.author_name ?? preset.author_email.split("@")[0]}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border/50">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => window.open(`${siteUrl}/playground`, "_blank")}
            aria-label="Open in playground"
          >
            <ExternalLink className="size-3.5 mr-1.5" />
            Open in playground
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFork}
            disabled={forking}
            aria-label="Fork this preset"
          >
            {forking ? <Loader2 className="size-3.5 animate-spin" /> : <GitFork className="size-3.5" />}
          </Button>
        </div>
      </div>
    </article>
  );
}

function PresetCardSkeleton() {
  return (
    <article className="dash-card overflow-hidden animate-pulse">
      <div className="aspect-[1200/630] bg-muted/40" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-muted/50 rounded w-3/4" />
        <div className="h-4 bg-muted/50 rounded w-1/2" />
        <div className="h-4 bg-muted/50 rounded w-1/4" />
        <div className="h-4 bg-muted/50 rounded w-1/3" />
        <div className="flex gap-2">
          <div className="flex-1 h-8 bg-muted/50 rounded" />
          <div className="h-8 w-20 bg-muted/50 rounded" />
        </div>
      </div>
    </article>
  );
}