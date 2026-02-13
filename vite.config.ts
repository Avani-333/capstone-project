import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["vite.svg", "pwa-icon.svg"],
      manifest: {
        name: "Logic Looper",
        short_name: "LogicLooper",
        description: "A daily logic puzzle game",
        theme_color: "#414BEA",
        background_color: "#F6F5F5",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/pwa-icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,woff2,png}"]
      },
    }),
  ],
})
