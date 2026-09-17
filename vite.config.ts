// ============= Full file contents =============

// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.

import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Load ALL env vars into process.env for server-side code only (server
// routes/functions need non-VITE_ secrets). Never expose these via define.
const serverEnv = loadEnv(process.env.NODE_ENV ?? "development", process.cwd(), "");
Object.assign(process.env, serverEnv);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },

  vite: {
    resolve: {
      // Array form + exact regex: only bare "entities" and the v4 deep imports are
      // pinned to the hoisted v4.5.0 copy. A plain string "entities" alias would
      // also rewrite prefixed subpaths like "entities/escape" (parse5 / entities v7),
      // which don't exist in v4.5.0 and break the build.
      alias: [
        {
          find: /^entities\/lib\/decode\.js$/,
          replacement: path.resolve(
            __dirname,
            "node_modules/entities/lib/decode.js",
          ),
        },
        {
          find: /^entities\/lib\/encode\.js$/,
          replacement: path.resolve(
            __dirname,
            "node_modules/entities/lib/encode.js",
          ),
        },
        {
          find: /^entities$/,
          replacement: path.resolve(__dirname, "node_modules/entities"),
        },
      ],
    },
  },
});
