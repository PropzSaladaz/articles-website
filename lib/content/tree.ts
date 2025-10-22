import fs from "fs";
import path from "path";
import { buildArticleFromFolder, buildCollectionFromFolder } from "./builders";
import { CONTENT_ROOT, isFile } from "./files";
import { Article, Collection, CollectionArticle, NodeKind, StandaloneArticle, SubjectNode } from "./types";
import { numericPrefixOrNull, pathToId, slugify, titleFromFolder } from "./utilities";

type WalkResult = {
  tree: SubjectNode;
  articles: Article[];
  collections: Collection[];
  selfArticle?: Article;
  selfCollection?: Collection;
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

async function walk(
  dirAbs: string,
  slugPieces: string[],
  parentCollectionSlug: string | null
): Promise<WalkResult> {
  const folderName = path.basename(dirAbs);
  const slug = slugPieces.join("/");
  const id = pathToId(slug);
  const title = slugPieces.length === 0 ? "Root" : titleFromFolder(folderName);

  const childDirents = sortDirents(listChildDirs(dirAbs));
  const contentChildDirents = childDirents.filter((entry) =>
    hasIndex(path.join(dirAbs, entry.name))
  );

  const currentHasIndex = hasIndex(dirAbs);

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
      const childSlugPieces =
        slugPieces.length === 0
          ? [slugify(child.name)]
          : [...slugPieces, slugify(child.name)];
      const childResult = await walk(childAbs, childSlugPieces, slug);
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
    const childSlugPieces =
      slugPieces.length === 0 ? [slugify(child.name)] : [...slugPieces, slugify(child.name)];
    const childResult = await walk(childAbs, childSlugPieces, parentCollectionSlug);
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

  return walk(CONTENT_ROOT, [], null);
}

export { loadAllFromDisk };
export type { WalkResult };
