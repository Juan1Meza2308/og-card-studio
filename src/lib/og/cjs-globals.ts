import { createRequire } from "node:module";
import { dirname } from "node:path";

/**
 * Installs the two CommonJS globals that `@vercel/og` assumes but cannot have.
 *
 * The package declares `"type": "module"`, so `dist/index.node.js` loads as
 * ESM even though its body is an esbuild CJS bundle. Inside it, the module
 * loader falls back to a global `require`, and the wasm loader computes its
 * path from `__dirname + "/"`. Neither exists under ESM, so the package throws
 * `Dynamic require of "fs" is not supported` the moment it touches the
 * filesystem — while it is being imported, not lazily.
 *
 * This module has no exports on purpose. It must be *evaluated* before
 * `@vercel/og`, and a bare side-effect import placed above it is the one
 * ordering that survives bundling: ES module evaluation order is a language
 * guarantee, whereas a dynamic `import()` inside the same file got hoisted
 * into a static one by rollup, which put the import first and the fix last.
 *
 * Both globals are set only when absent, and `__dirname` points at the
 * directory that genuinely holds `yoga.wasm` and `resvg.wasm` rather than at a
 * guess.
 */
const globals = globalThis as Record<string, unknown>;

if (typeof globals["require"] === "undefined") {
  globals["require"] = createRequire(import.meta.url);
}

if (typeof globals["__dirname"] === "undefined") {
  try {
    const nodeRequire = globals["require"] as NodeRequire;
    globals["__dirname"] = dirname(nodeRequire.resolve("@vercel/og"));
  } catch (error) {
    // Leave it unset instead of pointing it somewhere plausible but wrong.
    // The render then fails naming the real path, which beats a wasm error
    // pointing at a directory that never held it.
    console.error("[og] no se pudo resolver @vercel/og", error);
  }
}
