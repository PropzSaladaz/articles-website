import type { Metadata } from 'next';
import { getAllArticles } from '../lib/content/content';
import type { Article } from '../lib/content/types';
import { ArchiveList } from '../components/ArchiveList';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'A chronological catalog of my standalone articles, thoughts, and essays.',
};

function groupArticlesByYear(articles: Article[]) {
  return articles.reduce<Record<string, Article[]>>((acc, article) => {
    const year = new Date(article.date).getFullYear().toString();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(article);
    return acc;
  }, {});
}

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

  const articlesByYear = groupArticlesByYear(standaloneArticles);
  const years = Object.keys(articlesByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-6">
        <div className="space-y-4 pb-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Archive</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            A chronological catalog of my standalone articles, thoughts, and essays.
          </p>
        </div>
        <ArchiveList articlesByYear={articlesByYear} years={years} />
      </section>
    </div>
  );
}
