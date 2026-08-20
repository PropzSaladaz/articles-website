import 'server-only'; // prevent accidental client-side usage

import { SubjectNode, Article, Collection, ContentStatus, KnowledgePathItem, NodeKind } from './types';
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

/** Whether a single entry may be shown. The one draft predicate in the codebase. */
export function isVisible(entry: { status: ContentStatus }): boolean {
  return shouldIncludeDrafts() || entry.status !== 'draft';
}

function withoutDrafts<T extends { status: ContentStatus }>(entries: T[]): T[] {
  return shouldIncludeDrafts() ? entries : entries.filter((entry) => entry.status !== 'draft');
}

/**
 * A Collection with its embedded children filtered, recursively.
 *
 * `loadAllFromDisk` populates `articles`/`collections` straight from the walk, so a
 * published collection carries its draft chapters around with it. Filtering only the
 * flat `getCollections()` result left those in place, and `CollectionView` rendered
 * links to pages that were never exported — an observable 404 from a published page.
 * Every accessor below returns collections through here so no call site has to
 * remember the rule. Counts are recomputed so headers agree with what is listed.
 */
function visibleCollection(collection: Collection): Collection {
  const articles = withoutDrafts(collection.articles);
  const collections = withoutDrafts(collection.collections).map(visibleCollection);

  return {
    ...collection,
    articles,
    collections,
    totalArticles: articles.length,
    totalCollections: collections.length,
  };
}

/**
 * Filter a tree node to exclude draft content in production.
 *
 * Status does not cascade (see the note in feeds.ts): each folder's own frontmatter
 * decides it, so a published chapter under a draft collection is still exported. This
 * used to return null for a draft node *before* recursing, which took those published
 * descendants down with it — they were built, but vanished from the navigation and
 * their "Back to ..." link pointed at a page that never existed.
 *
 * So recurse first, and drop only what genuinely has nothing left to show. A draft
 * collection with surviving descendants keeps its place in the hierarchy with
 * `hasPage: false`, which renders as a non-linking branch.
 */
function filterTreeNode(node: SubjectNode): SubjectNode | null {
  if (shouldIncludeDrafts()) return node;

  const hadChildren = (node.children?.length ?? 0) > 0;
  const survivors = (node.children ?? [])
    .map(filterTreeNode)
    .filter((child): child is SubjectNode => child !== null);

  const isDraft = node.status === 'draft';

  // A draft leaf, or a draft branch whose descendants are all drafts too.
  if (isDraft && survivors.length === 0) {
    return null;
  }

  // A structural folder that lost every child has nothing left to show.
  if (!isDraft && hadChildren && survivors.length === 0 && node.kind === NodeKind.Node) {
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

  // Survives for its descendants' sake, but has no page of its own to link to.
  if (isDraft) {
    filtered.hasPage = false;
  }

  return filtered;
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
        generateSitemap(withoutDrafts(res.articles), withoutDrafts(res.collections));
        generateRss(withoutDrafts(res.articles));
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
  return withoutDrafts(articles);
}

/**
 * @returns All collections (filtered for draft status in production)
 */
export async function getCollections(): Promise<Collection[]> {
  const { collections } = await ensureLoaded();
  return withoutDrafts(collections).map(visibleCollection);
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
  const collection = collections.find((c) => c.slug === slug);
  // Deliberately returns draft collections too: a published chapter still needs its
  // parent for sibling navigation. Callers decide whether to *link* to it via isVisible.
  return collection ? visibleCollection(collection) : undefined;
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
