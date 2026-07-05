import { existsSync, readFileSync, readdirSync } from "node:fs";
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
  cover?: string;
  carousel?: string[];
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

export type ArticleTocItem = {
  depth: 2 | 3;
  id: string;
  text: string;
};

export type CarouselSlide = {
  path: string;
  title: string;
};

export type Article = {
  frontmatter: ArticleFrontmatter;
  body: string;
  html: string;
  readingMinutes: number;
  sourcePath: string;
  toc: ArticleTocItem[];
  carouselSlides: CarouselSlide[];
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
  const toc = extractToc(body);
  const carouselSlides = loadCarouselSlides(frontmatter.slug, frontmatter.carousel);
  const parsedHtml = marked.parse(body, { async: false }) as string;
  const html = enhanceTables(rewriteAssetPaths(addHeadingIds(parsedHtml, toc)));
  const words = body.replace(/```[\s\S]*?```/g, "").length;

  return {
    frontmatter,
    body,
    html,
    readingMinutes: Math.max(1, Math.ceil(words / 550)),
    sourcePath: path,
    toc,
    carouselSlides,
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
    cover: typeof data.cover === "string" ? data.cover : undefined,
    carousel: Array.isArray(data.carousel) ? data.carousel : [],
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

function loadCarouselSlides(slug: string, carouselPaths: string[] = []): CarouselSlide[] {
  const manifestPath = resolve(repoRoot, "content/assets/articles", slug, "carousel-manifest.json");

  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as { slides?: CarouselSlide[] };
    if (Array.isArray(manifest.slides) && manifest.slides.length > 0) {
      return manifest.slides;
    }
  }

  return carouselPaths.map((path, index) => ({
    path,
    title: `Slide ${index + 1}`,
  }));
}

export function assetHref(path?: string): string | undefined {
  if (!path) return undefined;

  const normalized = path.replace(/^\.\.\//, "");
  return `/${normalized}`.replace(/\/{2,}/g, "/");
}

function rewriteAssetPaths(html: string): string {
  const assetBase = "/assets/";

  return html.replace(/src="\.\.\/assets\//g, `src="${assetBase}`);
}

function extractToc(body: string): ArticleTocItem[] {
  const counts = new Map<string, number>();
  const bodyWithoutCode = body.replace(/```[\s\S]*?```/g, "");

  return Array.from(bodyWithoutCode.matchAll(/^(#{2,3})\s+(.+)$/gm)).map((match, index) => {
    const depth = match[1].length as 2 | 3;
    const text = stripMarkdown(match[2]).trim();
    const baseId = slugifyHeading(text) || `section-${index + 1}`;
    const count = counts.get(baseId) ?? 0;
    counts.set(baseId, count + 1);

    return {
      depth,
      id: count === 0 ? baseId : `${baseId}-${count + 1}`,
      text,
    };
  });
}

function addHeadingIds(html: string, toc: ArticleTocItem[]): string {
  let index = 0;

  return html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (heading, depth) => {
    const item = toc[index];
    index += 1;

    if (!item || item.depth !== Number(depth)) return heading;

    return heading.replace(`<h${depth}>`, `<h${depth} id="${item.id}">`);
  });
}

function stripMarkdown(value: string): string {
  return stripHtml(value)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~>#]/g, "")
    .replace(/\s+/g, " ");
}

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

function enhanceTables(html: string): string {
  return html.replace(/<table>[\s\S]*?<\/table>/g, (table) => {
    const headerMatch = table.match(/<thead>\s*<tr>([\s\S]*?)<\/tr>\s*<\/thead>/);
    const bodyMatch = table.match(/<tbody>([\s\S]*?)<\/tbody>/);
    if (!headerMatch || !bodyMatch) return table;

    const headers = Array.from(headerMatch[1].matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)).map((match) =>
      match[1].trim(),
    );

    if (!headers.length) return table;

    const rows = Array.from(bodyMatch[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g))
      .map((rowMatch) =>
        Array.from(rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)).map((cellMatch) => cellMatch[1].trim()),
      )
      .filter((cells) => cells.some((cell) => stripHtml(cell).trim() !== ""));

    if (!rows.length) return table;

    const columnWidths = getColumnWidths(headers.length);
    const colgroup = columnWidths.map((width) => `<col style="width:${width}%;">`).join("");
    const tableStyle =
      "width:100%;table-layout:fixed;border-collapse:collapse;margin:18px 0;color:#27231f;font-size:14px;line-height:1.65;";
    const headerStyle =
      "padding:8px 6px;border:1px solid #ddd7cf;background:#f0eeeb;color:#1f1c18;font-weight:700;text-align:center;vertical-align:middle;white-space:normal;word-break:break-all;overflow-wrap:anywhere;";
    const cellStyle =
      "padding:8px 6px;border:1px solid #ddd7cf;text-align:center;vertical-align:middle;white-space:normal;word-break:break-all;overflow-wrap:anywhere;";

    const headerHtml = headers
      .map((header, index) => `<th style="width:${columnWidths[index]}%;${headerStyle}">${header}</th>`)
      .join("");

    const bodyHtml = rows
      .map((cells) => {
        const cellHtml = headers
          .map(
            (_, index) =>
              `<td data-label="${escapeHtml(stripHtml(headers[index] ?? ""))}" style="width:${columnWidths[index]}%;${cellStyle}">${cells[index] ?? ""}</td>`,
          )
          .join("");

        return `<tr>${cellHtml}</tr>`;
      })
      .join("");

    return `<table style="${tableStyle}"><colgroup>${colgroup}</colgroup><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`;
  });
}

function getColumnWidths(columnCount: number): number[] {
  if (columnCount === 2) return [34, 66];
  if (columnCount === 3) return [18, 37, 45];
  if (columnCount === 4) return [18, 22, 16, 44];

  return Array.from({ length: columnCount }, () => Math.floor(100 / columnCount));
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
