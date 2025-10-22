import { SubjectNode, Article, Collection } from './types';
import { getCanonicalUrl } from '../site';
import { loadAllFromDisk } from './tree';
import { generateRss, generateSitemap, persistCaches } from './cache';

// Global cache holding loaded content
let cachePromise: Promise<{
  tree: SubjectNode;
  articles: Article[];
  collections: Collection[];
}> | null = null;

/**
 * Try loading content from disk if not already loaded. If not loaded, parse
 * all articles & generate sitemap + RSS feed.
 * @returns A promise that ensures content is loaded and cached
 */
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

/**
 * @returns The root tree node
 */
export async function getSubjectTree(): Promise<SubjectNode> {
  const { tree } = await ensureLoaded();
  return tree;
}

/**
 * @returns All articles
 */
export async function getAllArticles(): Promise<Article[]> {
  const { articles } = await ensureLoaded();
  return articles;
}

/**
 * @returns All collections
 */
export async function getCollections(): Promise<Collection[]> {
  const { collections } = await ensureLoaded();
  return collections;
}

/**
 * Retrieves an article by its slug.
 * @param slug The article slug
 * @returns The article if found, otherwise undefined
 */
export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const { articles } = await ensureLoaded();
  return articles.find((a) => a.slug === slug);
}

/**
 * Retrieves a collection by its slug.
 * @param slug The collection slug
 * @returns The collection if found, otherwise undefined
 */
export async function getCollectionBySlug(slug: string): Promise<Collection | undefined> {
  const { collections } = await ensureLoaded();
  return collections.find((c) => c.slug === slug);
}

/**
 * Retrieves all unique tags used across all articles.
 * @returns A sorted array of unique tags
 */
export async function getAllTags(): Promise<string[]> {
  const arts = await getAllArticles();
  const set = new Set<string>();
  for (const a of arts) for (const t of a.tags) set.add(t);
  return Array.from(set).sort();
}

/**
 * Constructs the canonical URL for a given article slug.
 * @param slug The article slug
 * @returns The canonical URL as a string
 */
export function getArticleCanonicalUrl(article: Article) {
  if (article.collectionSlug) {
    return getCanonicalUrl(`/collections/${article.slug}/`);
  }
  return getCanonicalUrl(`/articles/${article.slug}/`);
}

export function getCollectionCanonicalUrl(slug: string) {
  return getCanonicalUrl(`/collections/${slug}/`);
}
