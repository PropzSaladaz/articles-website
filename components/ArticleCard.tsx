'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { Article } from '../lib/content';
import { formatDate } from '../lib/format';
import { MarkdownRenderer } from './MarkdownRenderer';
import { TagBadge } from './TagBadge';
import { useViewPreference } from './ViewPreferenceContext';
import { withBasePath } from '../lib/paths';

export function ArticleCard({ article }: { article: Article }) {
  const { view } = useViewPreference();
  const isSummary = view === 'summary';
  const articleHref = `${withBasePath(`/articles/${article.slug}/`)}?view=${view}`;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm transition-colors hover:border-blue-500 dark:border-slate-800 dark:bg-slate-900/70">
      <header className="flex flex-col gap-2">
        <Link href={articleHref} className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
          {article.title}
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <time dateTime={article.date}>{formatDate(article.date)}</time>
          <span aria-hidden="true">•</span>
          <span>{article.readingTime.text}</span>
        </div>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
      </header>
      {isSummary ? (
        <p className="text-base text-slate-600 dark:text-slate-300">{article.summary}</p>
      ) : (
        <MarkdownRenderer html={article.html} className="text-base" />
      )}
      <div>
        <Link
          href={articleHref}
          className={clsx(
            'inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400'
          )}
        >
          Read →
        </Link>
      </div>
    </article>
  );
}
