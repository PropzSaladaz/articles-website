import 'server-only'; // prevent accidental client-side usage

import { SubjectNode, Article, Collection, KnowledgePathItem, NodeKind } from './types';
import { getCanonicalUrl } from '../site';
import { loadAllFromDisk } from './tree';
import { generateRss, generateSitemap } from './feeds';
import { articlePath, collectionPath } from './urls';
import { watch, type FSWatcher } from 'fs';
import { CONTENT_ROOT } from './files';

type LoadedContent = {
  tree: SubjectNode;
  articles: Article[];
  collections: Collection[];
};

type ContentCacheState = {
  promise: Promise<LoadedContent> | null;
  watcher: FSWatcher | null;
};

// Keep the watcher and cache across Next.js development module reloads. Without
// this, Fast Refresh can leave old watchers alive while creating new ones.
const globalForContentCache = globalThis as typeof globalThis & {
  __articlesContentCache?: ContentCacheState;
};

const contentCache: ContentCacheState = globalForContentCache.__articlesContentCache ?? {
  promise: null,
  watcher: null,
};

if (process.env.NODE_ENV === 'development') {
  globalForContentCache.__articlesContentCache = contentCache;
}

function ensureDevelopmentWatcher() {
  if (process.env.NODE_ENV !== 'development' || contentCache.watcher) return;

  try {
    contentCache.watcher = watch(CONTENT_ROOT, { recursive: true }, () => {
      contentCache.promise = null;
    });

    contentCache.watcher.on('error', (error) => {
      console.error('[content] Failed to watch content directory:', error);
      contentCache.watcher?.close();
      contentCache.watcher = null;
      contentCache.promise = null;
    });
  } catch (error) {
    console.error('[content] Failed to watch content directory:', error);
  }
}

/**
 * Check if we should include draft content.
 * In development mode, show drafts. In production, hide them.
 */
function shouldIncludeDrafts(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Filter a tree node to exclude draft content in production.
 * Returns null if the node itself or all its children are drafts.
 */
function filterTreeNode(node: SubjectNode): SubjectNode | null {
  const includeDrafts = shouldIncludeDrafts();

  // Check if this node is a draft article/collection
  if (node.status === 'draft' && !includeDrafts) {
    return null;
  }

  // If node has children, filter them recursively
  if (node.children && node.children.length > 0) {
    const filteredChildren = node.children
      .map(filterTreeNode)
      .filter((child): child is SubjectNode => child !== null);

    // If all children were filtered out and this is just a structural node, skip it
    if (filteredChildren.length === 0 && node.kind === NodeKind.Node) {
      return null;
    }

    return {
      ...node,
      children: filteredChildren,
      articlesCount: filteredChildren.filter(c => c.kind === NodeKind.StandaloneArticle).length,
      collectionsCount: filteredChildren.filter(c => c.kind === NodeKind.CollectionArticle).length,
    };
  }

  return node;
}

/**
 * Load and cache content from disk. Concurrent callers share the same promise.
 * In development the cache is invalidated when the content directory changes.
 * @returns A promise that ensures content is loaded and cached
 */
async function ensureLoaded() {
  const isDev = process.env.NODE_ENV === 'development';
  ensureDevelopmentWatcher();

  if (!contentCache.promise) {
    contentCache.promise = (async () => {
      const res = await loadAllFromDisk();
      // Sort by date desc
      res.articles.sort((a, b) => (a.date > b.date ? -1 : 1));
      // Only generate feeds in production.
      // Drafts are excluded from the static export by getAllArticles/getCollections,
      // so they must be excluded here too — otherwise the sitemap and feed advertise
      // URLs that were never exported and 404.
      if (!isDev) {
        const publishedArticles = res.articles.filter((a) => a.status !== 'draft');
        const publishedCollections = res.collections.filter((c) => c.status !== 'draft');
        generateSitemap(publishedArticles, publishedCollections);
        generateRss(publishedArticles);
      }
      return res;
    })();
  }

  const currentPromise = contentCache.promise;
  try {
    return await currentPromise;
  } catch (error) {
    // A transient parse or filesystem error should not poison the cache forever.
    if (contentCache.promise === currentPromise) {
      contentCache.promise = null;
    }
    throw error;
  }
}

/**
 * @returns The root tree node (filtered for draft status in production)
 */
export async function getSubjectTree(): Promise<SubjectNode> {
  const { tree } = await ensureLoaded();
  const filteredTree = filterTreeNode(tree);
  // Return an empty root if everything was filtered
  return filteredTree || {
    kind: NodeKind.Node,
    id: 'root',
    slug: '',
    title: 'Root',
    children: [],
    articlesCount: 0,
    collectionsCount: 0,
  };
}

/**
 * @returns All articles (filtered for draft status in production)
 */
export async function getAllArticles(): Promise<Article[]> {
  const { articles } = await ensureLoaded();
  if (shouldIncludeDrafts()) {
    return articles;
  }
  return articles.filter(a => a.status !== 'draft');
}

/**
 * @returns All collections (filtered for draft status in production)
 */
export async function getCollections(): Promise<Collection[]> {
  const { collections } = await ensureLoaded();
  if (shouldIncludeDrafts()) {
    return collections;
  }
  return collections.filter(c => c.status !== 'draft');
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
 * Constructs the canonical URL for a given article slug.
 * @param slug The article slug
 * @returns The canonical URL as a string
 */
export function getArticleCanonicalUrl(article: Article) {
  return getCanonicalUrl(articlePath(article));
}

export function getCollectionCanonicalUrl(slug: string) {
  return getCanonicalUrl(collectionPath(slug));
}

function findNodePath(node: SubjectNode, targetSlug: string): SubjectNode[] | null {
  if (node.slug === targetSlug) {
    return [node];
  }

  if (!node.children) return null;

  for (const child of node.children) {
    const childPath = findNodePath(child, targetSlug);
    if (childPath) {
      return [node, ...childPath];
    }
  }

  return null;
}

export async function getKnowledgePathForSlug(slug: string): Promise<KnowledgePathItem[]> {
  const { tree } = await ensureLoaded();
  const path = findNodePath(tree, slug);
  if (!path) return [];

  return path
    .filter((node) => node.slug)
    .map((node) => ({
      title: node.title,
      slug: node.slug,
    }));
}
