import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MarkdownRenderer } from '../../../components/MarkdownRenderer';
import { formatDate } from '../../../lib/format';
import {
  getCollectionBySlug,
  getCollectionCanonicalUrl,
  getCollections,
} from '../../../lib/content/content';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((collection) => ({ collection: collection.slug }));
}

type PageProps = {
  params: { collection: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const collection = await getCollectionBySlug(params.collection);
  if (!collection) {
    return {};
  }

  return {
    title: collection.title,
    description: collection.summary.text,
    alternates: {
      canonical: getCollectionCanonicalUrl(collection.slug),
    },
  };
}

export default async function CollectionPage({ params }: PageProps) {
  const collection = await getCollectionBySlug(params.collection);

  if (!collection) {
    notFound();
  }

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
          Collection
        </span>
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{collection.title}</h1>
          <p className="text-sm font-medium text-muted-foreground">
            {collection.totalArticles} {collection.totalArticles === 1 ? 'article' : 'articles'} inside
            this collection.
          </p>
        </div>
      </header>

      <section className="prose prose-lg max-w-none text-muted-foreground dark:prose-invert">
        <MarkdownRenderer html={collection.summary.html} />
      </section>

      <section className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">Articles in this collection</h2>
          <p className="text-base text-muted-foreground">
            Browse every chapter in sequence or jump straight to the lessons that matter most to you.
          </p>
        </div>
        <ol className="space-y-4">
          {collection.articles.map((article, index) => {
            const articleSlug = article.slug.split('/').slice(1).join('/');
            const href = `/collections/${collection.slug}/${articleSlug}/`;
            return (
              <li key={article.slug} className="list-none">
                <div className="flex gap-4 rounded-2xl border border-border/60 bg-background/80 p-5 transition-colors hover:border-primary/40">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                      <Link href={href} className="text-lg font-semibold text-foreground transition-colors hover:text-primary">
                        {article.title}
                      </Link>
                      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {formatDate(article.date)} · {article.readingTime.text}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {article.summary.text}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
