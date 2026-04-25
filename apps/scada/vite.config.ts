import { defineConfig } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      utils: path.resolve(__dirname, "../../packages/utils/src"),
    },
  },
  plugins: [
    tanstackStart({
      srcDirectory: "src",
    }),
    viteReact(),
    nitro(),
    tailwindcss(),
  ],
});
