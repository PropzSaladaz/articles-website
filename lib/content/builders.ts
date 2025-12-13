import fs from "fs";
import path from "path";
import { extractHeadings, markdownToHtml } from "../md";
import { markdownToPlainText } from "../summaries";
import { deriveCover, isFile, loadMarkdown } from "./files";
import { Article, Collection } from "./types";
import { extractTags, parseStatus, titleFromFolder } from "./utilities";
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

function summarySource(folderAbs: string, front: any, fallbackMarkdown: string) {
  const summaryPath = path.join(folderAbs, 'summary.md');
  if (isFile(summaryPath)) {
    const { content } = loadMarkdown(summaryPath);
    if (content.trim().length > 0) return content;
  }

  const viaFront = typeof front.summary === 'string' ? front.summary.trim() : '';
  if (viaFront.length > 0) return viaFront;

  return fallbackMarkdown;
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

  const tags = extractTags(front.tags);
  const cover = deriveCover(front, folderAbs);
  const fileStats = fs.statSync(indexPath);
  const publishedAt = parseOptionalDate(front.date) ?? fileStats.mtime.toISOString();

  const html = await markdownToHtml(content, { slug });
  const headings = extractHeadings(content);

  const summaryHtml = await markdownToHtml(summaryRaw);
  const summaryText = await markdownToPlainText(summaryRaw);

  const rt = readingTime(content);

  return {
    slug,
    title,
    status,
    date: publishedAt,
    tags,
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
  const summaryHtml = await markdownToHtml(summaryRaw, { slug });
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
