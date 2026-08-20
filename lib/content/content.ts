import 'server-only'; // prevent accidental client-side usage

import { SubjectNode, Article, Collection, ContentStatus, KnowledgePathItem, NodeKind } from './types';
import { getCanonicalUrl } from '../site';
import { loadAllFromDisk } from './tree';
import { articlePath, collectionPath } from './urls';
import { watch, type FSWatcher } from 'fs';
import { CONTENT_ROOT } from './files';

type ContentProjection = {
  tree: SubjectNode;
  articles: Article[];
  collections: Collection[];
};

type LoadedContent = ContentProjection & {
  published: ContentProjection;
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

type ContentEntry = { slug: string; status: ContentStatus };

function isDescendantOf(slug: string, ancestorSlug: string): boolean {
  return slug.startsWith(`${ancestorSlug}/`);
}

/**
 * A draft collection hides its entire subtree in production. This is deliberately
 * stricter than checking an entry's own status: a published child must not make a
 * work-in-progress collection reachable through a page, feed, or direct lookup.
 */
function isPublishedEntry(entry: ContentEntry, draftCollectionSlugs: readonly string[]): boolean {
  return (
    entry.status !== 'draft' &&
    !draftCollectionSlugs.some((draftSlug) => isDescendantOf(entry.slug, draftSlug))
  );
}

/**
 * A Collection with its embedded children filtered, recursively.
 *
 * Draft collection status cascades in the production projection. This mirrors the
 * tree and flat article filters, so a collection page cannot expose a descendant
 * whose URL was intentionally omitted from the static export.
 */
function publishedCollection(
  collection: Collection,
  draftCollectionSlugs: readonly string[]
): Collection {
  const articles = collection.articles.filter((article) =>
    isPublishedEntry(article, draftCollectionSlugs)
  );
  const collections = collection.collections
    .filter((child) => isPublishedEntry(child, draftCollectionSlugs))
    .map((child) => publishedCollection(child, draftCollectionSlugs));

  return {
    ...collection,
    articles,
    collections,
    totalArticles: articles.length,
    totalCollections: collections.length,
  };
}

/**
 * Filter a tree node to exclude draft content and every descendant of a draft
 * collection in production.
 *
 * This is intentionally fail-closed: a draft collection means its whole branch is
 * unfinished. Descendants must be published by publishing their ancestor too.
 */
function filterTreeNode(node: SubjectNode): SubjectNode | null {
  if (node.status === 'draft') return null;

  const hadChildren = (node.children?.length ?? 0) > 0;
  const survivors = (node.children ?? [])
    .map(filterTreeNode)
    .filter((child): child is SubjectNode => child !== null);

  // A structural folder that lost every child has nothing left to show.
  if (hadChildren && survivors.length === 0 && node.kind === NodeKind.Node) {
    return null;
  }

  const filtered: SubjectNode = hadChildren
    ? {
        ...node,
        children: survivors,
        articlesCount: survivors.filter((c) => c.kind === NodeKind.StandaloneArticle).length,
        collectionsCount: survivors.filter((c) => c.kind === NodeKind.CollectionArticle).length,
      }
    : { ...node };

  return filtered;
}

function emptySubjectTree(): SubjectNode {
  return {
    kind: NodeKind.Node,
    id: 'root',
    slug: '',
    title: 'Root',
    children: [],
    articlesCount: 0,
    collectionsCount: 0,
  };
}

function createPublishedProjection(content: ContentProjection): ContentProjection {
  const draftCollectionSlugs = content.collections
    .filter((collection) => collection.status === 'draft')
    .map((collection) => collection.slug);

  return {
    tree: filterTreeNode(content.tree) ?? emptySubjectTree(),
    articles: content.articles.filter((article) => isPublishedEntry(article, draftCollectionSlugs)),
    collections: content.collections
      .filter((collection) => isPublishedEntry(collection, draftCollectionSlugs))
      .map((collection) => publishedCollection(collection, draftCollectionSlugs)),
  };
}

function selectContent(loaded: LoadedContent): ContentProjection {
  return shouldIncludeDrafts() ? loaded : loaded.published;
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
      const content: ContentProjection = {
        tree: res.tree,
        articles: res.articles,
        collections: res.collections,
      };
      return { ...content, published: createPublishedProjection(content) };
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
  return selectContent(await ensureLoaded()).tree;
}

/**
 * @returns All articles reachable in the current environment
 */
export async function getAllArticles(): Promise<Article[]> {
  return selectContent(await ensureLoaded()).articles;
}

/**
 * @returns All collections reachable in the current environment
 */
export async function getCollections(): Promise<Collection[]> {
  return selectContent(await ensureLoaded()).collections;
}

/**
 * Retrieves an article by its slug.
 * @param slug The article slug
 * @returns The article if found, otherwise undefined
 */
export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const { articles } = selectContent(await ensureLoaded());
  return articles.find((a) => a.slug === slug);
}

/**
 * Retrieves a collection by its slug.
 * @param slug The collection slug
 * @returns The collection if found, otherwise undefined
 */
export async function getCollectionBySlug(slug: string): Promise<Collection | undefined> {
  const { collections } = selectContent(await ensureLoaded());
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
  const { tree } = selectContent(await ensureLoaded());
  const path = findNodePath(tree, slug);
  if (!path) return [];

  return path
    .filter((node) => node.slug)
    .map((node) => ({
      title: node.title,
      slug: node.slug,
    }));
}
