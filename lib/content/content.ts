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
