import { defineConfig, loadEnv } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const localEnv = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      proxy: {
        "/api": {
          target: "http://localhost:8787",
          changeOrigin: true,
          headers: {
            "X-Ortsschildsprint-Internal-Secret":
              localEnv.INTERNAL_API_SECRET ?? "",
          },
          rewrite: (path) => path.replace(/^\/api/, "") || "/",
        },
      },
    },
    optimizeDeps: {
      exclude: ["maplibre-gl"],
    },
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      cloudflare(),
    ],
  };
});
