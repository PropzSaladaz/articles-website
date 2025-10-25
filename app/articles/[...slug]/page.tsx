import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArticleViewToggle } from '../../../components/ArticleViewToggle';
import { ArticleContent } from '../../../components/ArticleContent';
import { getAllArticles, getArticleBySlug, getArticleCanonicalUrl } from '../../../lib/content/content';
import { Suspense } from 'react';
import { CopyCodeButtons } from '@/components/CopyCodeButtons';

export const runtime = 'nodejs';           // ensure Node runtime (fs available)
export const dynamic = 'force-static';     // keep SSG if you’re reading local files

export async function generateStaticParams() {
  const articles = await getAllArticles();
  return articles
    .filter((article) => !article.collectionSlug)
    .map((article) => ({ slug: article.slug.split('/') }));
}

type PageProps = {
  params: { slug: string[] };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug ?? '';
  const article = await getArticleBySlug(slug);
  if (!article) {
    return {};
  }
  return {
    title: article.title,
    description: article.summary.text,
    alternates: {
      canonical: getArticleCanonicalUrl(article),
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const slug = Array.isArray(params.slug) ? params.slug.join('/') : params.slug ?? '';
  const article = await getArticleBySlug(slug);
  if (!article || article.collectionSlug) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span className="text-sm uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Article view
        </span>
        {/* Wrap any component that might use useSearchParams/usePathname/useRouter */}
        <Suspense fallback={null}>
          <ArticleViewToggle />
        </Suspense>
      </div>

      {/* If ArticleContent uses client hooks, wrap it too */}
      <Suspense fallback={null}>
        <ArticleContent article={article} />
      </Suspense>

      <CopyCodeButtons />
    </div>
  );
}
