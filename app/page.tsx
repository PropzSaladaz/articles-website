import type { Metadata } from 'next';
import { getAllArticles } from '../lib/content/content';
import type { Article } from '../lib/content/types';
import { ArchiveList } from '../components/ArchiveList';
import { ArticlePreviewCard } from '../components/ArticlePreviewCard';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Articles',
  description: 'A chronological catalog of my standalone articles, thoughts, and essays.',
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
  const articles = await getAllArticles();

  const standaloneArticles = articles.filter((article) => !article.collectionSlug);
  const hasArticles = standaloneArticles.length > 0;

  if (!hasArticles) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Archive</h1>
        <p className="text-lg text-muted-foreground">No standalone articles have been published yet.</p>
      </div>
    );
  }

  // getAllArticles() is already ordered by newest publication date first.
  const latestArticle = standaloneArticles[0];
  const featuredArticle = standaloneArticles.find(
    (article) => article.featured && article.slug !== latestArticle.slug
  );
  const highlightedSlugs = new Set([latestArticle.slug, featuredArticle?.slug]);
  const archiveArticles = standaloneArticles.filter((article) => !highlightedSlugs.has(article.slug));
  const articlesByYear = groupArticlesByYear(archiveArticles);
  const years = Object.keys(articlesByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-8">
        <div className="space-y-4 pb-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Articles</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            New writing, selected reading, and a chronological archive of standalone articles.
          </p>
        </div>

        <div className={`grid gap-8 ${featuredArticle ? 'lg:grid-cols-2' : ''}`}>
          <section className="flex flex-col gap-4" aria-labelledby="latest-article">
            <div className="space-y-1">
              <h2 id="latest-article" className="text-2xl font-semibold tracking-tight text-foreground">Latest</h2>
              <p className="text-sm text-muted-foreground">The most recently published article.</p>
            </div>
            <ArticlePreviewCard article={latestArticle} variant="featured" />
          </section>

          {featuredArticle && (
            <section className="flex flex-col gap-4" aria-labelledby="featured-article">
              <div className="space-y-1">
                <h2 id="featured-article" className="text-2xl font-semibold tracking-tight text-foreground">Featured</h2>
                <p className="text-sm text-muted-foreground">A hand-picked article worth revisiting.</p>
              </div>
              <ArticlePreviewCard article={featuredArticle} variant="featured" />
            </section>
          )}
        </div>
      </section>

      {archiveArticles.length > 0 && (
        <section className="flex flex-col gap-6" aria-labelledby="article-archive">
          <div className="space-y-1">
            <h2 id="article-archive" className="text-2xl font-semibold tracking-tight text-foreground">Archive</h2>
            <p className="text-sm text-muted-foreground">Browse earlier articles by publication date.</p>
          </div>
          <ArchiveList articlesByYear={articlesByYear} years={years} />
        </section>
      )}
    </div>
  );
}
