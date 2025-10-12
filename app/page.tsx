import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticles } from '../lib/content';
import type { Article } from '../lib/content';
import { ArticlePreviewCard } from '../components/ArticlePreviewCard';

export const runtime = 'nodejs';           // ensure Node runtime (fs available)
export const dynamic = 'force-static';     // keep SSG if you’re reading local files

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
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Articles</h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">No articles have been published yet. Check back soon!</p>
      </div>
    );
  }

  const [featured, ...rest] = articles;
  const latest = rest.slice(0, 3);

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
    <div className="flex flex-col gap-12">
      <section className="flex flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Featured story</p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{featured.title}</h1>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Catch up on the latest publication and explore quick previews of every article in the archive.
          </p>
        </div>
        <ArticlePreviewCard article={featured} variant="featured" />
      </section>

      {latest.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Latest updates</h2>
              <p className="text-base text-slate-600 dark:text-slate-300">
                Fresh insights and guides, each condensed into a quick preview so you can dive into what matters.
              </p>
            </div>
            <Link href="/" className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">
              View all articles
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {latest.map((article) => (
              <ArticlePreviewCard key={article.slug} article={article} />
            ))}
          </div>
        </section>
      )}

      {popularTopics.length > 0 && (
        <section className="flex flex-col gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Browse by topic</h2>
            <p className="text-base text-slate-600 dark:text-slate-300">
              Jump straight to the themes you care about, from practical workflows to deep technical guides.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {popularTopics.map(([tag, info]) => (
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}/`}
                className="group rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="flex flex-col gap-3">
                  <span className="text-sm font-semibold uppercase tracking-wide text-blue-600 group-hover:text-blue-700 dark:text-blue-400 dark:group-hover:text-blue-300">
                    #{tag}
                  </span>
                  <p className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    {info.latest.title}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {info.count} {info.count === 1 ? 'article' : 'articles'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Archive</h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Explore everything we&apos;ve published, organized by year with quick-hit previews.
          </p>
        </div>
        <div className="flex flex-col gap-8">
          {years.map((year) => (
            <div key={year} className="flex flex-col gap-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{year}</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {articlesByYear[year].map((article) => (
                  <ArticlePreviewCard key={article.slug} article={article} variant="compact" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
