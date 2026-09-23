import { useEffect, useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
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
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

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

const nav = [
  { id: "overview", label: "Overview", icon: Gauge },
  { id: "keys", label: "API Keys", icon: KeyRound },
  { id: "templates", label: "Template Builder", icon: LayoutTemplate },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "billing", label: "Billing", icon: CreditCard },
] as const;

const bars = [28, 44, 35, 66, 51, 82, 63, 91, 58, 72, 47, 60];

const templateData = [
  { name: "Dark Gradient", theme: "violet", className: "og-dark-gradient" },
  { name: "Launch Signal", theme: "ocean", className: "og-tech" },
  { name: "Editorial Clean", theme: "light", className: "og-clean-white og-light" },
  { name: "Ember Release", theme: "ember", className: "og-minimalist" },
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
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [used, setUsed] = useState(42);
  const [limit, setLimit] = useState(100);
  const [newName, setNewName] = useState("Production");
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user?.email) setEmail(userData.user.email);
      const [{ data: keyRows }, { data: usageRows }] = await Promise.all([
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
      ]);
      if (keyRows) setKeys(keyRows);
      const current = usageRows?.[0];
      if (current) {
        setUsed(current.requests_used);
        setLimit(current.request_limit);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  async function generateKey() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    setGenerating(true);
    try {
      const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const bytes = crypto.getRandomValues(new Uint8Array(32));
      const secret = `og_live_${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
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

      if (!error) {
        setRevealed(secret);
        setNewName("Production");
        await loadData();
      }
    } finally {
      setGenerating(false);
    }
  }

  async function revoke(id: string) {
    await supabase.from("api_keys").update({ status: "revoked" }).eq("id", id);
    await loadData();
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
        <main className="min-w-0 flex-1">
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
              <p className="mt-1 text-[11px] text-muted-foreground">Free workspace</p>
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
      <main className="min-w-0 flex-1">
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
            <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              Systems operational
            </span>
            <ThemeToggle />
            <Button variant="ghost" size="icon" aria-label="More options">
              <MoreHorizontal />
            </Button>
          </div>
        </header>
        <div className="mx-auto max-w-7xl p-4 sm:p-8 animate-fade-up">
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
          {view === "overview" && <Overview used={used} limit={limit} />}
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
          {view === "templates" && <Templates />}
          {view === "analytics" && <Analytics used={used} />}
          {view === "billing" && <Billing used={used} limit={limit} />}
        </div>
      </main>
    </div>
  );
}

function Overview({ used, limit }: { used: number; limit: number }) {
  const percentage = Math.min((used / limit) * 100, 100);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="dash-card lg:col-span-2" aria-labelledby="usage-heading">
          <div className="flex items-start justify-between">
            <div>
              <p id="usage-heading" className="dash-label">
                Monthly usage
              </p>
              <p className="mt-3 text-3xl font-semibold">
                {used}{" "}
                <span className="text-base font-normal text-muted-foreground">/ {limit}</span>
              </p>
            </div>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Activity className="size-5" aria-hidden="true" />
            </div>
          </div>
          <div
            className="mt-7"
            role="progressbar"
            aria-valuenow={used}
            aria-valuemin={0}
            aria-valuemax={limit}
            aria-label="Monthly usage progress"
          >
            <Progress value={percentage} className="h-2" />
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>{limit - used} requests remaining</span>
            <span>
              Resets{" "}
              {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric" },
              )}
            </span>
          </div>
        </section>
        <section className="dash-card" aria-labelledby="render-heading">
          <p id="render-heading" className="dash-label">
            Average render
          </p>
          <p className="mt-4 text-3xl font-semibold">
            42<span className="ml-1 text-base text-muted-foreground">ms</span>
          </p>
          <p className="mt-5 flex items-center gap-2 text-xs text-success">
            <ShieldCheck className="size-4" aria-hidden="true" />
            99.99% API uptime
          </p>
        </section>
      </div>
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
        <div className="relative">
          <pre className="overflow-x-auto rounded-lg bg-code p-5 font-mono text-xs leading-6 text-code-foreground">
            <code>{`curl "https://api.ogcraft.dev/v1/og?title=Hello%20World&theme=violet" \\\n  -H "Authorization: Bearer og_live_••••••••" \\\n  --output preview.png`}</code>
          </pre>
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Copy code snippet"
          >
            <Copy className="size-4" />
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
                <tr key={key.id} className="transition-colors hover:bg-card/50">
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Templates() {
  const [selected, setSelected] = useState(0);

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h2 className="text-lg font-semibold">Template builder</h2>
        <p className="text-sm text-muted-foreground">
          Choose a foundation, then make it yours. Templates define the visual style of your OG
          cards.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-8">
        {templateData.map((item, index) => (
          <button
            type="button"
            onClick={() => setSelected(index)}
            key={item.name}
            className={cn(
              "relative group overflow-hidden rounded-xl border transition-all duration-200",
              "p-0",
              selected === index
                ? "border-primary ring-2 ring-primary/20 shadow-glow"
                : "border-border hover:border-primary/30",
            )}
            aria-pressed={selected === index}
            aria-label={item.name}
          >
            <div className={`og-preview og-${item.theme} ${item.className} aspect-[1200/630]`}>
              <div className="og-grid" aria-hidden="true" />
              <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-white">
                    <div className="grid size-6 place-items-center rounded bg-white/10">
                      <ExternalLink className="size-3" />
                    </div>
                    <span className="text-xs sm:text-sm">OGCraft</span>
                  </div>
                  <span className="font-mono text-[8px] opacity-60">ogcraft.dev</span>
                </div>
                <div className="flex-1 flex flex-col justify-end">
                  <p className="font-mono text-[10px] uppercase text-white/70">PREVIEW</p>
                  <h3 className="text-[clamp(16px,3vw,28px)] font-semibold leading-tight text-white">
                    Your card title
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-[10px] opacity-70 text-white">
                  <span>Generated in 42ms</span>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            {selected === index && (
              <div className="absolute top-3 right-3">
                <Check className="size-5 text-primary" strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>
      <section className="dash-card">
        <p className="dash-label">Default style</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <Label>Brand title</Label>
            <Input defaultValue="Build what comes next." />
          </label>
          <label className="space-y-2">
            <Label>Category</Label>
            <Input defaultValue="ENGINEERING / PRODUCT" />
          </label>
        </div>
        <div className="mt-5 flex gap-3">
          <Button>Save as default</Button>
          <Button variant="outline">Reset to preset</Button>
        </div>
      </section>
    </div>
  );
}

function Analytics({ used }: { used: number }) {
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
            +18.2%
          </span>
        </div>
        <div
          className="mt-10 flex h-56 items-end gap-3"
          role="img"
          aria-label="Monthly requests chart"
        >
          {bars.map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm bg-primary/80 transition-all duration-500 hover:bg-primary"
              style={{ height: `${height}%` }}
              title={`Day ${i + 1}: ${height}%`}
            />
          ))}
        </div>
      </section>
      <section className="dash-card" aria-labelledby="top-templates-heading">
        <p id="top-templates-heading" className="dash-label">
          Top templates
        </p>
        {[
          { name: "Dark Gradient", renders: 19, trend: "+12%" },
          { name: "Launch Signal", renders: 14, trend: "+8%" },
          { name: "Editorial Clean", renders: 9, trend: "-3%" },
          { name: "Ember Release", renders: 6, trend: "+22%" },
        ].map((item, i) => (
          <div
            key={item.name}
            className={cn(
              "mt-5 flex items-center justify-between text-sm",
              i > 0 && "pt-4 border-t border-border/50",
            )}
          >
            <span className="font-medium">{item.name}</span>
            <div className="flex items-center gap-3 text-right">
              <span className="text-muted-foreground">{item.renders} renders</span>
              <span
                className={cn(
                  "text-xs font-medium",
                  item.trend.startsWith("+") ? "text-success" : "text-destructive",
                )}
              >
                {item.trend}
              </span>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

function Billing({ used, limit }: { used: number; limit: number }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 animate-fade-up">
      <section className="dash-card" aria-labelledby="current-plan-heading">
        <p id="current-plan-heading" className="dash-label">
          Current plan
        </p>
        <div className="mt-5 flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold">Free</p>
            <p className="mt-1 text-sm text-muted-foreground">100 images each month</p>
          </div>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary font-medium">
            Active
          </span>
        </div>
        <div className="mt-6 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-xl border border-primary/10 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Usage:{" "}
            <span className="font-mono text-foreground">
              {used} / {limit}
            </span>
          </p>
        </div>
        <Button className="mt-6 w-full sm:w-auto">
          <ExternalLink className="size-4 mr-2" />
          Upgrade to Pro
        </Button>
      </section>
      <section className="dash-card" aria-labelledby="included-heading">
        <p id="included-heading" className="dash-label">
          Included in Free plan
        </p>
        <ul className="mt-5 space-y-3 text-sm" role="list">
          {[
            { text: "100 image requests per month", included: true },
            { text: "4 starter templates", included: true },
            { text: "Community support", included: true },
            { text: "OGCraft watermark on images", included: true },
            { text: "Custom templates", included: false },
            { text: "No watermark", included: false },
            { text: "Team access & SSO", included: false },
            { text: "Priority support", included: false },
          ].map((item) => (
            <li
              key={item.text}
              className={cn(
                "flex items-center gap-2",
                item.included ? "" : "text-muted-foreground/50",
              )}
            >
              {item.included ? (
                <Check className="size-4 text-success" strokeWidth={3} />
              ) : (
                <span className="size-4 text-muted-foreground/30">✕</span>
              )}
              <span>{item.text}</span>
              {!item.included && (
                <span className="ml-auto text-xs text-muted-foreground/60">Pro+</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
