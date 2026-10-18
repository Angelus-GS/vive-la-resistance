import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const plugins = [
  react(),
  tailwindcss(),
  VitePWA({
    strategies: "injectManifest",
    srcDir: "src",
    filename: "sw.ts",
    registerType: "autoUpdate",
    includeAssets: ["favicon.ico", "apple-touch-icon.png", "icon-192x192.png", "icon-512x512.png"],
    manifest: {
      name: "Vive la Resistance!",
      short_name: "ViveResist",
      description: "Variable Resistance Training tracker with band physics, Gorilla Gains programs, and offline-first local storage.",
      theme_color: "#1a181e",
      background_color: "#1a181e",
      display: "standalone",
      orientation: "portrait",
      scope: "./",
      start_url: "./",
      icons: [
        {
          src: "icon-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "maskable-icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    injectManifest: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webp}"],
    },
  }),
];

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/vive-la-resistance/' : '/',
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
