import { cp, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, "..");
const repoRoot = resolve(siteRoot, "..");
const source = resolve(repoRoot, "content/assets");
const target = resolve(siteRoot, "public/assets");

await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true, force: true });
