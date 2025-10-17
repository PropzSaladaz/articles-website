import path from "path";
import fs from "fs";
import { CONTENT_ROOT, isDir, isFile } from "./files";
import { Article, Collection, NodeKind, StandaloneArticle, SubjectNode } from "./types";
import { pathToId } from "./utilities";
import { markdownToHtml } from "../md";

type WalkResult = {
  tree: SubjectNode;
  articles: Article[];
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



async function walk(dirAbs: string, slugPieces: string[]): Promise<WalkResult> {
  const folderName = path.basename(dirAbs);
  const thisSlug = slugPieces.join('/');
  const title = folderName.replace(/-/g, ' ');
  const id = pathToId(thisSlug);

  const kind = detectKind(dirAbs);

  if (kind === 'standalone') {
    const article = await 
    const treeNode: StandaloneArticle = {
      kind: NodeKind.StandaloneArticle,
      id,
      slug: thisSlug || article.slug,
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
  }

  const treeNode: SubjectNode = {
    kind: NodeKind.Node,
    id,
    slug: thisSlug,
    title,
    children,
  };

  return { tree: treeNode, articles: arts, collections: cols };
}

async function loadAllFromDisk(): Promise<WalkResult> {
  if (!fs.existsSync(CONTENT_ROOT)) {
    throw new Error(`Content directory not found: ${CONTENT_ROOT}`);
  }
  return walk(CONTENT_ROOT, []);
}

function buildStandaloneFromFolder(dirAbs: string) {
    throw new Error("Function not implemented.");
}
