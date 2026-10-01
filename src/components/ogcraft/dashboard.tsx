import { useEffect, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { RendererStatusBadge } from "@/components/ogcraft/renderer-status-badge";
import { OnboardingBanner } from "@/components/ogcraft/onboarding-banner";
import {
  Activity,
  BarChart3,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  Gauge,
  KeyRound,
  LayoutTemplate,
  LogOut,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Save,
  X,
  Edit,
  Trash2 as Trash2Icon,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OgPreview } from "@/components/ogcraft/og-preview";
import type { TemplateOverrides } from "@/lib/og/handler";
import { TEMPLATE_IDS, THEME_IDS, TEMPLATE_LABELS, THEME_LABELS, CARD_LAYOUTS } from "@/lib/og/constants";
import { siteHost } from "@/lib/site";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { siteUrl } from "@/lib/site";

export type View = "overview" | "keys" | "templates" | "analytics" | "billing";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  last_four: string;
  created_at: string;
  last_used_at: string | null;
  status: string;
};

type CustomTemplate = {
  id: string;
  name: string;
  theme: "violet" | "ocean" | "ember" | "mint";
  title: string;
  subtitle: string;
  logo_url: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

const nav = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "keys", label: "API Keys", icon: KeyRound },
  { id: "templates", label: "Template Builder", icon: LayoutTemplate },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "billing", label: "Billing", icon: CreditCard },
] as const;

