import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { formatDiscussionLabel } from "../src/lib/discussion.js";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distRoot = path.join(siteRoot, "dist");

function readArticle(slug) {
  const html = readFileSync(path.join(distRoot, "articles", slug, "index.html"), "utf8");
  assert.match(html, /^<!DOCTYPE html>/i, `${slug} 缺少 HTML doctype`);
  assert.match(html, /<\/html>\s*$/i, `${slug} 缺少闭合的 html 标签`);
  return html;
}

const article = readArticle("ai-learning-tool-or-crutch");
const speedRead = article.match(/<section class="article-speed-read"[\s\S]*?<\/section>/);

assert.ok(speedRead, "新文章缺少 5 分钟速读区块");
assert.equal((speedRead[0].match(/<li(?:\s|>)/g) ?? []).length, 5, "新文章应包含 5 条速读摘要");
assert.match(article, /href="https:\/\/github\.com\/zhlkkk\/mind-os-public\/issues\/15"/);
assert.match(article, /Open Thread[^<]* · #15/);
assert.match(article, /href="\/assets\/articles\/ai-learning-tool-or-crutch\/learning-skills\.zip"/);

const articleWithoutDiscussion = readArticle("gitbutler-agent-safe-git");
assert.doesNotMatch(articleWithoutDiscussion, /class="article-discussion"/);
assert.doesNotMatch(articleWithoutDiscussion, /#undefined/);
assert.equal(formatDiscussionLabel(15), "参与讨论 #15");
assert.equal(formatDiscussionLabel(undefined), "参与讨论");

for (const asset of ["cover.png", "learning-skills.zip"]) {
  assert.ok(
    existsSync(path.join(distRoot, "assets", "articles", "ai-learning-tool-or-crutch", asset)),
    `发布资源缺失：${asset}`,
  );
}

console.log("构建产物校验通过：新文章、速读摘要、讨论入口与公开资源均完整。");
