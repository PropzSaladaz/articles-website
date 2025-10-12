import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticles } from '../lib/content';
import type { Article } from '../lib/content';
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
  const articles = await getAllArticles();

  if (articles.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Articles</h1>
        <p className="text-lg text-muted-foreground">No articles have been published yet. Check back soon!</p>
      </div>
    );
  }

  const [featured, ...rest] = articles;
  const latest = rest.slice(0, 3);
  const surfacePalette = [
    'bg-card',
    'bg-muted/70 dark:bg-muted/20',
    'bg-secondary/70 dark:bg-secondary/30',
    'bg-background/90 dark:bg-background/20',
  ];

  const tagMap = new Map<string, { count: number; latest: Article }>();
  for (const article of articles) {
    for (const tag of article.tags) {
      const entry = tagMap.get(tag);
      if (!entry) {
        tagMap.set(tag, { count: 1, latest: article });
      } else {
        entry.count += 1;
      }
    }
  }

  const popularTopics = Array.from(tagMap.entries())
    .sort((a, b) => (b[1].count === a[1].count ? a[0].localeCompare(b[0]) : b[1].count - a[1].count))
    .slice(0, 6);

  const articlesByYear = groupArticlesByYear(articles);
  const years = Object.keys(articlesByYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="flex flex-col gap-16">
      <section className="flex flex-col gap-8 animate-fade-up">
        <div className="space-y-4">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-primary">
            Featured story
          </span>
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">{featured.title}</h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Catch up on the latest publication and explore quick previews of every article in the archive.
            </p>
          </div>
        </div>
        <ArticlePreviewCard
          article={featured}
          variant="featured"
          className={cn(surfacePalette[0], 'animate-fade-up [animation-delay:120ms]')}
        />
      </section>

      {latest.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Latest updates</h2>
              <p className="text-base text-muted-foreground">
                Fresh insights and guides, each condensed into a quick preview so you can dive into what matters.
              </p>
            </div>
            <Link href="/" className="text-sm font-semibold text-primary hover:text-primary/80">
              View all articles
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {latest.map((article, index) => (
              <ArticlePreviewCard
                key={article.slug}
                article={article}
                className={cn(surfacePalette[(index + 1) % surfacePalette.length], 'animate-fade-up')}
                style={{ animationDelay: `${(index + 1) * 80}ms` }}
              />
            ))}
          </div>
        </section>
      )}

      {popularTopics.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Browse by topic</h2>
            <p className="text-base text-muted-foreground">
              Jump straight to the themes you care about, from practical workflows to deep technical guides.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {popularTopics.map(([tag, info], index) => (
              <Link key={tag} href={`/tags/${encodeURIComponent(tag)}/`} className="group block">
                <Card
                  className={cn(
                    'h-full overflow-hidden border border-border/60 transition-all duration-300 hover:shadow-subtle',
                    surfacePalette[(index + 2) % surfacePalette.length],
                    'animate-fade-up'
                  )}
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <CardContent className="flex h-full flex-col gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/80 transition-colors duration-300 group-hover:text-primary">
                      #{tag}
                    </span>
                    <p className="text-lg font-medium text-foreground transition-colors duration-300 group-hover:text-primary">
                      {info.latest.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{info.count} {info.count === 1 ? 'article' : 'articles'}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Archive</h2>
          <p className="text-base text-muted-foreground">
            Explore everything we&apos;ve published, organized by year with quick-hit previews.
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
                    className={cn(surfacePalette[(index + 3) % surfacePalette.length], 'animate-fade-up')}
                    style={{ animationDelay: `${(index + 1) * 40}ms` }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
