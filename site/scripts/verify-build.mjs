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
assert.equal((article.match(/class="dialogue-blockquote"/g) ?? []).length, 1, "新文章应包含一个对话实录区块");
assert.match(article, /class="dialogue-speaker">GPT-5\.6 Sol：<\/strong>/);
assert.match(article, /class="dialogue-copy">请先收起原答案/);
assert.match(article, /<blockquote class="editorial-quote">/);
assert.equal((article.match(/class="editorial-section-heading"/g) ?? []).length, 12, "新文章应包含 12 个编辑式章节标题");
assert.match(article, /class="section-watermark" aria-hidden="true">01<\/span>/);
assert.match(article, /class="section-watermark" aria-hidden="true">∞<\/span><span class="section-kicker">结语<\/span>/);
assert.match(article, /class="section-title">三套判分标准，越严越低/);

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

const contextEngineeringArticle = readArticle("claude-code-context-engineering");
const contextEngineeringSpeedRead = contextEngineeringArticle.match(
  /<section class="article-speed-read"[\s\S]*?<\/section>/,
);

assert.ok(contextEngineeringSpeedRead, "上下文工程文章缺少 5 分钟速读区块");
assert.equal(
  (contextEngineeringSpeedRead[0].match(/<li(?:\s|>)/g) ?? []).length,
  5,
  "上下文工程文章应包含 5 条速读摘要",
);
assert.match(contextEngineeringArticle, /href="https:\/\/github\.com\/zhlkkk\/mind-os-public\/issues\/16"/);
assert.match(contextEngineeringArticle, /Open Thread[^<]* · #16/);
assert.equal(
  (contextEngineeringArticle.match(/class="editorial-section-heading"/g) ?? []).length,
  8,
  "上下文工程文章应包含 8 个编辑式章节标题",
);
for (const title of [
  "为什么删了反而更好",
  "六条转变，每条都影响你的 CLAUDE.md",
  "<code>claude doctor</code>：一键体检",
  "效率优化，还是模型锁定？",
  "自动记忆的坑",
  "Opus 5 的负面信号",
  "现在该做什么",
  "更大的图",
]) {
  assert.match(
    contextEngineeringArticle,
    new RegExp(`<span class="section-title">${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}</span>`),
    `上下文工程文章章节标题缺失：${title}`,
  );
}

for (const asset of [
  "cover.png",
  "01-80pct-reduction.png",
  "02-six-transitions.png",
  "03-lock-in-effect.png",
  "04-context-vs-prompt.png",
]) {
  assert.ok(
    existsSync(path.join(distRoot, "assets", "articles", "claude-code-context-engineering", asset)),
    `上下文工程文章资源缺失：${asset}`,
  );
  assert.ok(
    contextEngineeringArticle.includes(
      `src="/assets/articles/claude-code-context-engineering/${asset}"`,
    ),
    `上下文工程文章未引用资源：${asset}`,
  );
  if (asset !== "cover.png") {
    assert.ok(
      contextEngineeringArticle.includes(
        `href="/assets/articles/claude-code-context-engineering/${asset}"`,
      ),
      `上下文工程正文图缺少原图入口：${asset}`,
    );
  }
}

console.log("构建产物校验通过：文章、速读摘要、讨论入口与公开资源均完整。");
