/**
 * The wasm packages, named once.
 *
 * Both the readiness check and the globals installer need to know that the
 * text shaper lives in `harfbuzzjs` and that its wasm sits in the same
 * directory as the code that opens it. Two copies of that fact would be two
 * places to forget to update, and the symptom is an opaque wasm error at
 * request time.
 */
export const WASM_HOST_PACKAGE = "harfbuzzjs";

/** The file `harfbuzzjs` looks for next to itself. */
export const WASM_HOST_FILE = "hb.wasm";

/** The layout engine satori loads, next to its own entry point. */
export const YOGA_PACKAGE = "satori";
export const YOGA_FILE = "yoga.wasm";
