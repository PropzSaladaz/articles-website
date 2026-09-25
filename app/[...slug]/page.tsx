import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArticleContent } from '../../components/ArticleContent';
import { ArticleViewTracker } from '../../components/ArticleViewTracker';
import { CopyCodeButtons } from '../../components/CopyCodeButtons';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import { CardSection } from '../../components/CardSection';
import { ContentCard } from '../../components/ContentCard';
import { PageContainer } from '../../components/PageContainer';
import { PageHeader } from '../../components/PageHeader';
import { nearestSubjectStyle } from '../../components/subjectIcons';
import {
  getAllArticles,
  getArticleBySlug,
  getArticleCanonicalUrl,
  getCollectionBySlug,
  getCollectionCanonicalUrl,
  getCollections,
  getKnowledgePathForSlug,
} from '../../lib/content/content';
import { formatDate, pluralize } from '../../lib/format';
import { articlePath, collectionPath } from '../../lib/content/urls';

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

export default async function ContentPage({ params }: PageProps) {
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
  if (!article) {
    notFound();
  }

  const [parentCollection, knowledgePath, collections] = await Promise.all([
    article.collectionSlug ? getCollectionBySlug(article.collectionSlug) : undefined,
    getKnowledgePathForSlug(slug),
    getCollections(),
  ]);

  // Find sibling articles for navigation
  let previousArticle: { slug: string; title: string } | null = null;
  let nextArticle: { slug: string; title: string } | null = null;
  let series: { slug: string; title: string; position: number; total: number } | null = null;

  if (parentCollection && parentCollection.articles.length > 1) {
    const currentIndex = parentCollection.articles.findIndex(a => a.slug === article.slug);
    if (currentIndex >= 0) {
      series = {
        slug: parentCollection.slug,
        title: parentCollection.title,
        position: currentIndex + 1,
        total: parentCollection.articles.length,
      };
    }
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
      <ArticleViewTracker slug={article.slug} />

      <div className="space-y-2">
        {parentCollection && (
          <Link
            href={collectionPath(parentCollection.slug)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to {parentCollection.title}
          </Link>
        )}
      </div>

      <Suspense fallback={null}>
        <ArticleContent
          article={article}
          knowledgePath={knowledgePath}
          previousArticle={previousArticle}
          nextArticle={nextArticle}
          series={series}
          collectionSlugs={collections.map((collection) => collection.slug)}
        />
      </Suspense>

      <CopyCodeButtons />
    </div>
  );
}

function CollectionView({ collection }: { collection: LoadedCollection }) {
  if (!collection) return null;

  const hasChildCollections = collection.totalCollections > 0;
  const headerLabel = hasChildCollections
    ? pluralize(collection.totalCollections, 'collection')
    : pluralize(collection.totalArticles, 'chapter');

  return (
    <PageContainer>
      <PageHeader
        title={collection.title}
        eyebrow={`Collection · ${headerLabel}`}
        iconStyle={nearestSubjectStyle(collection.slug)}
      />

      <section className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert">
        <MarkdownRenderer html={collection.html} />
      </section>

      {collection.collections.length > 0 && (
        <CardSection title="Collections" ordered>
          {collection.collections.map((child, index) => (
            <ContentCard
              key={child.slug}
              number={index + 1}
              href={collectionPath(child.slug)}
              title={child.title}
              eyebrow={[
                child.totalCollections > 0 && pluralize(child.totalCollections, 'collection'),
                child.totalArticles > 0 && pluralize(child.totalArticles, 'chapter'),
              ]
                .filter(Boolean)
                .join(' · ')}
              description={child.summary.text}
            />
          ))}
        </CardSection>
      )}

      {collection.collections.length === 0 && collection.articles.length > 0 && (
        <CardSection title="Chapters" ordered>
          {collection.articles.map((article, index) => (
            <ContentCard
              key={article.slug}
              number={index + 1}
              href={articlePath(article)}
              title={article.title}
              eyebrow={`${formatDate(article.date)} · ${article.readingTime.text}`}
              description={article.description}
            />
          ))}
        </CardSection>
      )}
    </PageContainer>
  );
}
