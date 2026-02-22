import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArticleViewToggle } from '../../../components/ArticleViewToggle';
import { ArticleContent } from '../../../components/ArticleContent';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
import {
  getAllArticles,
  getArticleBySlug,
  getArticleCanonicalUrl,
  getCollectionBySlug,
  getCollectionCanonicalUrl,
  getCollections,
  getKnowledgePathForSlug,
} from '../../../lib/content/content';
import { formatDate } from '../../../lib/format';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

type LoadedCollection = NonNullable<Awaited<ReturnType<typeof getCollectionBySlug>>>;

export async function generateStaticParams() {
  const [collections, articles] = await Promise.all([getCollections(), getAllArticles()]);

  const params = new Map<string, string[]>();
  for (const collection of collections) {
    params.set(collection.slug, collection.slug.split('/').filter(Boolean));
  }
  for (const article of articles) {
    if (!article.collectionSlug) continue;
    params.set(article.slug, article.slug.split('/').filter(Boolean));
  }

  return Array.from(params.values()).map((segments) => ({ slug: segments }));
}

type PageProps = {
  params: { slug: string[] };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slugSegments = Array.isArray(params.slug) ? params.slug : [];
  const slug = slugSegments.join('/');
  if (!slug) return {};

  const collection = await getCollectionBySlug(slug);
  if (collection) {
    return {
      title: collection.title,
      description: collection.summary.text,
      alternates: {
        canonical: getCollectionCanonicalUrl(collection.slug),
      },
    };
  }

  const article = await getArticleBySlug(slug);
  if (!article) {
    return {};
  }

  return {
    title: article.title,
    description: article.description,
    alternates: {
      canonical: getArticleCanonicalUrl(article),
    },
  };
}

export default async function CollectionSlugPage({ params }: PageProps) {
  const slugSegments = Array.isArray(params.slug) ? params.slug : [];
  const slug = slugSegments.join('/');
  if (!slug) {
    notFound();
  }

  const collection = await getCollectionBySlug(slug);
  if (collection) {
    return <CollectionView collection={collection} />;
  }

  const article = await getArticleBySlug(slug);
  if (!article || !article.collectionSlug) {
    notFound();
  }

  const [parentCollection, knowledgePath] = await Promise.all([
    getCollectionBySlug(article.collectionSlug),
    getKnowledgePathForSlug(slug),
  ]);

  // Find sibling articles for navigation
  let previousArticle: { slug: string; title: string } | null = null;
  let nextArticle: { slug: string; title: string } | null = null;

  if (parentCollection && parentCollection.articles.length > 1) {
    const currentIndex = parentCollection.articles.findIndex(a => a.slug === article.slug);
    if (currentIndex > 0) {
      const prev = parentCollection.articles[currentIndex - 1];
      previousArticle = { slug: prev.slug, title: prev.title };
    }
    if (currentIndex < parentCollection.articles.length - 1) {
      const next = parentCollection.articles[currentIndex + 1];
      nextArticle = { slug: next.slug, title: next.title };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-2">
        <Link
          href={`/collections/${article.collectionSlug}/`}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:text-primary"
        >
          ← Back to {parentCollection ? parentCollection.title : 'collection'}
        </Link>
        <div className="flex items-center justify-between">
          <span className="text-sm uppercase tracking-wide text-muted-foreground">Article view</span>
          <Suspense fallback={null}>
            <ArticleViewToggle />
          </Suspense>
        </div>
      </div>

      <Suspense fallback={null}>
        <ArticleContent
          article={article}
          knowledgePath={knowledgePath}
          previousArticle={previousArticle}
          nextArticle={nextArticle}
        />
      </Suspense>
    </div>
  );
}

function CollectionView({ collection }: { collection: LoadedCollection }) {
  if (!collection) return null;

  const hasChildCollections = collection.totalCollections > 0;
  const headerCount = hasChildCollections ? collection.totalCollections : collection.totalArticles;
  const headerLabel = hasChildCollections
    ? `${headerCount} ${headerCount === 1 ? 'collection' : 'collections'} inside this collection.`
    : `${headerCount} ${headerCount === 1 ? 'article' : 'articles'} inside this collection.`;

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Collection
        </span>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{collection.title}</h1>
          <p className="text-sm font-medium text-muted-foreground">
            {headerLabel}
          </p>
        </div>
      </header>

      <section className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert">
        <MarkdownRenderer html={collection.summary.html} />
      </section>

      {collection.collections.length > 0 && (
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Collections in this collection</h2>
            <p className="text-base text-muted-foreground">
              Explore nested collections to dive deeper into specific sub-topics.
            </p>
          </div>
          <ol className="space-y-4">
            {collection.collections.map((child, index) => (
              <li key={child.slug} className="list-none">
                <div className="flex gap-4 rounded-2xl border border-border p-5 transition-colors hover:bg-card">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <Link
                        href={`/collections/${child.slug}/`}
                        className="text-lg font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        {child.title}
                      </Link>
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {child.totalCollections > 0 && `${child.totalCollections} collections`}
                        {child.totalCollections > 0 && child.totalArticles > 0 && ' · '}
                        {child.totalArticles > 0 && `${child.totalArticles} articles`}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{child.summary.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {collection.collections.length === 0 && collection.articles.length > 0 && (
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Articles in this collection</h2>
            <p className="text-base text-muted-foreground">
              Browse every chapter in sequence or jump straight to the lessons that matter most to you.
            </p>
          </div>
          <ol className="space-y-4">
            {collection.articles.map((article, index) => (
              <li key={article.slug} className="list-none">
                <div className="flex gap-4 rounded-2xl border border-border p-5 transition-colors hover:bg-card">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <Link
                        href={`/collections/${article.slug}/`}
                        className="text-lg font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        {article.title}
                      </Link>
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {formatDate(article.date)} · {article.readingTime.text}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{article.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
