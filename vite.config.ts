import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

// Source maps are generated and uploaded to Sentry only when SENTRY_AUTH_TOKEN
// is present (Vercel builds). Without the token (local, CI) no .map files are
// emitted at all, so the build output never ships readable source publicly.
const uploadSourceMaps = !!process.env.SENTRY_AUTH_TOKEN;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    sentryVitePlugin({
      disable: !uploadSourceMaps,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      telemetry: false,
      sourcemaps: {
        // Maps exist only for the upload; never deploy them to Vercel.
        filesToDeleteAfterUpload: "./dist/**/*.map",
      },
      // A failed upload must not take down the production deploy.
      errorHandler(err) {
        console.warn("[sentry-vite-plugin] source map upload failed:", err);
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: uploadSourceMaps ? "hidden" : false,
    rollupOptions: {
      output: {
        // Bundle all third-party deps into a single vendor chunk. A manual
        // vendor/ui split previously broke the production build: it separated
        // React from React-dependent libs (radix-ui) across chunks, creating a
        // circular ui<->vendor dependency where the ui chunk evaluated before
        // React was defined ("Cannot read properties of undefined (reading
        // 'createContext')"). Keeping React and its consumers together avoids it.
        manualChunks(id) {
          if (id.includes("node_modules")) return "vendor";
        },
      },
    },
  },
});
