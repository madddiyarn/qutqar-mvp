import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "apps/web",
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:4100"
    }
  },
  build: {
    outDir: "../../dist/web",
    emptyOutDir: true
  }
});
