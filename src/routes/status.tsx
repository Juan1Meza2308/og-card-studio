import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import { PageIntro, PublicFooter, PublicNav } from "@/components/ogcraft/marketing";
import { breadcrumbJsonLd, buildSeo } from "@/lib/seo";
import type { ReadinessCheck } from "@/lib/og/readiness";

/** The probe is fetched again after this long, so the page cannot go stale. */
const REFRESH_INTERVAL_MS = 60_000;

type ProbeState =
  | { phase: "loading" }
  | { phase: "ready"; ok: boolean; checks: ReadinessCheck[]; ts: number }
  | { phase: "unreachable" };

function relativeTime(ts: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - ts) / 1000));
  if (seconds < 5) return "hace un momento";
  if (seconds < 60) return `hace ${seconds} s`;
  return `hace ${Math.round(seconds / 60)} min`;
}

/**
 * The status page reports a probe it actually ran.
 *
 * It used to say "All systems operational" as a literal, which meant it would
 * have kept claiming that while the renderer was throwing on every request.
 * A status page that cannot be wrong is a status page that is lying.
 */
function StatusReport() {
  const [state, setState] = useState<ProbeState>({ phase: "loading" });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function probe() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const payload = (await response.json()) as {
          ok: boolean;
          ts: number;
          checks: ReadinessCheck[];
        };
        if (cancelled) return;
        setNow(Date.now());
        setState({ phase: "ready", ok: payload.ok, checks: payload.checks, ts: payload.ts });
      } catch {
        if (!cancelled) setState({ phase: "unreachable" });
      }
    }

    void probe();
    const interval = window.setInterval(() => void probe(), REFRESH_INTERVAL_MS);
    const clock = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearInterval(clock);
    };
  }, []);

  if (state.phase === "loading") {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Consultando el estado del renderer…
      </p>
    );
  }

  if (state.phase === "unreachable") {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-5">
        <p className="flex items-center gap-2 font-medium text-destructive">
          <CircleAlert className="size-4" aria-hidden />
          No se pudo contactar al probe
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          La propia sonda de estado falló, así que no hay nada honesto que informar. Si ves esto de
          forma persistente, el problema puede estar en el edge y no en el renderer.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p
        className={`flex items-center gap-2 text-lg font-medium ${state.ok ? "text-success" : "text-destructive"}`}
      >
        {state.ok ? (
          <CheckCircle2 className="size-5" aria-hidden />
        ) : (
          <CircleAlert className="size-5" aria-hidden />
        )}
        {state.ok ? "El renderer está operativo." : "El renderer tiene una dependencia caída."}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Última comprobación {relativeTime(state.ts, now)} · se repite cada 60 s
      </p>

      <ul className="mt-6 divide-y divide-border/70 rounded-xl border border-border/80">
        {state.checks.map((check) => (
          <li key={check.id} className="flex items-start gap-3 p-4">
            {check.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium">{check.label}</p>
              <p className="text-xs text-muted-foreground">{check.detail}</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-muted-foreground">
        Esta sonda comprueba que las dependencias del renderer estén donde el proceso las va a
        buscar, no que una tarjeta concreta se pinte. Es deliberado:{" "}
        <code className="rounded bg-workspace px-1 py-0.5">/api/health</code> es público y sin
        autenticación, así que gastar un render en cada consulta convertiría un monitor de uptime en
        una forma de quemar la función.
      </p>
    </div>
  );
}

export const Route = createFileRoute("/status")({
  head: () =>
    buildSeo({
      title: "System Status — OGCraft",
      description: "Current availability of OGCraft services.",
      path: "/status",
      jsonLd: [
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Status", path: "/status" },
        ]),
      ],
    }),
  component: () => (
    <>
      <PublicNav />
      <main id="main-content" tabIndex={-1} className="min-h-screen">
        <PageIntro
          eyebrow="Status"
          title="Estado del renderer de imágenes."
          text="Lo que sigue sale de una sonda real ejecutada en este momento, no de un texto fijo."
          icon={CheckCircle2}
        />
        <section className="mx-auto w-full max-w-2xl px-6 pb-24">
          <StatusReport />
        </section>
      </main>
      <PublicFooter />
    </>
  ),
});
