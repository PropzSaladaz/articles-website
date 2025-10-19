import path from "path";
import fs from "fs";
import { CONTENT_ROOT, isDir, isFile } from "./files";
import { Article, Collection, CollectionArticle, NodeKind, StandaloneArticle, SubjectNode } from "./types";
import { pathToId, slugify } from "./utilities";
import { markdownToHtml } from "../md";
import { buildCollectionFromFolder, buildStandaloneFromFolder } from "./builders";

// Holds data regarding a node in the node tree of all articles
// and collections.
type WalkResult = {
  // self node
  tree: SubjectNode;
  // all standalone articles found below it
  articles: Article[];
  // all collections found below it
  collections: Collection[];
};

/**
 * Detect whether a directory is a standalone article, a collection, or a subject node.
 * @param dirAbs Absolute path to directory
 * @returns The kind of content found
 */
function detectKind(dirAbs: string): 'standalone' | 'collection' | 'node' {
    // identify index markdown file
    const hasIndex = isFile(path.join(dirAbs, 'index.md'));
    // Identify summary markdown file for standalone articles
    const hasStandaloneSummary = isFile(path.join(dirAbs, 'summary.md'));
    // Identify chapters subdirectory for collections
    const chaptersDir = path.join(dirAbs, 'chapters');

    const isCollection =
        hasIndex &&
        isDir(chaptersDir) &&
        // check if at least one chapter exists with valid files
        fs.readdirSync(chaptersDir, { withFileTypes: true })
            .some(d => 
                d.isDirectory() && 
                isFile(path.join(chaptersDir, d.name, 'index.md')) &&
                isFile(path.join(chaptersDir, d.name, 'summary.md'))
            );

    if (isCollection) return 'collection';
    if (hasIndex && hasStandaloneSummary && !isDir(chaptersDir)) return 'standalone';
    return 'node';
}


/**
 * Walks a directory and recursively builds a node for each subdirectory.
 * Returns the root node along with all articles and collections found.
 * @param dirAbs Absolute path to the directory
 * @param slugPieces Array of slug pieces representing the current path
 * @returns A promise that resolves to the walk result
 */
async function walk(dirAbs: string, slugPieces: string[]): Promise<WalkResult> {
  const folderName = path.basename(dirAbs);
  const thisSlug = slugPieces.join('/');
  const title = folderName.replace(/-/g, ' ');
  const id = pathToId(thisSlug);

  const kind = detectKind(dirAbs);

  if (kind === 'standalone') {
    const article = await buildStandaloneFromFolder(dirAbs);
    const treeNode: StandaloneArticle = {
      kind: NodeKind.StandaloneArticle,
      id,
      slug: thisSlug,
      title: article.title,
      articleSlug: article.slug,
    };
    return { tree: treeNode, articles: [article], collections: [] };
  }

  if (kind === 'collection') {
    const collection = await buildCollectionFromFolder(dirAbs);
    const treeNode: CollectionArticle = {
      kind: NodeKind.CollectionArticle,
      id,
      slug: thisSlug || collection.slug,
      title: collection.title,
      collectionSlug: collection.slug,
      articlesCount: collection.totalArticles,
    };
    return { tree: treeNode, articles: [...collection.articles], collections: [collection] };
  }

  // Subject node: recurse
  const children: SubjectNode[] = [];
  let collectionArticlesCount = 0;
  // will hold all articles & all collections found in subdirs
  let arts: Article[] = [];
  let cols: Collection[] = [];

  const dirents = fs.readdirSync(dirAbs, { withFileTypes: true }).filter(d => d.isDirectory());
  for (const d of dirents) {
    const childAbs = path.join(dirAbs, d.name);
    const childSlugPieces = [...slugPieces, slugify(d.name)];
    const { tree, articles, collections } = await walk(childAbs, childSlugPieces);
    children.push(tree);
    arts = arts.concat(articles);
    cols = cols.concat(collections);

    if (tree.kind === NodeKind.StandaloneArticle) {
      collectionArticlesCount += 1;
    }
  }

  const treeNode: SubjectNode = {
    kind: NodeKind.Node,
    id,
    slug: thisSlug,
    title,
    children,
    articlesCount: collectionArticlesCount,
  };

  return { tree: treeNode, articles: arts, collections: cols };
}

/**
 * Loads all content from disk starting at the content root.
 * @returns A promise that resolves to the full walk result from the content root
 */
async function loadAllFromDisk(): Promise<WalkResult> {
  if (!fs.existsSync(CONTENT_ROOT)) {
    throw new Error(`Content directory not found: ${CONTENT_ROOT}`);
  }
  return walk(CONTENT_ROOT, []);
}

export { loadAllFromDisk };
export type { WalkResult };