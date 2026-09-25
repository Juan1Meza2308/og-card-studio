import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
  },
  // nitro() emits the deploy-anywhere server build that Vercel runs as a
  // function. Without it the build only emits a bare fetch handler and the
  // "tanstack-start" preset has no output to serve.
  plugins: [tanstackStart(), nitro(), viteReact(), tailwindcss(), viteTsConfigPaths()],
});
