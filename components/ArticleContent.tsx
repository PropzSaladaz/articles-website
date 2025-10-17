'use client';

import { Article } from '../lib/content/content';
import Image from 'next/image';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useIsSummaryView } from './ArticleViewToggle';
import { formatDate } from '../lib/format';
import { TagBadge } from './TagBadge';
import { withBasePath } from '../lib/paths';
import { GiscusComments } from './GiscusComments';

export function ArticleContent({ article }: { article: Article }) {
  const isSummary = useIsSummaryView();

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
      <article className="prose prose-lg prose-slate max-w-none dark:prose-invert">
        <header className="not-prose mb-8 flex flex-col gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{article.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <time dateTime={article.date}>{formatDate(article.date)}</time>
              <span aria-hidden="true">•</span>
              <span>{article.readingTime.text}</span>
            </div>
          </div>
          {article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <TagBadge key={tag} tag={tag} />
              ))}
            </div>
          )}
        </header>
        {article.cover && !isSummary && (
          <figure className="not-prose overflow-hidden rounded-3xl border border-slate-200 shadow-sm dark:border-slate-800">
            <Image
              src={withBasePath(article.cover)}
              alt={article.title}
              width={1200}
              height={630}
              className="h-auto w-full object-cover"
              priority
            />
          </figure>
        )}
        {isSummary ? (
          <MarkdownRenderer
            html={article.summary.html}
            className="prose-lg text-slate-600 dark:text-slate-300"
          />
        ) : (
          <>
            <MarkdownRenderer html={article.html} />
            <section className="not-prose mt-12 space-y-6">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Comments</h2>
              <GiscusComments discussionIdentifier={article.slug} />
            </section>
          </>
        )}
      </article>
      {!isSummary && article.headings.length > 0 && (
        <nav className="top-24 hidden lg:sticky lg:block">
          <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">On this page</h2>
            <ul className="mt-3 space-y-2">
              {article.headings.map((heading) => (
                <li key={heading.id} className={heading.level > 2 ? 'ml-4' : undefined}>
                  <a href={`#${heading.id}`} className="text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400">
                    {heading.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </div>
  );
}
