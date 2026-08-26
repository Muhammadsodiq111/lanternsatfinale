// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// `STATIC_EXPORT=true bun run build` produces a fully static SPA bundle
// (dist/client/index.html + assets) that can be uploaded to any plain
// web host such as cPanel. The normal build is untouched.
const staticExport = process.env["STATIC_EXPORT"] === "true";

export default defineConfig({
  tanstackStart: staticExport
    ? {
        spa: { enabled: true },
        // Redirect TanStack Start's bundled server entry to src/server.ts.
        server: { entry: "server" },
      }
    : {
        // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
        // nitro/vite builds from this
        server: { entry: "server" },
      },
});
