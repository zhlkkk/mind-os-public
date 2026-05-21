import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = resolve(here, "..");
const repoRoot = resolve(siteRoot, "..");
const source = resolve(repoRoot, "content/assets");
const target = resolve(siteRoot, "public/assets");
const lockDir = resolve(siteRoot, "public/.assets-sync.lock");

await withAssetSyncLock(async () => {
  await mkdir(target, { recursive: true });
  await cp(source, target, { recursive: true, force: true });
});

async function withAssetSyncLock(task) {
  await acquireLock();

  try {
    await task();
  } finally {
    await rm(lockDir, { recursive: true, force: true });
  }
}

async function acquireLock() {
  const startedAt = Date.now();

  await mkdir(dirname(lockDir), { recursive: true });

  while (true) {
    try {
      await mkdir(lockDir);
      return;
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      if (Date.now() - startedAt > 10_000) {
        throw new Error("Timed out waiting for asset sync lock");
      }

      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
  }
}
