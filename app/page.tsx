import type { Metadata } from 'next';
import { getAllArticles } from '../lib/content';
import { ArticleCard } from '../components/ArticleCard';
import { ArticleViewToggle } from '../components/ArticleViewToggle';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Browse articles with hand-written summaries or dive into the full content.',
};

export default async function HomePage() {
  const articles = await getAllArticles();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Latest Articles</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300">
              Choose a hand-crafted overview or the complete write-up for each topic.
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              List view
            </span>
            <ArticleViewToggle />
          </div>
        </div>
        <div className="flex flex-col gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}
