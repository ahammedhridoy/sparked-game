import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon.png", "*.png"],
      manifest: {
        name: "Sparked Connection",
        short_name: "Sparked",
        description: "Connection Card Game for Couples",
        theme_color: "#1a1a1a",
        background_color: "#1a1a1a",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "https://sparked-game.onrender.com",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "https://sparked-game.onrender.com",
        ws: true,
        changeOrigin: true,
      },
      "/uploads": {
        target: "https://sparked-game.onrender.com",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
