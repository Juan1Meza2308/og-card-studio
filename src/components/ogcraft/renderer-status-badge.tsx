import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

/** Re-read often enough that a recovered renderer stops looking broken. */
const REFRESH_INTERVAL_MS = 60_000;

type BadgeState = { phase: "loading" } | { phase: "ok" } | { phase: "down" } | { phase: "unknown" };

/**
 * The dashboard's status badge reads `/api/health`, the same probe `/status`
 * uses, so the two can never disagree.
 *
 * It used to be the literal text "Systems operational", which meant it would
 * have kept saying that while every render threw. The unknown state is
 * deliberate and not folded into "ok": a badge that turns green when it
 * cannot reach the probe is a badge that lies exactly when it matters.
 */
export function RendererStatusBadge() {
  const [state, setState] = useState<BadgeState>({ phase: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        if (cancelled) return;
        setState(response.ok ? { phase: "ok" } : { phase: "down" });
      } catch {
        if (!cancelled) setState({ phase: "unknown" });
      }
    }

    void probe();
    const interval = window.setInterval(() => void probe(), REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const { dotClass, label } = {
    loading: { dotClass: "bg-muted-foreground animate-pulse", label: "Checking renderer" },
    ok: { dotClass: "bg-success", label: "Systems operational" },
    down: { dotClass: "bg-destructive", label: "Renderer degraded" },
    unknown: { dotClass: "bg-destructive", label: "Renderer unreachable" },
  }[state.phase];

  return (
    <span className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground sm:flex">
      {state.phase === "loading" ? (
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
      ) : (
        <span className={`size-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
      )}
      {label}
    </span>
  );
}
