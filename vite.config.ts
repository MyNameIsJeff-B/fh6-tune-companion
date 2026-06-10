import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? "/fh6-tune-companion/" : "/",
  plugins: [react()],
}));
