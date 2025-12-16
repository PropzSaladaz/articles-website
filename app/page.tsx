import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticles, getCollections } from '../lib/content/content';
import type { Article } from '../lib/content/types';
import { ArticlePreviewCard } from '../components/ArticlePreviewCard';
import { Card, CardContent } from '../components/ui/card';
import { cn } from '../lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'Discover recent writing, browse by topic, and explore the full archive.',
};

function groupArticlesByYear(articles: Article[]) {
  return articles.reduce<Record<string, Article[]>>((acc, article) => {
    const year = new Date(article.date).getFullYear().toString();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(article);
    return acc;
  }, {});
}

export default async function HomePage() {
  const [articles, collections] = await Promise.all([getAllArticles(), getCollections()]);

  const standaloneArticles = articles.filter((article) => !article.collectionSlug);
  const childCollectionSlugs = new Set<string>();
  for (const collection of collections) {
    for (const child of collection.collections) {
      childCollectionSlugs.add(child.slug);
    }
  }
  const topLevelCollections = collections.filter((collection) => !childCollectionSlugs.has(collection.slug));

  const hasArticles = standaloneArticles.length > 0;
  const hasCollections = topLevelCollections.length > 0;

  if (!hasArticles && !hasCollections) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Content</h1>
        <p className="text-lg text-muted-foreground">No collections or standalone articles have been published yet.</p>
      </div>
    );
  }

  let featured: Article | undefined;
  let latest: Article[] = [];
  let articlesByYear: Record<string, Article[]> = {};
  let years: string[] = [];

  if (hasArticles) {
    featured = standaloneArticles[0];
    const rest = standaloneArticles.slice(1);
    latest = rest.slice(0, 3);

    articlesByYear = groupArticlesByYear(standaloneArticles);
    years = Object.keys(articlesByYear).sort((a, b) => Number(b) - Number(a));
  }

  return (
    <div className="flex flex-col gap-16">
      {hasArticles && featured && (
        <section className="flex flex-col gap-8 animate-fade-up">
          <div className="space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
              Featured story
            </span>
          </div>
          <ArticlePreviewCard
            article={featured}
            variant="featured"
            className={cn('bg-muted', 'animate-fade-up [animation-delay:120ms]')}
          />
        </section>
      )}

      {hasArticles && latest.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Latest standalone articles</h2>
            <p className="text-base text-muted-foreground">
              Below you can find some of the most recently published standalone pieces.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {latest.map((article, index) => (
              <ArticlePreviewCard
                key={article.slug}
                article={article}
                className={cn('animate-fade-up')}
                style={{ animationDelay: `${(index + 1) * 80}ms` }}
              />
            ))}
          </div>
        </section>
      )}

      {hasCollections && (
        <section className="flex flex-col gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Collections</h2>
            <p className="text-base text-muted-foreground">
              Explore structured learning paths. Each entry shows either its nested collections or the number of articles ready to read.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {topLevelCollections.map((collection, index) => {
              const hasChildCollections = collection.totalCollections > 0;
              const count = hasChildCollections ? collection.totalCollections : collection.totalArticles;
              const label = hasChildCollections
                ? `${count} ${count === 1 ? 'collection' : 'collections'}`
                : `${count} ${count === 1 ? 'article' : 'articles'}`;
              return (
                <Link key={collection.slug} href={`/collections/${collection.slug}/`} className="group block">
                  <Card
                    className={cn(
                      'h-full overflow-hidden border border-border transition-all duration-300 hover:shadow-subtle',
                      'animate-fade-up'
                    )}
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <CardContent className="flex h-full flex-col gap-4">
                      <span className="mt-5 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground/80 transition-colors duration-300">
                        Collection
                      </span>
                      <p className="text-lg font-medium text-foreground transition-colors duration-300 group-hover:text-primary">
                        {collection.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{collection.summary.text}</p>
                      <p className="mt-auto text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                        {label}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {hasArticles && years.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Archive</h2>
            <p className="text-base text-muted-foreground">
              Explore every standalone article, organized by year with quick-hit previews.
            </p>
          </div>
          <div className="flex flex-col gap-8">
            {years.map((year) => (
              <div key={year} className="flex flex-col gap-4">
                <h3 className="text-xl font-semibold text-foreground">{year}</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {articlesByYear[year].map((article, index) => (
                    <ArticlePreviewCard
                      key={article.slug}
                      article={article}
                      variant="compact"
                      className={cn('animate-fade-up')}
                      style={{ animationDelay: `${(index + 1) * 40}ms` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
