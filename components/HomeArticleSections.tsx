'use client';

import { useEffect, useState } from 'react';
import type { ArticlePreview } from '../lib/content/types';
import { ArchiveList } from './ArchiveList';
import { ArticlePreviewCard } from './ArticlePreviewCard';

type PopularArticle = {
  slug: string;
  views: number;
};

function isPopularArticle(value: unknown): value is PopularArticle {
  if (typeof value !== 'object' || value === null) return false;

  return (
    'slug' in value &&
    typeof value.slug === 'string' &&
    'views' in value &&
    typeof value.views === 'number'
  );
}

function readPopularArticles(value: unknown): PopularArticle[] {
  if (typeof value !== 'object' || value === null || !('articles' in value)) return [];
  if (!Array.isArray(value.articles)) return [];

  return value.articles.filter(isPopularArticle);
}

function findRankedArticle(slugs: string[], articles: ArticlePreview[]) {
  for (const slug of slugs) {
    const article = articles.find((candidate) => candidate.slug === slug);
    if (article) return article;
  }

  return undefined;
}

function groupArticlesByYear(articles: ArticlePreview[]) {
  return articles.reduce<Record<string, ArticlePreview[]>>((groups, article) => {
    const year = new Date(article.date).getFullYear().toString();
    if (!groups[year]) groups[year] = [];
    groups[year].push(article);
    return groups;
  }, {});
}

export function HomeArticleSections({ articles }: { articles: ArticlePreview[] }) {
  const [popularSlugs, setPopularSlugs] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPopularArticles() {
      try {
        const response = await fetch('/api/article-views/popular', {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) return;

        const payload: unknown = await response.json();
        setPopularSlugs(readPopularArticles(payload).map((article) => article.slug));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          // Keep the statically rendered featured fallback if analytics is unavailable.
        }
      }
    }

    void loadPopularArticles();
    return () => controller.abort();
  }, []);

  // getAllArticles() supplies this list newest first.
  const latestArticle = articles[0];
  const popularArticle = findRankedArticle(popularSlugs, articles);
  const fallbackFeaturedArticle = articles.find(
    (article) => article.featured && article.slug !== latestArticle.slug
  );
  const latestIsPopular = popularArticle?.slug === latestArticle.slug;
  const secondaryArticle = latestIsPopular
    ? undefined
    : popularArticle ?? fallbackFeaturedArticle;
  const usingPopularArticle = secondaryArticle?.slug === popularArticle?.slug;

  const highlightedSlugs = new Set([latestArticle.slug, secondaryArticle?.slug]);
  const archiveArticles = articles.filter((article) => !highlightedSlugs.has(article.slug));
  const articlesByYear = groupArticlesByYear(archiveArticles);
  const years = Object.keys(articlesByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-8">
        <div className="space-y-4 pb-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Articles</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            New writing, selected reading, and a chronological archive of standalone articles.
          </p>
        </div>

        <div className={`grid gap-8 ${secondaryArticle ? 'lg:grid-cols-2' : ''}`}>
          <section className="flex flex-col gap-4" aria-labelledby="latest-article">
            <div className="space-y-1">
              <h2 id="latest-article" className="text-2xl font-semibold tracking-tight text-foreground">
                {latestIsPopular ? 'Latest & popular' : 'Latest'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {latestIsPopular
                  ? 'The newest article—and the most read over the last three days.'
                  : 'The most recently published article.'}
              </p>
            </div>
            <ArticlePreviewCard article={latestArticle} variant="featured" />
          </section>

          {secondaryArticle && (
            <section
              className="flex flex-col gap-4"
              aria-labelledby={usingPopularArticle ? 'popular-article' : 'featured-article'}
            >
              <div className="space-y-1">
                <h2
                  id={usingPopularArticle ? 'popular-article' : 'featured-article'}
                  className="text-2xl font-semibold tracking-tight text-foreground"
                >
                  {usingPopularArticle ? 'Popular' : 'Featured'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {usingPopularArticle
                    ? 'The most-read article over the last three days.'
                    : 'A hand-picked article worth revisiting.'}
                </p>
              </div>
              <ArticlePreviewCard article={secondaryArticle} variant="featured" />
            </section>
          )}
        </div>
      </section>

      {archiveArticles.length > 0 && (
        <section className="flex flex-col gap-6" aria-labelledby="article-archive">
          <div className="space-y-1">
            <h2 id="article-archive" className="text-2xl font-semibold tracking-tight text-foreground">
              Archive
            </h2>
            <p className="text-sm text-muted-foreground">Browse earlier articles by publication date.</p>
          </div>
          <ArchiveList articlesByYear={articlesByYear} years={years} />
        </section>
      )}
    </div>
  );
}
