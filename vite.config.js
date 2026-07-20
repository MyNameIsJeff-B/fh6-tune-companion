import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    return ({
        base: mode === "pages" ? "/fh6-tune-companion/" : "/",
        plugins: [react()],
    });
});
