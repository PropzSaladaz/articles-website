import type { Article, Collection, ContentStatus, SubjectNode } from './types';
import { NodeKind } from './types';

/** The three public read models derived from one loaded content corpus. */
export type ContentSnapshot = {
  tree: SubjectNode;
  articles: Article[];
  collections: Collection[];
};

type ContentEntry = { slug: string; status: ContentStatus };

function isDescendantOf(slug: string, ancestorSlug: string): boolean {
  return slug.startsWith(`${ancestorSlug}/`);
}

/**
 * A draft collection hides its whole subtree. An entry is public only when it
 * is not draft itself and it does not live below a draft collection.
 */
function isPublicEntry(entry: ContentEntry, draftCollectionSlugs: readonly string[]): boolean {
  return (
    entry.status !== 'draft' &&
    !draftCollectionSlugs.some((draftSlug) => isDescendantOf(entry.slug, draftSlug))
  );
}

/** Apply the public visibility rule to a collection and its embedded children. */
function projectPublicCollection(
  collection: Collection,
  draftCollectionSlugs: readonly string[]
): Collection {
  const articles = collection.articles.filter((article) =>
    isPublicEntry(article, draftCollectionSlugs)
  );
  const collections = collection.collections
    .filter((child) => isPublicEntry(child, draftCollectionSlugs))
    .map((child) => projectPublicCollection(child, draftCollectionSlugs));

  return {
    ...collection,
    articles,
    collections,
    totalArticles: articles.length,
    totalCollections: collections.length,
  };
}

/** Remove draft branches from the navigation tree. */
function pruneDraftTree(node: SubjectNode): SubjectNode | null {
  if (node.status === 'draft') return null;

  const hadChildren = (node.children?.length ?? 0) > 0;
  const children = (node.children ?? [])
    .map(pruneDraftTree)
    .filter((child): child is SubjectNode => child !== null);

  // A structural folder that lost every child has nothing left to show.
  if (hadChildren && children.length === 0 && node.kind === NodeKind.Node) {
    return null;
  }

  return hadChildren
    ? {
        ...node,
        children,
        articlesCount: children.filter((child) => child.kind === NodeKind.StandaloneArticle).length,
        collectionsCount: children.filter((child) => child.kind === NodeKind.CollectionArticle).length,
      }
    : { ...node };
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

/**
 * Build the fail-closed production snapshot from the full corpus.
 *
 * This function is environment-agnostic and has no cache or filesystem work,
 * making the visibility contract independently testable.
 */
export function createPublicSnapshot(content: ContentSnapshot): ContentSnapshot {
  const draftCollectionSlugs = content.collections
    .filter((collection) => collection.status === 'draft')
    .map((collection) => collection.slug);

  return {
    tree: pruneDraftTree(content.tree) ?? emptySubjectTree(),
    articles: content.articles.filter((article) => isPublicEntry(article, draftCollectionSlugs)),
    collections: content.collections
      .filter((collection) => isPublicEntry(collection, draftCollectionSlugs))
      .map((collection) => projectPublicCollection(collection, draftCollectionSlugs)),
  };
}
