import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleCard } from '../../../components/ArticleCard';
import { getAllArticles, getAllTags } from '../../../lib/content';

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.map((tag) => ({ tag }));
}

type PageProps = {
  params: { tag: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  const tags = await getAllTags();
  if (!tags.includes(tag)) {
    return {};
  }
  return {
    title: `Tag: ${tag}`,
    description: `Articles tagged with ${tag}.`,
  };
}

export default async function TagPage({ params }: PageProps) {
  const tag = decodeURIComponent(params.tag);
  const tags = await getAllTags();
  if (!tags.includes(tag)) {
    notFound();
  }
  const articles = (await getAllArticles()).filter((article) => article.tags.includes(tag));

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Tag: {tag}</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Showing {articles.length} {articles.length === 1 ? 'article' : 'articles'} tagged with #{tag}.
        </p>
      </div>
      <div className="flex flex-col gap-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>
    </div>
  );
}
