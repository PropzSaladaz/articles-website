import fs from "fs";
import path from "path";
import { extractHeadings, markdownToHtml } from "../markdown";
import { markdownToPlainText } from "../summaries";
import { isFile, loadMarkdown } from "./files";
import { parseArticleFrontmatter, parseCollectionFrontmatter } from "./frontmatter";
import { Article, Collection } from "./types";
import { titleFromFolder } from "./utilities";
import readingTime from "reading-time";

type BuildArticleParams = {
  folderAbs: string;
  slugPieces: string[];
  parentCollectionSlug?: string | null;
};

type BuildCollectionParams = {
  folderAbs: string;
  slugPieces: string[];
  childArticles: Article[];
  childCollections: Collection[];
};

/**
 * Extract the first meaningful paragraph from markdown content for use as summary.
 * Skips headings, empty lines, and frontmatter-like content.
 */
function extractFirstParagraph(markdown: string): string {
  const lines = markdown.split('\n');
  let paragraph = '';

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, headings, horizontal rules, and code blocks
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('---') || trimmed.startsWith('```')) {
      // If we already have content and hit a break, stop
      if (paragraph.length > 0) break;
      continue;
    }
    // Skip images and iframes
    if (trimmed.startsWith('![') || trimmed.startsWith('<iframe')) continue;

    paragraph += (paragraph ? ' ' : '') + trimmed;

    // If paragraph is long enough, stop
    if (paragraph.length > 200) break;
  }

  // Truncate to ~200 chars at word boundary
  if (paragraph.length > 200) {
    const truncated = paragraph.substring(0, 200);
    const lastSpace = truncated.lastIndexOf(' ');
    return (lastSpace > 100 ? truncated.substring(0, lastSpace) : truncated) + '...';
  }

  return paragraph;
}

/** Short one-liner for cards: from frontmatter `summary`, or first paragraph. */
function descriptionSource(summary: string | null, fallbackMarkdown: string): string {
  if (summary) return summary;
  return extractFirstParagraph(fallbackMarkdown);
}

/** Rich article summary for the Summary view: from summary.md, or first paragraph. */
function summarySource(folderAbs: string, fallbackMarkdown: string): string {
  const summaryPath = path.join(folderAbs, 'summary.md');
  if (isFile(summaryPath)) {
    const { content } = loadMarkdown(summaryPath);
    if (content.trim().length > 0) return content;
  }
  return extractFirstParagraph(fallbackMarkdown);
}

export async function buildArticleFromFolder({
  folderAbs,
  slugPieces,
  parentCollectionSlug = null,
}: BuildArticleParams): Promise<Article> {
  const indexPath = path.join(folderAbs, 'index.md');
  if (!isFile(indexPath)) {
    throw new Error(`Article missing index.md at ${folderAbs}`);
  }

  const { data, content } = loadMarkdown(indexPath);
  const frontmatter = parseArticleFrontmatter(data, indexPath);
  const title = titleFromFolder(path.basename(folderAbs));
  const slug = slugPieces.join('/');

  // Short description for cards (from frontmatter summary or first paragraph)
  const descriptionRaw = descriptionSource(frontmatter.summary, content);

  // Rich summary for article summary view (from summary.md or first paragraph)
  const summaryRaw = summarySource(folderAbs, content);

  // Drafts may omit a date while being authored. Published and archived articles
  // are rejected by parseArticleFrontmatter before reaching this fallback.
  const publishedAt = frontmatter.date ?? fs.statSync(indexPath).mtime.toISOString();

  const html = await markdownToHtml(content, { slug, parentCollectionSlug });
  const headings = extractHeadings(content);

  const summaryHtml = await markdownToHtml(summaryRaw);
  const summaryText = await markdownToPlainText(summaryRaw);

  const rt = readingTime(content);

  return {
    slug,
    title,
    status: frontmatter.status,
    date: publishedAt,
    featured: frontmatter.featured,
    description: descriptionRaw,
    summary: { text: summaryText, html: summaryHtml },
    cover: frontmatter.cover,
    html,
    headings,
    readingTime: { text: rt.text, minutes: rt.minutes, words: rt.words },
    collectionSlug: parentCollectionSlug,
    folderAbs: process.env.NODE_ENV === 'development' ? folderAbs : undefined,
  };
}

export async function buildCollectionFromFolder({
  folderAbs,
  slugPieces,
  childArticles,
  childCollections,
}: BuildCollectionParams): Promise<Collection> {
  const indexPath = path.join(folderAbs, 'index.md');
  if (!isFile(indexPath)) {
    throw new Error(`Collection missing index.md at ${folderAbs}`);
  }

  const { data, content } = loadMarkdown(indexPath);
  const frontmatter = parseCollectionFrontmatter(data, indexPath);
  const title = titleFromFolder(path.basename(folderAbs));
  const slug = slugPieces.join('/');

  const summaryRaw = descriptionSource(frontmatter.summary, content);
  const summaryHtml = await markdownToHtml(summaryRaw, { slug, isCollection: true });
  const summaryText = await markdownToPlainText(summaryRaw);
  const html = await markdownToHtml(content, { slug, isCollection: true });

  return {
    slug,
    title,
    status: frontmatter.status,
    cover: frontmatter.cover,
    summary: { text: summaryText, html: summaryHtml },
    html,
    articles: childArticles,
    collections: childCollections,
    totalArticles: childArticles.length,
    totalCollections: childCollections.length,
    folderAbs: process.env.NODE_ENV === 'development' ? folderAbs : undefined,
  };
}
