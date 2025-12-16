import fs from "fs";
import path from "path";
import { extractHeadings, markdownToHtml } from "../md";
import { markdownToPlainText } from "../summaries";
import { deriveCover, isFile, loadMarkdown } from "./files";
import { Article, Collection } from "./types";
import { parseStatus, titleFromFolder } from "./utilities";
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

function parseOptionalDate(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

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

function summarySource(folderAbs: string, front: any, fallbackMarkdown: string) {
  const summaryPath = path.join(folderAbs, 'summary.md');
  if (isFile(summaryPath)) {
    const { content } = loadMarkdown(summaryPath);
    if (content.trim().length > 0) return content;
  }

  const viaFront = typeof front.summary === 'string' ? front.summary.trim() : '';
  if (viaFront.length > 0) return viaFront;

  // Extract just the first paragraph as fallback, not the full content
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

  const { data: front, content } = loadMarkdown(indexPath);
  const status = parseStatus(front.status, indexPath);
  const title = titleFromFolder(path.basename(folderAbs));
  const slug = slugPieces.join('/');
  const summaryRaw = summarySource(folderAbs, front, content);

  const cover = deriveCover(front, folderAbs);
  const fileStats = fs.statSync(indexPath);
  const publishedAt = parseOptionalDate(front.date) ?? fileStats.mtime.toISOString();

  const html = await markdownToHtml(content, { slug, parentCollectionSlug });
  const headings = extractHeadings(content);

  const summaryHtml = await markdownToHtml(summaryRaw);
  const summaryText = await markdownToPlainText(summaryRaw);

  const rt = readingTime(content);

  return {
    slug,
    title,
    status,
    date: publishedAt,
    summary: { text: summaryText, html: summaryHtml },
    cover,
    content,
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

  const { data: front, content } = loadMarkdown(indexPath);
  const status = parseStatus(front.status, indexPath);
  const title = titleFromFolder(path.basename(folderAbs));
  const slug = slugPieces.join('/');

  const cover = deriveCover(front, folderAbs);
  const summaryRaw = summarySource(folderAbs, front, content);
  const summaryHtml = await markdownToHtml(summaryRaw, { slug, isCollection: true });
  const summaryText = await markdownToPlainText(summaryRaw);

  return {
    slug,
    title,
    status,
    cover,
    summary: { text: summaryText, html: summaryHtml },
    articles: childArticles,
    collections: childCollections,
    totalArticles: childArticles.length,
    totalCollections: childCollections.length,
    folderAbs: process.env.NODE_ENV === 'development' ? folderAbs : undefined,
  };
}
