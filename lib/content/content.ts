import 'server-only'; // prevent accidental client-side usage

import { SubjectNode, Article, Collection, KnowledgePathItem } from './types';
import { getCanonicalUrl } from '../site';
import { loadAllFromDisk } from './tree';
import { articlePath, collectionPath } from './urls';
import { watch, type FSWatcher } from 'fs';
import { CONTENT_ROOT } from './files';
import { createPublicSnapshot, type ContentSnapshot } from './visibility';

type LoadedContent = {
  all: ContentSnapshot;
  public: ContentSnapshot;
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

function contentForCurrentEnvironment(loaded: LoadedContent): ContentSnapshot {
  return shouldIncludeDrafts() ? loaded.all : loaded.public;
}

/**
 * Load and cache content from disk. Concurrent callers share the same promise.
 * In development the cache is invalidated when the content directory changes.
 * @returns A promise that ensures content is loaded and cached
 */
async function ensureLoaded() {
  ensureDevelopmentWatcher();

  if (!contentCache.promise) {
    contentCache.promise = (async () => {
      const res = await loadAllFromDisk();
      // Sort by date desc
      res.articles.sort((a, b) => (a.date > b.date ? -1 : 1));
      const all: ContentSnapshot = {
        tree: res.tree,
        articles: res.articles,
        collections: res.collections,
      };
      return { all, public: createPublicSnapshot(all) };
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
 * @returns The root tree node (with cascading draft visibility in production)
 */
export async function getSubjectTree(): Promise<SubjectNode> {
  return contentForCurrentEnvironment(await ensureLoaded()).tree;
}

/**
 * @returns All articles reachable in the current environment
 */
export async function getAllArticles(): Promise<Article[]> {
  return contentForCurrentEnvironment(await ensureLoaded()).articles;
}

/**
 * @returns All collections reachable in the current environment
 */
export async function getCollections(): Promise<Collection[]> {
  return contentForCurrentEnvironment(await ensureLoaded()).collections;
}

/**
 * Retrieves an article by its slug.
 * @param slug The article slug
 * @returns The article if found, otherwise undefined
 */
export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const { articles } = contentForCurrentEnvironment(await ensureLoaded());
  return articles.find((a) => a.slug === slug);
}

/**
 * Retrieves a collection by its slug.
 * @param slug The collection slug
 * @returns The collection if found, otherwise undefined
 */
export async function getCollectionBySlug(slug: string): Promise<Collection | undefined> {
  const { collections } = contentForCurrentEnvironment(await ensureLoaded());
  return collections.find((collection) => collection.slug === slug);
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
  const { tree } = contentForCurrentEnvironment(await ensureLoaded());
  const path = findNodePath(tree, slug);
  if (!path) return [];

  return path
    .filter((node) => node.slug)
    .map((node) => ({
      title: node.title,
      slug: node.slug,
    }));
}
