import { createRequire } from "node:module";
import { dirname } from "node:path";

/** The globals the wasm loaders assume but cannot have under ESM. */
export const REQUIRED_GLOBALS = ["require", "__dirname"] as const;

/** The package whose directory holds the wasm the loaders look for. */
const WASM_HOST_PACKAGE = "harfbuzzjs";

/**
 * Installs the two globals that satori's wasm loaders assume but cannot have.
 *
 * satori reaches text shaping through `harfbuzzjs`, which is an emscripten
 * build, and emscripten was written for CommonJS: it resolves modules through a
 * global `require` and locates `hb.wasm` as a sibling of the module doing the
 * loading, via `__dirname + "/"`. Under ESM neither global exists, so it
 * throws on the first filesystem access — while the module is being imported,
 * not lazily, which is why pre-initialising satori does not help.
 *
 * `__dirname` is pointed at the resolved `harfbuzzjs` directory rather than at
 * the directory this file happens to live in. The loader is bundled into a
 * different directory than the entry chunk, and the wasm sits next to the
 * package that owns it, so resolving the package is the only anchor that
 * survives a bundle, a serverless function and a change of output layout.
 *
 * Each global is set only when absent, and calling this twice is harmless.
 *
 * It reports what it installed rather than returning nothing, for two reasons.
 * The caller can warn when a global is missing instead of discovering it later
 * as an opaque wasm error, and the return value is what stops the bundler from
 * proving the call pure: a function body whose only statements are assignments
 * to `globalThis` looks side-effect free, and this module was being dropped
 * from the build without it.
 */
export function installCommonJsGlobals(): string[] {
  const globals = globalThis as Record<string, unknown>;
  const installed: string[] = [];

  if (typeof globals["require"] === "undefined") {
    globals["require"] = createRequire(import.meta.url);
    installed.push("require");
  }

  if (typeof globals["__dirname"] === "undefined") {
    try {
      const nodeRequire = globals["require"] as NodeRequire;
      globals["__dirname"] = dirname(nodeRequire.resolve(WASM_HOST_PACKAGE));
      installed.push("__dirname");
    } catch (error) {
      // Leave it unset instead of pointing it somewhere plausible but wrong.
      // The render then fails naming the real path, which beats a wasm error
      // pointing at a directory that never held it.
      console.error(`[og] no se pudo resolver ${WASM_HOST_PACKAGE}`, error);
    }
  }

  return installed;
}
