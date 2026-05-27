import { readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { marked } from "marked";

const repoRoot = resolve(process.cwd(), "..");
const articlesDir = resolve(repoRoot, "content/articles");

export type ArticleFrontmatter = {
  title: string;
  slug: string;
  date: string;
  status: "draft" | "ready" | "published" | "archived";
  summary: string;
  tags: string[];
  discussion?: {
    issue?: number;
    url?: string;
  };
  formats?: {
    html?: string;
    slides?: string;
    video?: string;
  };
};

export type Article = {
  frontmatter: ArticleFrontmatter;
  body: string;
  html: string;
  readingMinutes: number;
  sourcePath: string;
};

export function getArticles(): Article[] {
  return readdirSync(articlesDir)
    .filter((file) => file.endsWith(".md") && file !== ".gitkeep")
    .map((file) => readArticle(join(articlesDir, file)))
    .filter((article) => article.frontmatter.status !== "draft" && article.frontmatter.status !== "archived")
    .sort((a, b) => b.frontmatter.date.localeCompare(a.frontmatter.date));
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getArticles().find((article) => article.frontmatter.slug === slug);
}

export function getTags(): string[] {
  return Array.from(new Set(getArticles().flatMap((article) => article.frontmatter.tags))).sort();
}

function readArticle(path: string): Article {
  const raw = readFileSync(path, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

  if (!match) {
    throw new Error(`Missing frontmatter in ${path}`);
  }

  const frontmatter = parseFrontmatter(match[1], basename(path, ".md"));
  const body = stripDuplicateTitle(match[2].trim(), frontmatter.title);
  const html = enhanceTables(rewriteAssetPaths(marked.parse(body, { async: false }) as string));
  const words = body.replace(/```[\s\S]*?```/g, "").length;

  return {
    frontmatter,
    body,
    html,
    readingMinutes: Math.max(1, Math.ceil(words / 550)),
    sourcePath: path,
  };
}

function parseFrontmatter(source: string, fallbackSlug: string): ArticleFrontmatter {
  const lines = source.split("\n");
  const data: Record<string, any> = {};
  const stack: Array<{ indent: number; value: Record<string, any> }> = [{ indent: -1, value: data }];

  for (const line of lines) {
    if (!line.trim()) continue;

    const indent = line.match(/^ */)?.[0].length ?? 0;
    const trimmed = line.trim();
    const separator = trimmed.indexOf(":");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator);
    const rawValue = trimmed.slice(separator + 1).trim();

    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1].value;

    if (!rawValue) {
      parent[key] = {};
      stack.push({ indent, value: parent[key] });
    } else {
      parent[key] = parseValue(rawValue);
    }
  }

  return {
    title: data.title ?? fallbackSlug,
    slug: data.slug ?? fallbackSlug.replace(/^\d{4}-\d{2}-\d{2}-/, ""),
    date: String(data.date ?? ""),
    status: data.status ?? "draft",
    summary: data.summary ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    discussion: data.discussion ?? {},
    formats: data.formats ?? {},
  };
}

function parseValue(value: string): string | number | string[] {
  if (/^\d+$/.test(value)) return Number(value);

  if (value.startsWith("[") && value.endsWith("]")) {
    return value
      .slice(1, -1)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return value.replace(/^["']|["']$/g, "");
}

function stripDuplicateTitle(body: string, title: string): string {
  const normalizedTitle = title.trim();
  const lines = body.split("\n");
  const firstMeaningfulIndex = lines.findIndex((line) => line.trim() !== "");

  if (firstMeaningfulIndex === -1) return body;

  const firstLine = lines[firstMeaningfulIndex].trim();
  if (firstLine === `# ${normalizedTitle}`) {
    lines.splice(firstMeaningfulIndex, 1);
    return lines.join("\n").trim();
  }

  return body;
}

function rewriteAssetPaths(html: string): string {
  const base = process.env.GITHUB_PAGES === "true" ? "/mind-os-public" : "";
  const assetBase = `${base}/assets/`.replace(/^\/\//, "/");

  return html.replace(/src="\.\.\/assets\//g, `src="${assetBase}`);
}

function enhanceTables(html: string): string {
  return html.replace(/<table>[\s\S]*?<\/table>/g, (table) => {
    const headerMatch = table.match(/<thead>\s*<tr>([\s\S]*?)<\/tr>\s*<\/thead>/);
    const bodyMatch = table.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!headerMatch) return table;

    const headers = Array.from(headerMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)).map((match) =>
      escapeHtml(stripHtml(match[1]).trim()),
    );

    if (!headers.length || !bodyMatch) return table;

    const rows = Array.from(bodyMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g))
      .map((rowMatch) =>
        Array.from(rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)).map((cellMatch) => cellMatch[1].trim()),
      )
      .filter((cells) => cells.some((cell) => stripHtml(cell).trim() !== ""));

    if (!rows.length) return table;

    const cards = rows
      .map((cells) => {
        const items = cells
          .map((cell, index) => {
            if (stripHtml(cell).trim() === "") return "";

            const label = headers[index] ?? `第 ${index + 1} 列`;
            return [
              '<div class="article-data-item" style="padding:10px 0;border-bottom:1px dashed rgba(31,29,26,.1);">',
              `<div class="article-data-label" style="margin-bottom:4px;color:#65452f;font-size:12px;font-weight:700;">${label}</div>`,
              `<div class="article-data-value" style="color:#3f3a34;line-height:1.75;word-break:break-word;overflow-wrap:anywhere;">${cell}</div>`,
              "</div>",
            ].join("");
          })
          .join("");

        return `<section class="article-data-card" style="margin:14px 0;padding:12px 14px;border:1px solid #dfd3bf;border-radius:8px;background:rgba(255,253,250,.74);">${items}</section>`;
      })
      .join("");

    return `<div class="article-data-list">${cards}</div>`;
  });
}

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
