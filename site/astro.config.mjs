import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  integrations: [mdx()],
  site: "https://kain-ai.xyz/mind-os-public",
  base: isGitHubPages ? "/mind-os-public" : "/",
  output: "static",
});
