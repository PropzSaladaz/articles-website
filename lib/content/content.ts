import path from 'path';
import { SubjectNode, Article, Collection, StandaloneArticle, NodeKind, CollectionArticle } from './types';
import { extractHeadings, markdownToHtml } from '../md';
import { markdownToPlainText } from '../summaries';
import readingTime from 'reading-time';
import { getCanonicalUrl, getSiteUrl } from '../site';
import { 
  slugify, 
  numericPrefixOrNull, 
  pathToId, 
  ensureBasics 
} from './utilities';

let cachePromise: Promise<{
  tree: SubjectNode;
  articles: Article[];
  collections: Collection[];
}> | null = null;


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
      articleSlug: article.slug,
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
      collectionSlug: collection.slug,
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
