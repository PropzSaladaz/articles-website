import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArticleViewToggle } from '../../../../components/ArticleViewToggle';
import { ArticleContent } from '../../../../components/ArticleContent';
import {
  getArticleBySlug,
  getArticleCanonicalUrl,
  getCollectionBySlug,
  getCollections,
} from '../../../../lib/content/content';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.flatMap((collection) =>
    collection.articles.map((article) => ({
      collection: collection.slug,
      article: article.slug.split('/').slice(1).join('/'),
    }))
  );
}

type PageProps = {
  params: { collection: string; article: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = `${params.collection}/${params.article}`;
  const article = await getArticleBySlug(slug);
  if (!article) {
    return {};
  }

  return {
    title: article.title,
    description: article.summary.text,
    alternates: {
      canonical: getArticleCanonicalUrl(article.slug),
    },
  };
}

export default async function CollectionArticlePage({ params }: PageProps) {
  const slug = `${params.collection}/${params.article}`;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const collection = await getCollectionBySlug(params.collection);

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Link
          href={`/collections/${params.collection}/`}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-primary"
        >
          ← Back to {collection ? collection.title : 'collection'}
        </Link>
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase tracking-wide text-muted-foreground">Article view</span>
          <Suspense fallback={null}>
            <ArticleViewToggle />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={null}>
        <ArticleContent article={article} />
      </Suspense>
    </div>
  );
}
