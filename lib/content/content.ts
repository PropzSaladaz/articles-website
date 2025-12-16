import { SubjectNode, Article, Collection, KnowledgePathItem, NodeKind } from './types';
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
 * Try loading content from disk if not already loaded. If not loaded, parse
 * all articles & generate sitemap + RSS feed.
 * In development mode, always reload to pick up changes.
 * @returns A promise that ensures content is loaded and cached
 */
async function ensureLoaded() {
  const isDev = process.env.NODE_ENV === 'development';

  // In dev mode, always reload content to pick up changes
  if (isDev || !cachePromise) {
    cachePromise = (async () => {
      const res = await loadAllFromDisk();
      // Sort by date desc
      res.articles.sort((a, b) => (a.date > b.date ? -1 : 1));
      // Only persist caches and generate feeds in production
      if (!isDev) {
        persistCaches(res);
        generateSitemap(res.articles, res.collections);
        generateRss(res.articles);
      }
      return res;
    })();
  }
  return cachePromise;
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
  if (article.collectionSlug) {
    return getCanonicalUrl(`/collections/${article.slug}/`);
  }
  return getCanonicalUrl(`/articles/${article.slug}/`);
}

export function getCollectionCanonicalUrl(slug: string) {
  return getCanonicalUrl(`/collections/${slug}/`);
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
