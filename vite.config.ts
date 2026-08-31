// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import type { Plugin } from "vite";

/**
 * The devtools "go to source" transform adds `data-tsd-source` attributes to every JSX
 * element. react-three-fiber elements are three.js objects, not DOM nodes, so an unknown
 * dashed prop throws ("Cannot set data-tsd-source") and blanks the 3D scenes.
 * Strip the injected attribute from our three.js component files only.
 */
function stripTsdSourceFromThree(): Plugin {
  return {
    name: "hcc:strip-tsd-source-in-three",
    enforce: "post",
    transform(code, id) {
      if (!id.includes("/three/") && !id.includes("Volumetrics")) return null;
      if (!code.includes("data-tsd-source")) return null;
      const out = code
        .replace(/,\s*"data-tsd-source"\s*:\s*"[^"]*"/g, "")
        .replace(/"data-tsd-source"\s*:\s*"[^"]*"\s*,?/g, "")
        .replace(/\sdata-tsd-source="[^"]*"/g, "");
      return { code: out, map: null };
    },
  };
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [stripTsdSourceFromThree()],
  },
});
