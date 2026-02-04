import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Wichtig für GitHub Pages (dein Repo-Name)
  base: "/VividDecks/",
});
