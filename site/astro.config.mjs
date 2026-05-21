import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  integrations: [mdx()],
  site: "https://zhlkkk.github.io/mind-os-public",
  base: isGitHubPages ? "/mind-os-public" : "/",
  output: "static",
});
