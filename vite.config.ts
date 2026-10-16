// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { createRequire } from "node:module";

const browserEvents = createRequire(import.meta.url).resolve("events/");
const parse5Entry = createRequire(import.meta.url).resolve("parse5");

export default defineConfig({
  vite: {
    plugins: [
      {
        name: "pdf-browser-events",
        // react-pdf's queue uses Node EventEmitter. Resolve the browser package
        // for client bundles only; keep the server's native events implementation.
        enforce: "pre",
        resolveId(source, _importer, options) {
          if (!options.ssr && (source === "events" || source === "node:events"))
            return browserEvents;
          return null;
        },
      },
      {
        name: "deno-npm-parse5",
        // supabase/functions/_shared/proposal-html.ts uses Deno's `npm:` specifier;
        // map it to the installed parse5 package for browser/SSR bundles.
        enforce: "pre",
        resolveId(source) {
          if (source === "npm:parse5@7.3.0") return parse5Entry;
          return null;
        },
      },
    ],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
