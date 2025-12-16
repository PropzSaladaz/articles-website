export type Slug = string; // e.g., "computer-science/3d-graphics/article-name"

export type ContentStatus = 'draft' | 'published' | 'archived';

// ========================================
//            Subject Node Tree
// ========================================

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
  folderAbs?: string;
}

export interface CollectionArticle extends SubjectNode {
  kind: NodeKind.CollectionArticle;
  collectionSlug: Slug;
  status: ContentStatus;
  articlesCount: number;
  collectionsCount: number;
}


// ========================================
//            Article Data
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

export type KnowledgePathItem = {
  title: string;
  slug: string;
};

export type Article = {
  slug: string;
  title: string;
  status: ContentStatus;
  date: string;
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
  articles: Article[];
  collections: Collection[];
  totalArticles: number;
  totalCollections: number;
  folderAbs?: string;
};
