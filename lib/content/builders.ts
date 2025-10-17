import path from "path";
import fs from "fs";
import { extractHeadings, markdownToHtml } from "../md";
import { markdownToPlainText } from "../summaries";
import { deriveCover, isDir, isFile, loadMarkdown, NAMESPACE_CHAPTER_SLUGS } from "./files";
import { Article, Collection } from "./types";
import { ensureBasics, numericPrefixOrNull } from "./utilities";
import readingTime from "reading-time";

async function buildArticleFromIndex(
  folderAbs: string,
  indexPath: string,
  summaryPath: string,
  collectionSlugForNamespace?: string
): Promise<Article> {
  const { data: front, content } = loadMarkdown(indexPath);
  ensureBasics(front, indexPath, { requireSlug: true });

  const baseSlug = String(front.slug).trim();
  const slug = collectionSlugForNamespace && NAMESPACE_CHAPTER_SLUGS
    ? `${collectionSlugForNamespace}/${baseSlug}`
    : baseSlug;

  const title = String(front.title).trim();
  const tags = Array.isArray(front.tags) ? front.tags.filter((t: any) => typeof t === 'string') : [];
  const dateIso = new Date(String(front.date)).toISOString();
  const cover = deriveCover(front, folderAbs);

  const html = await markdownToHtml(content);
  const headings = extractHeadings(content);

  const { data: summaryFront, content: summaryContent } = loadMarkdown(summaryPath);
  ensureBasics(summaryFront, summaryPath, { requireSlug: true });

  const summaryHtml = await markdownToHtml(summaryContent);
  const summaryText = await markdownToPlainText(summaryContent);

  const rt = readingTime(content);

  return {
    slug,
    title,
    date: dateIso,
    tags,
    summary: { text: summaryText, html: summaryHtml },
    cover,
    content,
    html,
    headings,
    readingTime: { text: rt.text, minutes: rt.minutes, words: rt.words },
  };
}

async function buildStandaloneFromFolder(folderAbs: string): Promise<Article> {
  const indexPath = path.join(folderAbs, 'index.md');
  const summaryPath = path.join(folderAbs, 'summary.md');
  if (!isFile(indexPath) || !isFile(summaryPath)) {
    throw new Error(`Standalone must contain index.md and summary.md at ${folderAbs}`);
  }
  return buildArticleFromIndex(folderAbs, indexPath, summaryPath);
}

type ChapterFolderInfo = {
  dirAbs: string;
  dirName: string;
  order: number | null; // from frontmatter or numeric prefix
};

function readChapterFolders(chaptersAbs: string): ChapterFolderInfo[] {
  if (!isDir(chaptersAbs)) return [];
  const entries = fs.readdirSync(chaptersAbs, { withFileTypes: true })
    .filter(d => d.isDirectory());

  const infos: ChapterFolderInfo[] = [];

  for (const d of entries) {
    const dirAbs = path.join(chaptersAbs, d.name);
    const indexPath = path.join(dirAbs, 'index.md');
    const summaryPath = path.join(dirAbs, 'summary.md');
    if (!isFile(indexPath) || !isFile(summaryPath)) {
      // Not a valid chapter folder; skip silently (or warn)
      // eslint-disable-next-line no-continue
      continue;
    }
    // Try frontmatter order first
    let ord: number | null = null;
    try {
      const { data } = loadMarkdown(indexPath);
      if (typeof data.order === 'number' && Number.isFinite(data.order)) {
        ord = data.order;
      }
    } catch {
      // ignore
    }
    // Fallback: numeric prefix of folder name
    if (ord === null) ord = numericPrefixOrNull(d.name);

    infos.push({ dirAbs, dirName: d.name, order: ord });
  }

  // Sort: order asc if available, else by folder name naturally
  infos.sort((a, b) => {
    if (a.order !== null && b.order !== null) return a.order - b.order;
    if (a.order !== null) return -1;
    if (b.order !== null) return 1;
    return a.dirName.localeCompare(b.dirName, undefined, { numeric: true });
  });

  return infos;
}

async function buildCollectionFromFolder(folderAbs: string): Promise<Collection> {
  const indexPath = path.join(folderAbs, 'index.md');
  if (!isFile(indexPath)) throw new Error(`Collection missing index.md at ${folderAbs}`);

  const { data: front, content: intro } = loadMarkdown(indexPath);
  ensureBasics(front, indexPath, { requireSlug: true });

  const collectionSlug = String(front.slug).trim();
  const title = String(front.title).trim();
  const cover = deriveCover(front, folderAbs);

  const summarySource =
    typeof front.summary === 'string' && front.summary.trim().length > 0
      ? String(front.summary)
      : intro;
  const summaryHtml = await markdownToHtml(summarySource);
  const summaryText = await markdownToPlainText(summarySource);

  const chaptersAbs = path.join(folderAbs, 'chapters');
  const chapterFolders = readChapterFolders(chaptersAbs);

  const articles: Article[] = [];
  for (const ch of chapterFolders) {
    const indexPath = path.join(ch.dirAbs, 'index.md');
    const summaryPath = path.join(ch.dirAbs, 'summary.md');
    const article = await buildArticleFromIndex(ch.dirAbs, indexPath, summaryPath, collectionSlug);
    articles.push(article);
  }

  return {
    slug: collectionSlug,
    title,
    cover,
    summary: { text: summaryText, html: summaryHtml },
    articles,
    totalArticles: articles.length,
  };
}