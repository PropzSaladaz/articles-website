export type Slug = string; // e.g., "computer-science/3d-graphics/article-name"

export type ContentStatus = 'draft' | 'published' | 'archived';

// ========================================
//         Navigation Read Models
// ========================================
//
// The subject tree is the navigation payload: slugs, titles, kinds, counts and
// children, with no article bodies. It is safe to hand to Client Components as
// a whole, and it is the only content structure that should be.

export enum NodeKind {
  StandaloneArticle = 'standalone',
  CollectionArticle = 'collection',
  Node = 'node',
}

export interface SubjectNode {
  kind: NodeKind;
  id: string;
  slug: string;
  title: string;
  status?: ContentStatus;

  // for collection only
  children?: SubjectNode[];
  articlesCount?: number;
  collectionsCount?: number;
}

export interface StandaloneArticle extends SubjectNode {
  kind: NodeKind.StandaloneArticle;
  articleSlug: Slug;
  status: ContentStatus;
  collectionSlug?: Slug | null;
}

export interface CollectionArticle extends SubjectNode {
  kind: NodeKind.CollectionArticle;
  collectionSlug: Slug;
  status: ContentStatus;
  articlesCount: number;
  collectionsCount: number;
}


// ========================================
//          Rich Content Models
// ========================================

export type ArticleSummary = {
  text: string;
  html: string;
};

export type Heading = {
  id: string;
  text: string;
  level: number;
};

/**
 * Rich content models built by the server-side content loader.
 *
 * Avoid passing complete instances into Client Components. `Collection`
 * transitively embeds every descendant `Article` — bodies included — so one
 * serialized instance can drag most of the corpus into a page payload. Project
 * them into a purpose-specific read model first, or pass `SubjectNode` when all
 * that is needed is navigation structure.
 *
 * TypeScript does not enforce this; the modules that *build* these values are
 * marked `server-only` instead. The types themselves stay dependency-free so
 * Client Components can `import type` from here.
 */
export type Article = {
  slug: string;
  title: string;
  status: ContentStatus;
  date: string;
  /** Manually promote this article in the home-page featured slot. */
  featured: boolean;
  description: string;
  summary: ArticleSummary;
  cover?: string | null;
  content: string;
  html: string;
  headings: Heading[];
  readingTime: {
    text: string;
    minutes: number;
    words: number;
  };
  collectionSlug?: Slug | null;
  folderAbs?: string;
};

export type Collection = {
  slug: Slug;
  title: string;
  status: ContentStatus;
  cover?: string | null;
  summary: ArticleSummary;
  content: string;
  html: string;
  articles: Article[];
  collections: Collection[];
  totalArticles: number;
  totalCollections: number;
  folderAbs?: string;
};


// ========================================
//       Client-Facing Projections
// ========================================
//
// Add a projection here only once a Client Component actually needs it.

/** The serializable article fields used by cards and home-page listings. */
export type ArticlePreview = Pick<
  Article,
  | 'slug'
  | 'title'
  | 'date'
  | 'featured'
  | 'description'
  | 'cover'
  | 'readingTime'
  | 'collectionSlug'
>;

/** One breadcrumb step from the subject tree down to an article. */
export type KnowledgePathItem = {
  title: string;
  slug: string;
};