export function Dashboard() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/_authenticated/dashboard" });
  const [view, setView] = useState<View>(search.view ?? "overview");

  function changeView(next: View) {
    setView(next);
    navigate({ to: "/dashboard", search: { view: next }, replace: true });
  }
  const [collapsed, setCollapsed] = useState(false);
  const [email, setEmail] = useState("Developer");
  const [plan, setPlan] = useState<"free" | "pro" | "agency">("free");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState(100);
  const [newName, setNewName] = useState("Production");
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [templates, setTemplates] = useState<CustomTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

  async function loadData() {
    setLoading(true);
    setLoadError(false);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user?.email) setEmail(userData.user.email);
      const [{ data: keyRows, error: keyError }, { data: usageRows, error: usageError }, { data: profile }] =
        await Promise.all([
          supabase
            .from("api_keys")
            .select("id,name,key_prefix,last_four,created_at,last_used_at,status")
            .eq("status", "active")
            .order("created_at", { ascending: false }),
          supabase
            .from("usage_stats")
            .select("requests_used,request_limit")
            .order("period_start", { ascending: false })
            .limit(1),
          supabase
            .from("profiles")
            .select("plan")
            .eq("id", userData.user!.id)
            .single(),
        ]);
      if (keyError || usageError) {
        console.error("[Dashboard] Failed to load workspace data", { keyError, usageError });
        setLoadError(true);
        return;
      }
      if (profile?.plan) setPlan(profile.plan as "free" | "pro" | "agency");
      if (keyRows) setKeys(keyRows);
      const current = usageRows?.[0];
      if (current) {
        setUsed(current.requests_used);
        setLimit(current.request_limit);
      }
    } catch (err) {
      console.error("[Dashboard] Unexpected error loading workspace data", err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  async function loadTemplates() {
    setTemplatesLoading(true);
    setTemplateError(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data, error } = await supabase
        .from("templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      const mapped = (data ?? []).map((t) => ({
        ...t,
        theme: t.theme as "violet" | "ocean" | "ember" | "mint",
      }));
      setTemplates(mapped);
    } catch (err) {
      console.error("[Dashboard] Failed to load templates", err);
      setTemplateError("No se pudieron cargar las plantillas");
    } finally {
      setTemplatesLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => {
    if (view === "templates") void loadTemplates();
  }, [view]);

  async function generateKey() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    setGenerating(true);
    try {
      const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      // Rejection sampling: 256 % 62 !== 0, so modulo mapping alone would bias
      // the character distribution. Re-roll bytes >= 248 (62 * 4) for uniformity.
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      let secret = "";
      for (const byte of bytes) {
        let b = byte;
        while (b >= 248) {
          const roll = crypto.getRandomValues(new Uint8Array(1));
          b = roll[0] ?? 0;
        }
        secret += alphabet[b % alphabet.length];
      }
      secret = `og_live_${secret}`;
      const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
      const keyHash = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join(
        "",
      );

      const { error } = await supabase.from("api_keys").insert({
        user_id: userData.user.id,
        name: newName.trim() || "Untitled key",
        key_prefix: "og_live_",
        last_four: secret.slice(-4),
        key_hash: keyHash,
      });

      if (error) {
        console.error("[Dashboard] Failed to create API key", error);
        return;
      }
      setRevealed(secret);
      setNewName("Production");
      await loadData();
    } finally {
      setGenerating(false);
    }
  }

  async function revoke(id: string) {
    try {
      const { error } = await supabase.from("api_keys").update({ status: "revoked" }).eq("id", id);
      if (error) {
        console.error("[Dashboard] Failed to revoke API key", error);
        return;
      }
      await loadData();
    } catch (err) {
      console.error("[Dashboard] Unexpected error revoking API key", err);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function copyToClipboard(value: string) {
    await navigator.clipboard.writeText(value);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-dashboard text-foreground">
        <aside className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/60 bg-sidebar md:flex w-64">
          <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
            <Logo compact={false} />
            <Button variant="ghost" size="icon" aria-label="Collapse sidebar" disabled>
              <ChevronLeft />
            </Button>
          </div>
          <nav className="flex-1 space-y-2 p-3" aria-label="Loading navigation">
            {nav.map((item) => (
              <div key={item.id} className="h-9 animate-pulse rounded-md bg-muted/60" />
            ))}
          </nav>
          <div className="border-t border-border/60 p-3">
            <div className="h-8 animate-pulse rounded-md bg-muted/60" />
          </div>
        </aside>
        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-border/60 px-4 sm:px-8">
            <div className="space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-muted/60" />
              <div className="h-5 w-24 animate-pulse rounded bg-muted/60" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-32 animate-pulse rounded-full bg-muted/60" />
              <div className="size-8 animate-pulse rounded-md bg-muted/60" />
            </div>
          </header>
          <div className="mx-auto max-w-7xl space-y-4 p-4 sm:p-8" aria-hidden="true">
            <div className="h-6 w-48 animate-pulse rounded bg-muted/60" />
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 h-44 animate-pulse rounded-2xl bg-muted/40" />
              <div className="h-44 animate-pulse rounded-2xl bg-muted/40" />
            </div>
            <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
            <div className="h-40 animate-pulse rounded-2xl bg-muted/40" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-dashboard text-foreground">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/60 bg-sidebar transition-all duration-300 ease-out md:flex",
          collapsed ? "w-16" : "w-64",
        )}
        aria-label="Sidebar navigation"
      >
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
          <Logo compact={collapsed} />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="transition-transform duration-200"
          >
            {collapsed ? <ChevronRight className="rotate-180" /> : <ChevronLeft />}
          </Button>
        </div>
        <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
          {nav.map((item) => (
            <Button
              key={item.id}
              variant={view === item.id ? "default" : "ghost"}
              className={cn(
                "w-full transition-all duration-200",
                collapsed ? "px-0" : "justify-start gap-3",
              )}
              onClick={() => changeView(item.id)}
              title={collapsed ? item.label : undefined}
              aria-current={view === item.id ? "page" : undefined}
            >
              <item.icon className={cn("flex-shrink-0", collapsed && "mx-auto")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Button>
          ))}
        </nav>
        <div className="border-t border-border/60 p-3">
          {!collapsed && (
            <div className="mb-3 min-w-0 animate-fade-in">
              <p className="truncate text-xs font-medium">{email}</p>
              <p className="mt-1 text-[11px] text-muted-foreground capitalize">{plan} workspace</p>
            </div>
          )}
          {!collapsed && (
            <div className="mb-4 animate-fade-in">
              <p className="text-[11px] text-muted-foreground mb-2">Monthly usage</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <p className="mt-1 text-[11px] font-mono text-muted-foreground">
                {used} / {limit}
              </p>
            </div>
          )}
          <Button
            variant="ghost"
            className={cn(
              "w-full text-muted-foreground transition-colors",
              collapsed ? "px-0" : "justify-start gap-3",
            )}
            onClick={signOut}
          >
            <LogOut className={cn("flex-shrink-0", collapsed && "mx-auto")} />
            {!collapsed && <span>Sign out</span>}
          </Button>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-dashboard/80 px-4 backdrop-blur-xl sm:px-8">
          <div>
            <p className="font-mono text-[10px] uppercase text-primary">
              Workspace / {view.charAt(0).toUpperCase() + view.slice(1)}
            </p>
            <h1 className="text-lg font-semibold capitalize">
              {view === "keys" ? "API Keys" : view}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <RendererStatusBadge />
            <ThemeToggle />
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-4 sm:p-8 animate-fade-up">
          {loadError && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
              <p className="flex items-center gap-2 text-destructive">
                <AlertCircle className="size-4" aria-hidden="true" />
                Couldn't load your workspace data. Check your connection and try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => void loadData()}>
                Retry
              </Button>
            </div>
          )}
          <div
            className="mb-6 flex gap-2 overflow-x-auto md:hidden"
            role="tablist"
            aria-label="Mobile navigation"
          >
            {nav.map((item) => (
              <Button
                key={item.id}
                size="sm"
                variant={view === item.id ? "default" : "outline"}
                onClick={() => changeView(item.id)}
                role="tab"
                aria-selected={view === item.id}
              >
                <item.icon />
                {item.label}
              </Button>
            ))}
          </div>
          {view === "overview" && <Overview used={used} limit={limit} onNavigate={changeView} />}
          {view === "keys" && (
            <Keys
              keys={keys}
              revoke={revoke}
              open={open}
              setOpen={setOpen}
              newName={newName}
              setNewName={setNewName}
              revealed={revealed}
              setRevealed={setRevealed}
              generateKey={generateKey}
              generating={generating}
              copyToClipboard={copyToClipboard}
            />
          )}
          {view === "templates" && <Templates templates={templates} onRefresh={loadTemplates} />}
          {view === "analytics" && <Analytics used={used} limit={limit} />}
          {view === "billing" && <Billing used={used} limit={limit} />}
        </div>
      </main>
    </div>
  );
}

