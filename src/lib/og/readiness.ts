import { readFile } from "node:fs/promises";
import { WASM_HOST_FILE, WASM_HOST_PACKAGE, YOGA_FILE, YOGA_PACKAGE } from "./wasm-packages";

/**
 * Readiness of the image renderer, checked without rendering.
 *
 * This exists because the two failures that actually happened were both
 * invisible until a request arrived: the wasm was not where the loader
 * expected, and the native binary did not match the platform. A page that
 * asserts "all systems operational" without asking is worse than no page.
 *
 * A readiness check deliberately does not render a card. `/api/health` is
 * public and unauthenticated, so making it spend a CPU-bound render would
 * turn an uptime monitor into a way to burn the function's time. These checks
 * are file and module lookups: they catch the failure modes, they cost
 * nothing, and they cannot themselves be the outage.
 */

export type ReadinessCheck = {
  id: string;
  label: string;
  ok: boolean;
  /** What was actually observed. Never an absolute path in a public response. */
  detail: string;
};

export type RendererReadiness = {
  ok: boolean;
  checks: ReadinessCheck[];
};

function readSomething(file: string): Promise<boolean> {
  // The contents are irrelevant; only that the loader will find and open it.
  return readFile(file).then(
    () => true,
    () => false,
  );
}

/**
 * Asks whether one wasm file is reachable the way its own package says it
 * should be, by resolving the subpath through the package's exports map.
 *
 * Guessing a directory instead would have been wrong the moment it was
 * written: satori's entry point is in `dist/` and its wasm sits at the package
 * root, and harfbuzzjs declares no exports map at all. The subpath is the
 * contract the loader itself relies on, so it is the one worth checking.
 */
async function checkResolvableWasm(specifier: string): Promise<ReadinessCheck> {
  const id = `wasm-${specifier}`;
  const label = `${specifier} is resolvable and readable`;
  try {
    const require = (globalThis as Record<string, unknown>)["require"] as NodeRequire | undefined;
    if (typeof require !== "function") {
      return { id, label, ok: false, detail: "CommonJS globals not installed" };
    }
    const ok = await readSomething(require.resolve(specifier));
    return { id, label, ok, detail: ok ? "resolvable" : "resolved but unreadable" };
  } catch (error) {
    return {
      id,
      label,
      ok: false,
      detail:
        error instanceof Error
          ? ((error as NodeJS.ErrnoException).code ?? error.message)
          : "unresolvable",
    };
  }
}

/**
 * Walks the renderer's real dependencies. Ordered cheapest first so a broken
 * deployment still produces a report rather than throwing on the first probe.
 */
export async function checkRendererReadiness(): Promise<RendererReadiness> {
  const checks: ReadinessCheck[] = [];

  const globals = globalThis as Record<string, unknown>;
  const globalsOk =
    typeof globals["require"] === "function" && typeof globals["__dirname"] === "string";
  checks.push({
    id: "globals",
    label: "CommonJS globals installed for the wasm loaders",
    ok: globalsOk,
    detail: globalsOk ? "installed" : "not installed",
  });

  const [harfbuzz, yoga] = await Promise.all([
    checkResolvableWasm(`${WASM_HOST_PACKAGE}/${WASM_HOST_FILE}`),
    checkResolvableWasm(`${YOGA_PACKAGE}/${YOGA_FILE}`),
  ]);
  checks.push(harfbuzz, yoga);

  // Importing resvg is the check: the package is a native addon, and the
  // platform mismatch only surfaces when the binary is actually loaded.
  try {
    const { Resvg } = await import("@resvg/resvg-js");
    const probe = new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');
    probe.render();
    checks.push({
      id: "resvg",
      label: "resvg native module loads and rasterises",
      ok: true,
      detail: "rasterised a 1x1 probe",
    });
  } catch (error) {
    checks.push({
      id: "resvg",
      label: "resvg native module loads and rasterises",
      ok: false,
      detail: error instanceof Error ? error.message : "load failed",
    });
  }

  return { ok: checks.every((check) => check.ok), checks };
}
