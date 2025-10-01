import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleViewToggle } from '../../../components/ArticleViewToggle';
import { ArticleContent } from '../../../components/ArticleContent';
import { getAllArticles, getArticleBySlug, getArticleCanonicalUrl } from '../../../lib/content';

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

type PageProps = {
  params: { slug: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const article = await getArticleBySlug(params.slug);
  if (!article) {
    return {};
  }
  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: getArticleCanonicalUrl(article.slug),
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const article = await getArticleBySlug(params.slug);
  if (!article) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">Article view</span>
        <ArticleViewToggle />
      </div>
      <ArticleContent article={article} />
    </div>
  );
}
