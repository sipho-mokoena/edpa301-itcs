import { defineConfig } from "vite-plus";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      utils: path.resolve(__dirname, "../../packages/utils/src"),
    },
  },
});