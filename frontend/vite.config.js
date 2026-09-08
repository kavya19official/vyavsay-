import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Backend URL: override with VITE_API_URL if it's not running on localhost:4000.
const API_TARGET = process.env.VITE_API_URL || "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
});
