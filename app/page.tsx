import type { Metadata } from 'next';
import { getAllArticles } from '../lib/content';
import { ArticleCard } from '../components/ArticleCard';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Browse articles with summary and full views.',
};

export default async function HomePage() {
  const articles = await getAllArticles();

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Latest Articles</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Toggle between concise summaries and full content using the control in the header.
          </p>
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
