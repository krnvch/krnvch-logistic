import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
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
