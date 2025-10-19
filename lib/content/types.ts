export type Slug = string; // e.g., "computer-science/3d-graphics/article-name"

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

    // for collection only
    children?: SubjectNode[];
    articlesCount?: number;
}

export interface StandaloneArticle extends SubjectNode {
    kind: NodeKind.StandaloneArticle;
    articleSlug: Slug;
}

export interface CollectionArticle extends SubjectNode {
    kind: NodeKind.CollectionArticle;
    collectionSlug: Slug;
    articlesCount: number;
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

export type Article = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
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
};

export type Collection = {
    slug: Slug;
    title: string;
    cover?: string | null;
    summary: ArticleSummary;
    articles: Article[];
    totalArticles: number;

}