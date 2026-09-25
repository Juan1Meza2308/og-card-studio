// Side-effect import first: it installs the CommonJS globals `@vercel/og`
// needs. See the comment in ./cjs-globals.ts for why the ordering is load
// bearing and cannot be replaced by a dynamic import.
import "./cjs-globals";

export { ImageResponse } from "@vercel/og";
