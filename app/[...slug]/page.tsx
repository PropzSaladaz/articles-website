import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { ArticleContent } from '../../components/ArticleContent';
import { ArticleViewTracker } from '../../components/ArticleViewTracker';
import { CopyCodeButtons } from '../../components/CopyCodeButtons';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';
import {
  getAllArticles,
  getArticleBySlug,
  getArticleCanonicalUrl,
  getCollectionBySlug,
  getCollectionCanonicalUrl,
  getCollections,
  getKnowledgePathForSlug,
} from '../../lib/content/content';
import { formatDate } from '../../lib/format';
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
  const headerCount = hasChildCollections ? collection.totalCollections : collection.totalArticles;
  const headerLabel = hasChildCollections
    ? `${headerCount} ${headerCount === 1 ? 'collection' : 'collections'}`
    : `${headerCount} ${headerCount === 1 ? 'article' : 'articles'}`;

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <span className="text-sm text-muted-foreground">
          Collection
        </span>
        <div className="space-y-3">
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-foreground">{collection.title}</h1>
          <p className="text-sm font-medium text-muted-foreground">
            {headerLabel}
          </p>
        </div>
      </header>

      <section className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert">
        <MarkdownRenderer html={collection.html} />
      </section>

      {collection.collections.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Collections</h2>
          <ol className="divide-y divide-border border-y border-border">
            {collection.collections.map((child, index) => (
              <ChapterRow
                key={child.slug}
                number={index + 1}
                href={collectionPath(child.slug)}
                title={child.title}
                meta={[
                  child.totalCollections > 0 && `${child.totalCollections} collections`,
                  child.totalArticles > 0 && `${child.totalArticles} articles`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                description={child.summary.text}
              />
            ))}
          </ol>
        </section>
      )}

      {collection.collections.length === 0 && collection.articles.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Articles</h2>
          <ol className="divide-y divide-border border-y border-border">
            {collection.articles.map((article, index) => (
              <ChapterRow
                key={article.slug}
                number={index + 1}
                href={articlePath(article)}
                title={article.title}
                meta={`${formatDate(article.date)} · ${article.readingTime.text}`}
                description={article.description}
              />
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

/**
 * One entry in a collection's contents, set like a book's table of contents:
 * chapter number in the margin, a small date/length line above a serif title,
 * then a one-line description, with hairline dividers between rows. Blue is used
 * sparingly: the chapter numbers, and the title on hover (blue + underline). The whole row is the
 * click target (the link's ::after covers it). The number's top padding (pt-5)
 * skips the meta line (text-xs + mb-1) so it sits level with the title.
 */
function ChapterRow({
  number,
  href,
  title,
  meta,
  description,
}: {
  number: number;
  href: string;
  title: string;
  meta: string;
  description: string;
}) {
  return (
    <li className="group relative flex gap-4 py-5 sm:gap-6">
      <span className="w-6 shrink-0 pt-5 text-right font-serif text-lg font-semibold tabular-nums text-[hsl(var(--link))]">
        {number}
      </span>
      <div className="min-w-0 flex-1">
        {meta && <p className="mb-1 text-xs text-muted-foreground">{meta}</p>}
        <Link
          href={href}
          className="font-serif text-xl font-semibold text-foreground underline-offset-4 transition-colors after:absolute after:inset-0 group-hover:text-[hsl(var(--link))] group-hover:underline"
        >
          {title}
        </Link>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
    </li>
  );
}
