import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Activity, BarChart3, Check, ChevronLeft, ChevronRight, Copy, CreditCard, Gauge, KeyRound, LayoutTemplate, LogOut, MoreHorizontal, Plus, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Logo } from "./logo";

type View = "overview" | "keys" | "templates" | "analytics" | "billing";
type ApiKey = { id: string; name: string; key_prefix: string; last_four: string; created_at: string; last_used_at: string | null; status: string };
const nav = [{ id: "overview", label: "Overview", icon: Gauge }, { id: "keys", label: "API Keys", icon: KeyRound }, { id: "templates", label: "Template Builder", icon: LayoutTemplate }, { id: "analytics", label: "Analytics", icon: BarChart3 }, { id: "billing", label: "Billing", icon: CreditCard }] as const;
const bars = [28, 44, 35, 66, 51, 82, 63, 91, 58, 72, 47, 60];
const templateData = [{ name: "Dark Gradient", theme: "violet" }, { name: "Launch Signal", theme: "ocean" }, { name: "Editorial Clean", theme: "light" }, { name: "Ember Release", theme: "ember" }];

export function Dashboard() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [email, setEmail] = useState("Developer");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [used, setUsed] = useState(42);
  const [limit, setLimit] = useState(100);
  const [newName, setNewName] = useState("Production");
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState<string | null>(null);

  async function loadData() {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.email) setEmail(userData.user.email);
    const [{ data: keyRows }, { data: usageRows }] = await Promise.all([
      supabase.from("api_keys").select("id,name,key_prefix,last_four,created_at,last_used_at,status").eq("status", "active").order("created_at", { ascending: false }),
      supabase.from("usage_stats").select("requests_used,request_limit").order("period_start", { ascending: false }).limit(1),
    ]);
    if (keyRows) setKeys(keyRows);
    const current = usageRows?.[0]; if (current) { setUsed(current.requests_used); setLimit(current.request_limit); }
  }
  useEffect(() => { void loadData(); }, []);

  async function generateKey() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const secret = `og_live_${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")}`;
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
    const keyHash = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
    const { error } = await supabase.from("api_keys").insert({ user_id: userData.user.id, name: newName.trim() || "Untitled key", key_prefix: "og_live_", last_four: secret.slice(-4), key_hash: keyHash });
    if (!error) { setRevealed(secret); setNewName("Production"); await loadData(); }
  }
  async function revoke(id: string) { await supabase.from("api_keys").update({ status: "revoked" }).eq("id", id); await loadData(); }
  async function signOut() { await supabase.auth.signOut(); navigate({ to: "/auth", replace: true }); }

  return (
    <div className="flex min-h-screen bg-dashboard text-foreground">
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border/60 bg-sidebar transition-all md:flex ${collapsed ? "w-16" : "w-60"}`}>
        <div className="flex h-16 items-center justify-between border-b border-border/60 px-4"><Logo compact={collapsed} /><Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight /> : <ChevronLeft />}</Button></div>
        <nav className="flex-1 space-y-1 p-3">{nav.map((item) => <Button key={item.id} variant={view === item.id ? "secondary" : "ghost"} className={`w-full ${collapsed ? "px-0" : "justify-start"}`} onClick={() => setView(item.id)} title={item.label}><item.icon />{!collapsed && item.label}</Button>)}</nav>
        <div className="border-t border-border/60 p-3"><div className={`mb-3 min-w-0 ${collapsed ? "hidden" : "block"}`}><p className="truncate text-xs font-medium">{email}</p><p className="mt-1 text-[11px] text-muted-foreground">Free workspace</p></div><Button variant="ghost" className={`w-full text-muted-foreground ${collapsed ? "px-0" : "justify-start"}`} onClick={signOut}><LogOut />{!collapsed && "Sign out"}</Button></div>
      </aside>
      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/60 bg-dashboard/85 px-4 backdrop-blur-xl sm:px-8"><div><p className="font-mono text-[10px] uppercase text-primary">Workspace / {view}</p><h1 className="text-lg font-semibold capitalize">{view === "keys" ? "API Keys" : view}</h1></div><div className="flex items-center gap-2"><span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex"><span className="size-1.5 rounded-full bg-success" /> Systems operational</span><Button variant="outline" size="icon" aria-label="More options"><MoreHorizontal /></Button></div></header>
        <div className="mx-auto max-w-7xl p-4 sm:p-8">
          <div className="mb-6 flex gap-2 overflow-x-auto md:hidden">{nav.map((item) => <Button key={item.id} size="sm" variant={view === item.id ? "default" : "outline"} onClick={() => setView(item.id)}><item.icon />{item.label}</Button>)}</div>
          {view === "overview" && <Overview used={used} limit={limit} />}
          {view === "keys" && <Keys keys={keys} revoke={revoke} open={open} setOpen={setOpen} newName={newName} setNewName={setNewName} revealed={revealed} generateKey={generateKey} />}
          {view === "templates" && <Templates />}
          {view === "analytics" && <Analytics used={used} />}
          {view === "billing" && <Billing />}
        </div>
      </main>
    </div>
  );
}

function Overview({ used, limit }: { used: number; limit: number }) {
  return <div className="space-y-6"><div className="grid gap-4 lg:grid-cols-3"><section className="dash-card lg:col-span-2"><div className="flex items-start justify-between"><div><p className="dash-label">Monthly usage</p><p className="mt-3 text-3xl font-semibold">{used} <span className="text-base font-normal text-muted-foreground">/ {limit}</span></p></div><Activity className="text-primary" /></div><Progress value={(used / limit) * 100} className="mt-7" /><div className="mt-3 flex justify-between text-xs text-muted-foreground"><span>{limit - used} requests remaining</span><span>Resets Oct 1</span></div></section><section className="dash-card"><p className="dash-label">Average render</p><p className="mt-4 text-3xl font-semibold">42<span className="ml-1 text-base text-muted-foreground">ms</span></p><p className="mt-5 flex items-center gap-2 text-xs text-success"><ShieldCheck className="size-4" /> 99.99% API uptime</p></section></div><section className="dash-card"><div className="mb-5 flex items-center gap-3"><span className="icon-box"><Sparkles /></span><div><h2 className="font-semibold">Your first image in under a minute</h2><p className="text-sm text-muted-foreground">Copy this request and replace the title.</p></div></div><pre className="overflow-x-auto rounded-lg bg-code p-5 font-mono text-xs leading-6 text-code-foreground"><code>{`curl "https://api.ogcraft.dev/v1/og?title=Hello%20World&theme=violet" \\\n  -H "Authorization: Bearer og_live_••••••••" \\\n  --output preview.png`}</code></pre></section></div>;
}

function Keys({ keys, revoke, open, setOpen, newName, setNewName, revealed, generateKey }: { keys: ApiKey[]; revoke: (id: string) => void; open: boolean; setOpen: (v: boolean) => void; newName: string; setNewName: (v: string) => void; revealed: string | null; generateKey: () => void }) {
  const [copied, setCopied] = useState("");
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); setCopied(value); setTimeout(() => setCopied(""), 1200); };
  return <section className="dash-card"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-lg font-semibold">API keys</h2><p className="text-sm text-muted-foreground">Use keys from secure server environments only.</p></div><Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus /> Generate New API Key</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Generate API key</DialogTitle><DialogDescription>Name this key so you know where it is used.</DialogDescription></DialogHeader>{revealed ? <div><Label>Your new key</Label><div className="mt-2 flex gap-2"><Input readOnly value={revealed} className="font-mono" /><Button size="icon" onClick={() => copy(revealed)} aria-label="Copy new key">{copied === revealed ? <Check /> : <Copy />}</Button></div><p className="mt-2 text-xs text-warning">Copy it now. It will not be shown again.</p></div> : <label className="space-y-2"><Label>Key name</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} /></label>}<DialogFooter>{revealed ? <Button onClick={() => { setOpen(false); window.setTimeout(() => location.reload(), 100); }}>Done</Button> : <Button onClick={generateKey}>Generate key</Button>}</DialogFooter></DialogContent></Dialog></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-y border-border text-xs text-muted-foreground"><tr><th className="py-3 font-medium">Key name</th><th className="font-medium">Key prefix</th><th className="font-medium">Created</th><th className="font-medium">Last used</th><th className="text-right font-medium">Actions</th></tr></thead><tbody>{keys.map((key) => <tr key={key.id} className="border-b border-border/60"><td className="py-4 font-medium">{key.name}</td><td><code className="rounded bg-muted px-2 py-1 text-xs">{key.key_prefix}••••{key.last_four}</code></td><td className="text-muted-foreground">{new Date(key.created_at).toLocaleDateString()}</td><td className="text-muted-foreground">{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}</td><td><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => copy(`${key.key_prefix}••••${key.last_four}`)} aria-label="Copy key prefix">{copied.includes(key.last_four) ? <Check /> : <Copy />}</Button><Button variant="ghost" size="icon" onClick={() => revoke(key.id)} aria-label="Revoke key"><Trash2 /></Button></div></td></tr>)}</tbody></table></div></section>;
}

function Templates() { const [selected, setSelected] = useState(0); return <div><div className="mb-6"><h2 className="text-lg font-semibold">Template builder</h2><p className="text-sm text-muted-foreground">Choose a foundation, then make it yours.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{templateData.map((item, index) => <button type="button" onClick={() => setSelected(index)} key={item.name} className={`template-card ${selected === index ? "border-primary ring-2 ring-primary/20" : "border-border"}`}><div className={`template-thumb template-${item.theme}`}><span className="font-mono text-[8px] opacity-70">OGCRAFT / 01</span><strong>Build what<br />comes next.</strong></div><div className="flex items-center justify-between p-4 text-sm font-medium">{item.name}{selected === index && <Check className="size-4 text-primary" />}</div></button>)}</div>{selected >= 0 && <section className="dash-card mt-6"><p className="dash-label">Default style</p><div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="space-y-2"><Label>Brand title</Label><Input defaultValue="Build what comes next." /></label><label className="space-y-2"><Label>Category</Label><Input defaultValue="ENGINEERING / PRODUCT" /></label></div><Button className="mt-5">Save template</Button></section>}</div>; }
function Analytics({ used }: { used: number }) { return <div className="grid gap-4 lg:grid-cols-3"><section className="dash-card lg:col-span-2"><div className="flex justify-between"><div><p className="dash-label">Requests this month</p><p className="mt-2 text-3xl font-semibold">{used}</p></div><span className="text-xs text-success">+18.2%</span></div><div className="mt-10 flex h-52 items-end gap-3">{bars.map((height, i) => <div key={i} className="flex-1 rounded-t-sm bg-primary/80" style={{ height: `${height}%` }} />)}</div></section><section className="dash-card"><p className="dash-label">Top templates</p>{["Dark Gradient", "Tech", "Clean White"].map((name, i) => <div key={name} className="mt-5 flex items-center justify-between text-sm"><span>{name}</span><span className="text-muted-foreground">{[19, 14, 9][i]} renders</span></div>)}</section></div>; }
function Billing() { return <div className="grid gap-4 lg:grid-cols-2"><section className="dash-card"><p className="dash-label">Current plan</p><div className="mt-5 flex items-end justify-between"><div><p className="text-3xl font-semibold">Free</p><p className="mt-1 text-sm text-muted-foreground">100 images each month</p></div><span className="rounded-full bg-primary/15 px-3 py-1 text-xs text-primary">Active</span></div><Button className="mt-8">Upgrade to Pro</Button></section><section className="dash-card"><p className="dash-label">Included</p><ul className="mt-5 space-y-3 text-sm">{["100 image requests", "Four starter templates", "Community support", "OGCraft watermark"].map((item) => <li className="flex items-center gap-2" key={item}><Check className="size-4 text-success" />{item}</li>)}</ul></section></div>; }