function Overview({ used, limit, onNavigate }: { used: number; limit: number; onNavigate: (view: View) => void }) {
  const [copied, setCopied] = useState(false);
  const [recentActivity, setRecentActivity] = useState<
    Array<{ date: string; requests_count: number }>
  >([]);
  const [recentTemplates, setRecentTemplates] = useState<
    Array<{ template_name: string; requests_count: number; template_type: string }>
  >([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const snippet = `curl "${siteUrl}/v1/og?title=Hello%20World&theme=violet" \\
  -H "Authorization: Bearer og_live_••••••••" \\
  --output preview.png`;

  async function copySnippet() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (err) {
      console.error("[Dashboard] Failed to copy snippet", err);
    }
  }

  // Quick actions - unique to Overview
  const quickActions = [
    {
      label: "Generate API Key",
      description: "Create a new key for your app",
      icon: KeyRound,
      onClick: () => onNavigate("keys"),
      shortcut: "⌘K",
    },
    {
      label: "Create Template",
      description: "Design a custom card style",
      icon: LayoutTemplate,
      onClick: () => onNavigate("templates"),
      shortcut: "⌘T",
    },
    {
      label: "Copy Snippet",
      description: "Copy ready-to-use curl command",
      icon: Copy,
      onClick: () => void copySnippet(),
      shortcut: "⌘C",
    },
  ];

  // Load recent activity for the activity feed
  useEffect(() => {
    async function loadRecentActivity() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      try {
        const [{ data: daily }, { data: templates }] = await Promise.all([
          supabase
            .from("daily_usage_stats")
            .select("date, requests_count")
            .eq("user_id", user.id)
            .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
            .order("date", { ascending: false })
            .limit(7),
          supabase
            .from("template_usage")
            .select("template_name, requests_count, template_type")
            .eq("user_id", user.id)
            .order("last_used_at", { ascending: false })
            .limit(5),
        ]);
        if (daily) setRecentActivity(daily ?? []);
        if (templates) setRecentTemplates(templates ?? []);
      } catch (err) {
        console.error("[Overview] Failed to load recent activity", err);
      } finally {
        setLoadingActivity(false);
      }
    }
    void loadRecentActivity();
  }, []);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 18 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="space-y-6 animate-fade-up">
      <OnboardingBanner />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{greeting}, 👋</p>
          <h1 className="text-2xl font-semibold">Resumen de tu proyecto</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-3 py-1 text-xs text-success">
            <span className="size-1.5 rounded-full bg-success" />
            Conectado
          </span>
        </div>
      </div>

      {/* Quick Actions - unique to Overview */}
      <section className="dash-card" aria-labelledby="quick-actions-heading">
        <p id="quick-actions-heading" className="dash-label">Quick actions</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {quickActions.map((action) => (
            <Button
              key={action.label}
              variant="outline"
              className={cn(
                "gap-3 text-left py-4 transition-all hover:shadow-md",
                "flex items-center",
              )}
              onClick={action.onClick}
            >
              <span className="icon-box bg-primary/10 text-primary">
                <action.icon className="size-5" />
              </span>
              <div className="flex-1 text-left">
                <p className="font-medium">{action.label}</p>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </div>
              <kbd className="px-2 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground">
                {action.shortcut}
              </kbd>
            </Button>
          ))}
        </div>
      </section>

      {/* Recent Activity Feed - unique to Overview */}
      <section className="dash-card" aria-labelledby="activity-heading">
        <div className="flex items-center justify-between">
          <p id="activity-heading" className="dash-label">Recent activity</p>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("analytics")}>
            View all
            <ChevronRight className="size-3.5 ml-1" />
          </Button>
        </div>
        {loadingActivity ? (
          <div className="mt-8 text-center py-8">
            <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto" />
          </div>
        ) : recentActivity.length > 0 ? (
          <div className="mt-4 space-y-3">
            {recentActivity.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary text-xs font-mono">
                    {new Date(day.date).getDate()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {new Date(day.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </p>
                    <p className="text-xs text-muted-foreground">{day.requests_count} requests</p>
                  </div>
                </div>
                <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${Math.min((day.requests_count / Math.max(1, ...recentActivity.map(d => d.requests_count))) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center py-8">
            <Activity className="size-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Make your first request to see activity here</p>
          </div>
        )}
      </section>

      {/* Recently Used Templates - unique to Overview */}
      <section className="dash-card" aria-labelledby="recent-templates-heading">
        <div className="flex items-center justify-between">
          <p id="recent-templates-heading" className="dash-label">Recently used templates</p>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("templates")}>
            View all
            <ChevronRight className="size-3.5 ml-1" />
          </Button>
        </div>
        {recentTemplates.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {recentTemplates.slice(0, 4).map((tpl) => (
              <Button
                key={tpl.template_name}
                variant="outline"
                className="gap-3 p-3 text-left transition-all hover:shadow-md"
                onClick={() => onNavigate("templates")}
              >
                <span className="icon-box bg-primary/10 text-primary">
                  <LayoutTemplate className="size-5" />
                </span>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium truncate">{tpl.template_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{tpl.template_type} · {tpl.requests_count} uses</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Button>
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center py-8">
            <LayoutTemplate className="size-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No templates used yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Create a template or make a request to see it here</p>
          </div>
        )}
      </section>

      {/* Code snippet for quick copy - unique to Overview */}
      <section className="dash-card" aria-labelledby="quickstart-heading">
        <div className="mb-5 flex items-center gap-3">
          <span className="icon-box">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="quickstart-heading" className="font-semibold">
              Your first image in under a minute
            </h2>
            <p className="text-sm text-muted-foreground">
              Copy this request and replace the title.
            </p>
          </div>
        </div>
        <div className="group relative">
          <pre className="overflow-x-auto rounded-lg bg-code p-5 font-mono text-xs leading-6 text-code-foreground">
            <code>{snippet}</code>
          </pre>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            onClick={() => void copySnippet()}
            aria-label="Copy code snippet"
            aria-live="polite"
          >
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          </Button>
        </div>
      </section>
    </div>
  );
}

function Keys({
  keys,
  revoke,
  open,
  setOpen,
  newName,
  setNewName,
  revealed,
  setRevealed,
  generateKey,
  generating,
  copyToClipboard,
}: {
  keys: ApiKey[];
  revoke: (id: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  newName: string;
  setNewName: (v: string) => void;
  revealed: string | null;
  setRevealed: (v: string | null) => void;
  generateKey: () => void;
  generating: boolean;
  copyToClipboard: (value: string) => Promise<void>;
}) {
  const [copied, setCopied] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const copy = async (value: string) => {
    await copyToClipboard(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 1600);
  };

  const handleRevoke = async (id: string) => {
    setRevoking(id);
    await revoke(id);
    setRevoking(null);
  };

  return (
    <section className="dash-card animate-fade-up" aria-labelledby="keys-heading">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 id="keys-heading" className="text-lg font-semibold">
            API keys
          </h2>
          <p className="text-sm text-muted-foreground">
            Use keys from secure server environments only. Keys are never shown again after
            creation.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={generating}>
              <Plus className={cn("size-4", generating && "animate-spin")} />
              {generating ? "Generating…" : "Generate New API Key"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Generate API key</DialogTitle>
              <DialogDescription>
                Name this key so you know where it is used. The key will only be shown once.
              </DialogDescription>
            </DialogHeader>
            {revealed ? (
              <div className="space-y-4">
                <Label className="block text-sm font-medium">Your new key</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={revealed}
                    className="font-mono flex-1"
                    aria-label="Generated API key"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => copy(revealed)}
                    aria-label={copied === revealed ? "Copied" : "Copy key"}
                  >
                    {copied === revealed ? (
                      <CheckCircle className="size-4 text-success" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-warning flex items-center gap-1">
                  <AlertCircle className="size-3" />
                  Copy it now. It will not be shown again.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Label className="block text-sm font-medium">Key name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Production"
                  autoFocus
                />
              </div>
            )}
            <DialogFooter>
              {revealed ? (
                <Button
                  onClick={() => {
                    setOpen(false);
                    setRevealed(null);
                  }}
                >
                  Done
                </Button>
              ) : (
                <Button onClick={generateKey} disabled={generating}>
                  {generating ? "Generating…" : "Generate key"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {keys.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
            <KeyRound className="size-6" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-base font-semibold">Create your first API key</h3>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Keys are shown once and hashed with SHA-256 — copy it somewhere safe.
          </p>
          <div className="mx-auto mt-6 grid max-w-md gap-2 text-left sm:grid-cols-3">
            {[
              { n: "1", t: "Generate", d: "Click below and name the key." },
              { n: "2", t: "Copy", d: "Save it — it won't appear twice." },
              { n: "3", t: "Request", d: "Pass it as a header or query." },
            ].map((step) => (
              <div key={step.n} className="rounded-xl border border-border/50 bg-card/50 p-3">
                <span className="font-mono text-[10px] text-primary">{step.n}</span>
                <p className="mt-1 text-sm font-medium">{step.t}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.d}</p>
              </div>
            ))}
          </div>
          <Button className="mt-6" onClick={() => setOpen(true)}>
            <Plus className="size-4 mr-2" />
            Generate API Key
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm" role="table">
            <thead className="border-y border-border/50 text-xs text-muted-foreground">
              <tr>
                <th className="py-3 font-medium" scope="col">
                  Key name
                </th>
                <th className="font-medium" scope="col">
                  Prefix
                </th>
                <th className="font-medium" scope="col">
                  Created
                </th>
                <th className="font-medium" scope="col">
                  Last used
                </th>
                <th className="text-right font-medium" scope="col">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {keys.map((key) => (
                <AnimatePresence key={key.id}>
                  <tr
                    key={key.id}
                    className={cn("transition-colors hover:bg-card/50", "animate-fade-up", {
                      "in-view": key.id === keys[keys.length - 1]?.id,
                    })}
                  >
                    <td className="py-4 font-medium">{key.name}</td>
                    <td>
                      <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                        {key.key_prefix}••••{key.last_four}
                      </code>
                    </td>
                    <td className="text-muted-foreground whitespace-nowrap">
                      {new Date(key.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="text-muted-foreground whitespace-nowrap">
                      {key.last_used_at ? (
                        new Date(key.last_used_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      ) : (
                        <span className="text-muted-foreground/50">Never</span>
                      )}
                    </td>
                    <td>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copy(`${key.key_prefix}••••${key.last_four}`)}
                          aria-label={`Copy ${key.name} prefix`}
                          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {copied === key.last_four ? (
                            <CheckCircle className="size-4 text-success" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRevoke(key.id)}
                          aria-label={`Revoke ${key.name}`}
                          disabled={revoking === key.id}
                          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          {revoking === key.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 />
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                </AnimatePresence>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

interface TemplatesProps {
  templates: CustomTemplate[];
  onRefresh: () => Promise<void>;
}

function Templates({ templates: userTemplates, onRefresh }: TemplatesProps) {
  const [selectedId, setSelectedId] = useState<string>("tech");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CustomTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    theme: "violet" as "violet" | "ocean" | "ember" | "mint",
    title: "Ship your next idea",
    subtitle: "Built with OGCraft",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const builtinTemplates = TEMPLATE_IDS.map((id) => ({
    id,
    name: TEMPLATE_LABELS[id],
    template: id,
    theme: "violet" as "violet" | "ocean" | "ember" | "mint",
    className: CARD_LAYOUTS[id].brandPlacement === "top" ? "og-tech" : "og-minimalist",
    isBuiltin: true as const,
  }));

  const allTemplates = [...builtinTemplates, ...userTemplates.map((t) => ({ ...t, isBuiltin: false as const }))];

  function handleSelect(id: string) {
    setSelectedId(id);
  }

  function openCreate() {
    setFormData({ name: "", theme: "violet", title: "Ship your next idea", subtitle: "Built with OGCraft" });
    setEditingTemplate(null);
    setShowCreateDialog(true);
  }

  function openEdit(template: CustomTemplate) {
    setFormData({
      name: template.name,
      theme: template.theme,
      title: template.title,
      subtitle: template.subtitle,
    });
    setEditingTemplate(template);
    setShowCreateDialog(true);
  }

  async function handleSave() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    setSaving(true);
    try {
      if (editingTemplate) {
        const { error } = await supabase
          .from("templates")
          .update({
            name: formData.name,
            theme: formData.theme,
            title: formData.title,
            subtitle: formData.subtitle,
            logo_url: null,
          })
          .eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("templates").insert({
          user_id: userData.user.id,
          name: formData.name,
          theme: formData.theme,
          title: formData.title,
          subtitle: formData.subtitle,
          logo_url: null,
        });
        if (error) throw error;
      }
      setSaved(true);
      setShowCreateDialog(false);
      await onRefresh();
      setTimeout(() => setSaved(false), 1600);
    } catch (err) {
      console.error("[Dashboard] Failed to save template", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const { error } = await supabase.from("templates").delete().eq("id", id);
      if (error) throw error;
      await onRefresh();
    } catch (err) {
      console.error("[Dashboard] Failed to delete template", err);
    } finally {
      setDeleting(null);
    }
  }

  const selectedTemplate = allTemplates.find((t) => t.id === selectedId) ?? allTemplates[0];

  return (
    <div className="animate-fade-up">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Template builder</h2>
          <p className="text-sm text-muted-foreground">
            Choose a foundation, then make it yours. Templates define the visual style of your OG
            cards.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4 mr-2" />
          New template
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        {allTemplates.map((item) => (
          <motion.button
            type="button"
            onClick={() => handleSelect(item.id)}
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: allTemplates.indexOf(item) * 0.06, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative group overflow-hidden rounded-xl border transition-all duration-200",
              "p-0",
              selectedId === item.id
                ? "border-primary ring-2 ring-primary/20 shadow-glow"
                : "border-border hover:border-primary/30",
            )}
            aria-pressed={selectedId === item.id}
            aria-label={item.name}
          >
            <OgPreview
              title={item.isBuiltin ? "Your card title" : item.title}
              subtitle={item.isBuiltin ? "Your subtitle here" : item.subtitle}
              template={item.isBuiltin ? (item.id as "tech" | "minimalist" | "dark-gradient" | "clean-white") : "tech"}
              theme={item.theme}
              {...(!item.isBuiltin
                ? {
                    templateOverrides: {
                      theme: item.theme,
                      title: item.title,
                      subtitle: item.subtitle,
                      logoUrl: null,
                    },
                  }
                : {})}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            {selectedId === item.id && (
              <div className="absolute top-3 right-3">
                <Check className="size-5 text-primary" strokeWidth={3} />
              </div>
            )}
            {!item.isBuiltin && (
              <div className="absolute bottom-3 right-3 flex gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                  aria-label="Edit template"
                >
                  <Edit className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                  disabled={deleting === item.id}
                  aria-label="Delete template"
                >
                  {deleting === item.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2Icon className="size-3.5" />}
                </Button>
              </div>
            )}
          </motion.button>
        ))}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit template" : "Create template"}</DialogTitle>
            <DialogDescription>
              {editingTemplate
                ? "Changes will apply to new cards using this template."
                : "Give it a name and choose the base style. You can override the text later."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My launch template"
                  maxLength={80}
                  required
                />
              </label>
              <label className="space-y-2">
                <Label htmlFor="template-theme">Theme</Label>
                <Select value={formData.theme} onValueChange={(v) => setFormData({ ...formData, theme: v as "violet" | "ocean" | "ember" | "mint" })}>
                  <SelectTrigger id="template-theme">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {THEME_IDS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {THEME_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <label className="space-y-2">
              <Label htmlFor="template-title">Title (used as default)</Label>
              <Input
                id="template-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={90}
              />
            </label>
            <label className="space-y-2">
              <Label htmlFor="template-subtitle">Subtitle (used as default)</Label>
              <Input
                id="template-subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                maxLength={140}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !formData.name.trim()}>
              {saving ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
              {editingTemplate ? "Save changes" : "Create template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {userTemplates.length > 0 && (
        <section className="dash-card mt-8">
          <p className="dash-label">Your templates</p>
          <p className="mt-1 text-xs text-muted-foreground">
            These are stored in your account and available via the API with your key.
          </p>
          <div className="mt-4 rounded-lg border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 bg-muted/50">
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Theme</th>
                  <th className="p-3 text-left font-medium">Title</th>
                  <th className="p-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userTemplates.map((t) => (
                  <tr key={t.id} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="p-3 font-mono">{t.name}</td>
                    <td className="p-3 capitalize">{t.theme}</td>
                    <td className="p-3 max-w-xs truncate">{t.title}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(t)} aria-label="Edit">
                          <Edit className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(t.id)}
                          disabled={deleting === t.id}
                          aria-label="Delete"
                        >
                          {deleting === t.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2Icon className="size-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {saved && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-up">
          <div className="flex items-center gap-2 rounded-xl bg-success/10 border border-success/30 px-4 py-3 text-sm text-success">
            <CheckCircle className="size-4" />
            Template saved
          </div>
        </div>
      )}
    </div>
  );
}

function Analytics({ used, limit }: { used: number; limit: number }) {
  const [dailyData, setDailyData] = useState<{ date: string; requests_count: number }[]>([]);
  const [templateData, setTemplateData] = useState<{ template_name: string; requests_count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const [{ data: daily }, { data: templates }] = await Promise.all([
          supabase
            .from("daily_usage_stats")
            .select("date, requests_count")
            .eq("user_id", user.id)
            .gte("date", firstDayOfMonth.toISOString().split("T")[0])
            .lte("date", lastDayOfMonth.toISOString().split("T")[0])
            .order("date", { ascending: true }),
          supabase
            .from("template_usage")
            .select("template_name, requests_count")
            .eq("user_id", user.id)
            .order("requests_count", { ascending: false })
            .limit(10),
        ]);

        if (daily) setDailyData(daily);
        if (templates) setTemplateData(templates);
      } catch (err) {
        console.error("[Dashboard] Failed to load analytics", err);
      } finally {
        setLoading(false);
      }
    }
    void loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3 animate-fade-up">
        <section className="dash-card lg:col-span-2" aria-labelledby="requests-heading">
          <p id="requests-heading" className="dash-label">Requests this month</p>
          <div className="mt-8 h-48 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </section>
        <section className="dash-card" aria-labelledby="top-templates-heading">
          <p id="top-templates-heading" className="dash-label">Top templates</p>
          <div className="mt-4 h-32 flex items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        </section>
      </div>
    );
  }

  const bars = dailyData.map((d) => d.requests_count);
  const average = bars.length > 0 ? Math.round(bars.reduce((a, b) => a + b, 0) / bars.length) : 0;
  const max = bars.length > 0 ? Math.max(...bars) : 0;
  const min = bars.length > 0 ? Math.min(...bars) : 0;
  const total = bars.reduce((a, b) => a + b, 0);
  const maxIndex = bars.indexOf(max);
  const minIndex = bars.indexOf(min);

  return (
    <div className="grid gap-4 lg:grid-cols-3 animate-fade-up">
      <section className="dash-card lg:col-span-2" aria-labelledby="requests-heading">
        <div className="flex justify-between items-start">
          <div>
            <p id="requests-heading" className="dash-label">
              Requests this month
            </p>
            <p className="mt-2 text-3xl font-semibold">{used}</p>
          </div>
          <span className="text-xs text-success flex items-center gap-1">
            <Activity className="size-3" aria-hidden="true" />
            {used > 0 && limit > 0 ? `+${Math.round(((used - (limit * 0.8)) / (limit * 0.8)) * 100)}%` : "—"}
          </span>
        </div>

        {/* Chart */}
        <div className="mt-8 relative">
          {/* Y-axis labels + Grid */}
          <div
            className="flex h-48 items-end gap-[3px] px-1 pb-8"
            role="img"
            aria-label="Monthly requests chart"
          >
            {/* Grid lines */}
            <div className="absolute inset-x-0 top-0 bottom-8 flex flex-col justify-between pointer-events-none">
              {[0, 25, 50, 75, 100].map((val) => (
                <div key={val} className="flex items-center gap-2">
                  <span className="w-8 text-[10px] text-muted-foreground text-right font-mono">
                    {val}%
                  </span>
                  <div className="flex-1 border-t border-border/30" />
                </div>
              ))}
            </div>

            {/* Bars */}
            {bars.length > 0 ? (
              bars.map((height, i) => {
                const pct = max > 0 ? Math.round((height / max) * 100) : 0;
                return (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t-md relative group cursor-pointer"
                    style={{
                      height: `${pct}%`,
                      background:
                        i === maxIndex
                          ? "var(--chart-1)"
                          : i === minIndex
                            ? "var(--chart-4)"
                            : "var(--chart-1)/70",
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: "easeOut" }}
                    whileHover={{ scaleY: 1.08 }}
                    whileTap={{ scaleY: 0.95 }}
                    title={`Day ${i + 1}: ${height} requests`}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="rounded-lg bg-card border border-border px-3 py-1.5 shadow-lg text-xs font-mono whitespace-nowrap">
                        <span className="text-foreground font-semibold">{dailyData[i]?.date}</span>
                        <span className="text-muted-foreground ml-1">{height} reqs</span>
                        {i === maxIndex && <span className="text-success ml-1">Peak</span>}
                        {i === minIndex && <span className="text-destructive ml-1">Low</span>}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted-foreground text-sm">
                No data yet — make some requests!
              </div>
            )}

            {/* Average line */}
            <div className="absolute left-8 right-8 pointer-events-none">
              <div
                className="h-0.5 bg-success/50"
                style={{
                  bottom: max > 0 ? `${(average / max) * 100}%` : "0%",
                  left: "calc(8px + 3px)",
                  right: "calc(8px + 3px)",
                }}
              >
                <motion.div
                  className="absolute -top-1 left-1/2 -translate-x-1/2 rounded-full bg-success px-2 py-0.5 text-[10px] font-mono text-success"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.3 }}
                >
                  avg {average}
                </motion.div>
              </div>
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex gap-[3px] px-1 pl-10 mt-0">
            {dailyData.map((_, i) => (
              <div key={i} className="flex-1 text-center">
                <span className="text-[10px] text-muted-foreground font-mono">
                  D{i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="text-center rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground font-mono">Total</p>
            <p className="mt-1 text-lg font-semibold">{total}</p>
          </div>
          <div className="text-center rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground font-mono">Average</p>
            <p className="mt-1 text-lg font-semibold">{average}</p>
          </div>
          <div className="text-center rounded-lg bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground font-mono">Peak</p>
            <p className="mt-1 text-lg font-semibold text-success">{max}</p>
          </div>
        </div>
      </section>

      <section className="dash-card" aria-labelledby="top-templates-heading">
        <p id="top-templates-heading" className="dash-label">
          Top templates
        </p>
        {templateData.length > 0 ? (
          templateData.map((item, i) => (
            <motion.div
              key={item.template_name}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 + 0.3, duration: 0.3 }}
              className={cn(
                "mt-5 flex items-center justify-between text-sm",
                i > 0 && "pt-4 border-t border-border/50",
              )}
            >
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full" style={{ background: `var(--chart-${(i % 4) + 1})` }} />
                <span className="font-medium truncate max-w-[200px]">{item.template_name}</span>
              </div>
              <div className="flex items-center gap-3 text-right">
                <span className="text-muted-foreground">{item.requests_count} renders</span>
              </div>
            </motion.div>
          ))
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            No template usage yet. Create a template or make a request!
          </p>
        )}
      </section>
    </div>
  );
}

function Billing({ used, limit }: { used: number; limit: number }) {
  const [plan, setPlan] = useState<"free" | "pro" | "agency">("free");
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
      if (data) setPlan(data.plan as "free" | "pro" | "agency");
      setLoadingPlan(false);
    }
    void loadPlan();
  }, []);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      } else {
        console.error("Failed to open billing portal");
      }
    } catch (err) {
      console.error("[Billing] Portal error", err);
    } finally {
      setPortalLoading(false);
    }
  }

  const planConfig = {
    free: { name: "Free", limit: 100, color: "text-muted-foreground", bg: "bg-muted/30" },
    pro: { name: "Pro", limit: 10_000, color: "text-primary", bg: "bg-primary/10" },
    agency: { name: "Agency", limit: 100_000, color: "text-success", bg: "bg-success/10" },
  } as const;

  const current = planConfig[plan];

  return (
    <div className="grid gap-4 lg:grid-cols-2 animate-fade-up">
      <section className="dash-card" aria-labelledby="current-plan-heading">
        <p id="current-plan-heading" className="dash-label">
          Current plan
        </p>
        {loadingPlan ? (
          <div className="mt-5 flex items-center justify-center h-32">
            <RefreshCw className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <p className="text-3xl font-semibold">{current.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {current.limit.toLocaleString()} images each month
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${current.bg} ${current.color}`}>
                Active
              </span>
            </div>
            <div className="mt-6 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-primary/10 flex flex-col items-center justify-center gap-2">
              <p className="text-sm text-muted-foreground">
                Usage:{" "}
                <span className="font-mono text-foreground">
                  {used} / {limit}
                </span>
              </p>
              <div className="w-40 h-2 bg-background/80 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {plan !== "agency" && (
                <Button asChild variant="outline" onClick={() => window.location.href = "/pricing"}>
                  <ExternalLink className="size-4 mr-2" />
                  Upgrade plan
                </Button>
              )}
              {plan !== "free" && (
                <Button variant="outline" onClick={openPortal} disabled={portalLoading}>
                  {portalLoading ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <CreditCard className="size-4 mr-2" />}
                  Manage subscription
                </Button>
              )}
            </div>
          </>
        )}
      </section>
      <section className="dash-card" aria-labelledby="included-heading">
        <p id="included-heading" className="dash-label">
          Included in {current.name} plan
        </p>
        <ul className="mt-5 space-y-3 text-sm" role="list">
          {[
            { text: `${current.limit.toLocaleString()} image requests per month`, included: true },
            { text: "4 starter templates", included: true },
            { text: "Community support", included: true },
            { text: plan === "free" ? "OGCraft watermark on images" : "No watermark", included: plan !== "free" },
            { text: "Custom templates", included: plan !== "free" },
            { text: "Team access & SSO", included: plan === "agency" },
            { text: "Priority support", included: plan !== "free" },
          ].map((item, i) => (
            <motion.li
              key={item.text}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex items-center gap-2",
                item.included ? "" : "text-muted-foreground/50",
              )}
            >
              {item.included ? (
                <Check className="size-4 text-success shrink-0" strokeWidth={3} />
              ) : (
                <span className="size-4 text-muted-foreground/30 shrink-0">✕</span>
              )}
              <span>{item.text}</span>
              {!item.included && (
                <span className="ml-auto text-xs text-muted-foreground/60">
                  {item.text.includes("watermark") ? "Pro+" : item.text.includes("Custom") ? "Pro+" : "Agency"}
                </span>
              )}
            </motion.li>
          ))}
        </ul>
      </section>
    </div>
  );
}
