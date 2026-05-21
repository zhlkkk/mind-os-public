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
  const html = rewriteAssetPaths(marked.parse(body, { async: false }) as string);
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
