import 'server-only'; // prevent accidental client-side usage

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { SubjectNode, Article, Collection, StandaloneArticle, NodeKind, CollectionArticle } from './types';
import { extractHeadings, markdownToHtml } from '../md';
import { markdownToPlainText } from '../summaries';
import readingTime from 'reading-time';
import { getCanonicalUrl, getSiteUrl } from '../site';

// =====================
// Config & utilities
// =====================

const CONTENT_ROOT = path.join(process.cwd(), 'content');
const NAMESPACE_CHAPTER_SLUGS = true; // set false to keep chapter slugs un-namespaced

let cachePromise: Promise<{
  tree: SubjectNode;
  articles: Article[];
  collections: Collection[];
}> | null = null;

function isDir(p: string) { try { return fs.statSync(p).isDirectory(); } catch { return false; } }
function isFile(p: string) { try { return fs.statSync(p).isFile(); } catch { return false; } }

function slugify(s: string) {
  return s
    .trim()
    .replace(/^[0-9]+-/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function numericPrefixOrNull(name: string): number | null {
  const m = name.match(/^([0-9]+)/);
  return m ? parseInt(m[1], 10) : null;
}

function pathToId(slug: string) {
  return Buffer.from(slug || '/').toString('base64url').slice(0, 16);
}

function loadMarkdown(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  return { data, content, raw };
}

function ensureBasics(
  data: Record<string, unknown>,
  filePath: string,
  { requireSlug = true }: { requireSlug?: boolean } = {}
) {
  const titleOk = typeof data.title === 'string' && data.title.trim().length > 0;
  if (!titleOk) throw new Error(`Invalid frontmatter in ${filePath}: "title" must be non-empty.`);

  const dateStr = String(data.date ?? '');
  const date = new Date(dateStr);
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(`Invalid frontmatter in ${filePath}: "date" must be a valid ISO date.`);
  }

  if (requireSlug) {
    const slugOk = typeof data.slug === 'string' && data.slug.trim().length > 0;
    if (!slugOk) throw new Error(`Invalid frontmatter in ${filePath}: "slug" must be non-empty.`);
  }
}

function deriveCover(front: any, folderAbs: string): string | null {
  const key = front.coverImage ?? front.cover ?? null;
  if (typeof key !== 'string') return null;
  const rel = key.trim();
  const abs = path.resolve(folderAbs, rel);
  if (isFile(abs)) return rel;
  return rel; // keep as-is for client resolution
}



// =====================
// Builders
// =====================

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

  const summarySrc = fs.readFileSync(summaryPath, 'utf8');
  const summaryHtml = await markdownToHtml(summarySrc);
  const summaryText = await markdownToPlainText(summarySrc);

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

// =====================
// Detection & walking
// =====================

type WalkResult = {
  tree: SubjectNode;
  articles: Article[];
  collections: Collection[];
};

function detectKind(dirAbs: string): 'standalone' | 'collection' | 'node' {
  const hasIndex = isFile(path.join(dirAbs, 'index.md'));
  const hasStandaloneSummary = isFile(path.join(dirAbs, 'summary.md'));
  const chaptersDir = path.join(dirAbs, 'chapters');

  const isCollection =
    hasIndex &&
    isDir(chaptersDir) &&
    fs.readdirSync(chaptersDir, { withFileTypes: true })
      .some(d => d.isDirectory() && isFile(path.join(chaptersDir, d.name, 'index.md')) && isFile(path.join(chaptersDir, d.name, 'summary.md')));

  if (isCollection) return 'collection';
  if (hasIndex && hasStandaloneSummary && !isDir(chaptersDir)) return 'standalone';
  return 'node';
}

async function walk(dirAbs: string, slugPieces: string[]): Promise<WalkResult> {
  const folderName = path.basename(dirAbs);
  const thisSlug = slugPieces.join('/');
  const title = folderName.replace(/-/g, ' ');
  const id = pathToId(thisSlug);

  const kind = detectKind(dirAbs);

  if (kind === 'standalone') {
    const article = await buildStandaloneFromFolder(dirAbs);
    const treeNode: StandaloneArticle = {
      kind: NodeKind.StandaloneArticle,
      id,
      slug: thisSlug || article.slug,
      title: article.title,
    };
    return { tree: treeNode, articles: [article], collections: [] };
  }

  if (kind === 'collection') {
    const collection = await buildCollectionFromFolder(dirAbs);
    const treeNode: CollectionArticle = {
      kind: NodeKind.CollectionArticle,
      id,
      slug: thisSlug || collection.slug,
      title: collection.title,
      articlesCount: collection.totalArticles,
    };
    return { tree: treeNode, articles: [...collection.articles], collections: [collection] };
  }

  // Subject node: recurse
  const children: SubjectNode[] = [];
  let arts: Article[] = [];
  let cols: Collection[] = [];

  const dirents = fs.readdirSync(dirAbs, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const d of dirents) {
    const childAbs = path.join(dirAbs, d.name);
    const childSlugPieces = [...slugPieces, slugify(d.name)];
    const { tree, articles, collections } = await walk(childAbs, childSlugPieces);
    children.push(tree);
    arts = arts.concat(articles);
    cols = cols.concat(collections);
  }

  const treeNode: SubjectNode = {
    kind: NodeKind.Node,
    id,
    slug: thisSlug,
    title,
    children,
  };

  return { tree: treeNode, articles: arts, collections: cols };
}

async function loadAllFromDisk(): Promise<WalkResult> {
  if (!fs.existsSync(CONTENT_ROOT)) {
    throw new Error(`Content directory not found: ${CONTENT_ROOT}`);
  }
  return walk(CONTENT_ROOT, []);
}

// =====================
// Cache + feeds
// =====================

function persistCaches(payload: WalkResult) {
  const cacheDir = path.join(process.cwd(), '.cache');
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  fs.writeFileSync(path.join(cacheDir, 'content-tree.json'), JSON.stringify(payload.tree, null, 2));
  fs.writeFileSync(path.join(cacheDir, 'articles.json'), JSON.stringify(payload.articles, null, 2));
  fs.writeFileSync(path.join(cacheDir, 'collections.json'), JSON.stringify(payload.collections, null, 2));
}

function generateSitemap(articles: Article[], collections: Collection[]) {
  const siteUrl = getSiteUrl();
  const pages = new Set<string>();
  pages.add(`${siteUrl}/`);

  // Standalone vs chapter URLs:
  for (const a of articles) {
    if (NAMESPACE_CHAPTER_SLUGS && a.slug.includes('/')) {
      const [cSlug, chSlug] = a.slug.split('/');
      pages.add(`${siteUrl}/collections/${cSlug}/`);
      pages.add(`${siteUrl}/collections/${cSlug}/${chSlug}/`);
    } else {
      pages.add(`${siteUrl}/articles/${a.slug}/`);
    }
  }
  for (const c of collections) {
    pages.add(`${siteUrl}/collections/${c.slug}/`);
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    Array.from(pages)
      .sort()
      .map((url) => `<url><loc>${url}</loc></url>`)
      .join('') +
    '</urlset>';

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
}

function generateRss(articles: Article[]) {
  const siteUrl = getSiteUrl();

  const items = articles
    .map((a) => {
      const link =
        NAMESPACE_CHAPTER_SLUGS && a.slug.includes('/')
          ? `${siteUrl}/collections/${a.slug}/` // e.g., collections/rendering-pipeline/introduction/
          : `${siteUrl}/articles/${a.slug}/`;

      return `\n  <item>\n    <title><![CDATA[${a.title}]]></title>\n    <link>${link}</link>\n    <guid>${link}</guid>\n    <pubDate>${new Date(a.date).toUTCString()}</pubDate>\n    <description><![CDATA[${a.summary.text}]]></description>\n  </item>`;
    })
    .join('');

  const rss =
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>Articles</title>\n  <link>${siteUrl}/</link>\n  <description>Latest articles</description>${items}\n</channel>\n</rss>`;

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'rss.xml'), rss, 'utf8');
}

// =====================
// Public API
// =====================

async function ensureLoaded() {
  if (!cachePromise) {
    cachePromise = (async () => {
      const res = await loadAllFromDisk();
      // Sort by date desc
      res.articles.sort((a, b) => (a.date > b.date ? -1 : 1));
      persistCaches(res);
      generateSitemap(res.articles, res.collections);
      generateRss(res.articles);
      return res;
    })();
  }
  return cachePromise;
}

export async function getSubjectTree(): Promise<SubjectNode> {
  const { tree } = await ensureLoaded();
  return tree;
}

export async function getAllArticles(): Promise<Article[]> {
  const { articles } = await ensureLoaded();
  return articles;
}

export async function getCollections(): Promise<Collection[]> {
  const { collections } = await ensureLoaded();
  return collections;
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const { articles } = await ensureLoaded();
  return articles.find((a) => a.slug === slug);
}

export async function getCollectionBySlug(slug: string): Promise<Collection | undefined> {
  const { collections } = await ensureLoaded();
  return collections.find((c) => c.slug === slug);
}

export async function getAllTags(): Promise<string[]> {
  const arts = await getAllArticles();
  const set = new Set<string>();
  for (const a of arts) for (const t of a.tags) set.add(t);
  return Array.from(set).sort();
}

export function getArticleCanonicalUrl(slug: string) {
  if (NAMESPACE_CHAPTER_SLUGS && slug.includes('/')) {
    return getCanonicalUrl(`/collections/${slug}/`);
  }
  return getCanonicalUrl(`/articles/${slug}/`);
}

export function getCollectionCanonicalUrl(slug: string) {
  return getCanonicalUrl(`/collections/${slug}/`);
}