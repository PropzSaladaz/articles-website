import fs from "fs";
import path from "path";
import { buildArticleFromFolder, buildCollectionFromFolder } from "./builders";
import { CONTENT_ROOT, isFile } from "./files";
import { Article, Collection, CollectionArticle, NodeKind, StandaloneArticle, SubjectNode } from "./types";
import { numericPrefixOrNull, slugify, titleFromFolder } from "./utilities";

type WalkResult = {
  tree: SubjectNode;
  articles: Article[];
  collections: Collection[];
  selfArticle?: Article;
  selfCollection?: Collection;
};

type WalkContext = {
  slugSources: Map<string, string>;
};

const INDEX_FILENAME = "index.md";

function hasIndex(fileAbs: string) {
  return isFile(path.join(fileAbs, INDEX_FILENAME));
}

function listChildDirs(dirAbs: string) {
  return fs
    .readdirSync(dirAbs, { withFileTypes: true })
    .filter((entry) => entry.isDirectory());
}

function sortDirents(dirents: fs.Dirent[]) {
  return dirents.sort((a, b) => {
    const aNum = numericPrefixOrNull(a.name);
    const bNum = numericPrefixOrNull(b.name);
    if (aNum !== null && bNum !== null) return aNum - bNum;
    if (aNum !== null) return -1;
    if (bNum !== null) return 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

function slugPieceForFolder(folderName: string, folderAbs: string): string {
  const slugPiece = slugify(folderName);
  if (!slugPiece) {
    throw new Error(`Content folder produces an empty URL slug: ${folderAbs}`);
  }
  return slugPiece;
}

function registerSlug(slug: string, dirAbs: string, context: WalkContext) {
  if (!slug) return;

  const firstSource = context.slugSources.get(slug);
  if (firstSource) {
    throw new Error(
      `Duplicate URL slug "${slug}" from content folders ${firstSource} and ${dirAbs}`
    );
  }
  context.slugSources.set(slug, dirAbs);
}

function findIndexedDescendant(dirAbs: string): string | null {
  for (const child of listChildDirs(dirAbs)) {
    const childAbs = path.join(dirAbs, child.name);
    if (hasIndex(childAbs)) return childAbs;

    const indexedDescendant = findIndexedDescendant(childAbs);
    if (indexedDescendant) return indexedDescendant;
  }
  return null;
}

function assertNoIndirectContentChildren(dirAbs: string, childDirents: fs.Dirent[]) {
  for (const child of childDirents) {
    const childAbs = path.join(dirAbs, child.name);
    if (hasIndex(childAbs)) continue;

    const indexedDescendant = findIndexedDescendant(childAbs);
    if (indexedDescendant) {
      throw new Error(
        `Unsupported content layout: indexed folder ${dirAbs} has content at ${indexedDescendant} ` +
          `below non-index folder ${childAbs}. Add an index.md to ${childAbs} or move the content.`
      );
    }
  }
}

async function walk(
  dirAbs: string,
  slugPieces: string[],
  parentCollectionSlug: string | null,
  context: WalkContext
): Promise<WalkResult> {
  const folderName = path.basename(dirAbs);
  const slug = slugPieces.join("/");
  const id = slug;
  const title = slugPieces.length === 0 ? "Root" : titleFromFolder(folderName);

  registerSlug(slug, dirAbs, context);

  const childDirents = sortDirents(listChildDirs(dirAbs));
  const contentChildDirents = childDirents.filter((entry) =>
    hasIndex(path.join(dirAbs, entry.name))
  );

  const currentHasIndex = hasIndex(dirAbs);
  if (currentHasIndex) {
    assertNoIndirectContentChildren(dirAbs, childDirents);
  }

  // Determine classification
  if (currentHasIndex && contentChildDirents.length === 0) {
    // leaf article
    const article = await buildArticleFromFolder({
      folderAbs: dirAbs,
      slugPieces,
      parentCollectionSlug,
    });

    const treeNode: StandaloneArticle = {
      kind: NodeKind.StandaloneArticle,
      id,
      slug,
      title: article.title,
      status: article.status,
      articleSlug: article.slug,
      collectionSlug: article.collectionSlug ?? null,
    };

    return {
      tree: treeNode,
      articles: [article],
      collections: [],
      selfArticle: article,
    };
  }

  if (currentHasIndex && contentChildDirents.length > 0) {
    // collection
    const childResults: WalkResult[] = [];
    for (const child of contentChildDirents) {
      const childAbs = path.join(dirAbs, child.name);
      const childSlugPiece = slugPieceForFolder(child.name, childAbs);
      const childSlugPieces =
        slugPieces.length === 0 ? [childSlugPiece] : [...slugPieces, childSlugPiece];
      const childResult = await walk(childAbs, childSlugPieces, slug, context);
      childResults.push(childResult);
    }

    const directArticles = childResults
      .map((res) => res.selfArticle)
      .filter((art): art is Article => Boolean(art));
    const directCollections = childResults
      .map((res) => res.selfCollection)
      .filter((col): col is Collection => Boolean(col));

    const collection = await buildCollectionFromFolder({
      folderAbs: dirAbs,
      slugPieces,
      childArticles: directArticles,
      childCollections: directCollections,
    });

    const articles = childResults.flatMap((res) => res.articles);
    const collections = [collection, ...childResults.flatMap((res) => res.collections)];
    const treeChildren = childResults.map((res) => res.tree);

    const treeNode: CollectionArticle = {
      kind: NodeKind.CollectionArticle,
      id,
      slug,
      title: collection.title,
      status: collection.status,
      collectionSlug: collection.slug,
      articlesCount: collection.totalArticles,
      collectionsCount: collection.totalCollections,
      children: treeChildren,
    };

    return {
      tree: treeNode,
      articles,
      collections,
      selfCollection: collection,
    };
  }

  // Structural node: recurse into all child directories
  const childResults: WalkResult[] = [];
  for (const child of childDirents) {
    const childAbs = path.join(dirAbs, child.name);
    const childSlugPiece = slugPieceForFolder(child.name, childAbs);
    const childSlugPieces =
      slugPieces.length === 0 ? [childSlugPiece] : [...slugPieces, childSlugPiece];
    const childResult = await walk(childAbs, childSlugPieces, parentCollectionSlug, context);
    childResults.push(childResult);
  }

  const children = childResults.map((res) => res.tree);
  const articles = childResults.flatMap((res) => res.articles);
  const collections = childResults.flatMap((res) => res.collections);

  const directArticleCount = childResults.reduce(
    (count, res) => (res.selfArticle ? count + 1 : count),
    0
  );
  const directCollectionCount = childResults.reduce(
    (count, res) => (res.selfCollection ? count + 1 : count),
    0
  );

  const treeNode: SubjectNode = {
    kind: NodeKind.Node,
    id,
    slug,
    title,
    children,
    articlesCount: directArticleCount,
    collectionsCount: directCollectionCount,
  };

  return {
    tree: treeNode,
    articles,
    collections,
  };
}

async function loadAllFromDisk(): Promise<WalkResult> {
  if (!fs.existsSync(CONTENT_ROOT)) {
    throw new Error(`Content directory not found: ${CONTENT_ROOT}`);
  }

  return walk(CONTENT_ROOT, [], null, { slugSources: new Map() });
}

export { loadAllFromDisk };
export type { WalkResult };
