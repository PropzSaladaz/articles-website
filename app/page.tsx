import type { Metadata } from 'next';
import { getAllArticles } from '../lib/content/content';
import type { ArticlePreview } from '../lib/content/types';
import { HomeArticleSections } from '../components/HomeArticleSections';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'A chronological catalog of my standalone articles, thoughts, and essays.',
};

export default async function HomePage() {
  const articles = await getAllArticles();

  const standaloneArticles = articles.filter((article) => !article.collectionSlug);
  const hasArticles = standaloneArticles.length > 0;

  if (!hasArticles) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Archive</h1>
        <p className="text-lg text-muted-foreground">No standalone articles have been published yet.</p>
      </div>
    );
  }

  // Keep large rendered article bodies out of the client-side home-page payload.
  const articlePreviews: ArticlePreview[] = standaloneArticles.map((article) => ({
    slug: article.slug,
    title: article.title,
    date: article.date,
    featured: article.featured,
    description: article.description,
    cover: article.cover,
    readingTime: article.readingTime,
    collectionSlug: article.collectionSlug,
  }));

  return <HomeArticleSections articles={articlePreviews} />;
}
