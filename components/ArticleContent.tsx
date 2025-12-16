'use client';

import { Article, KnowledgePathItem } from '../lib/content/types';
import Image from 'next/image';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useIsSummaryView } from './ArticleViewToggle';
import { formatDate } from '../lib/format';
import { withBasePath } from '../lib/paths';
import { GiscusComments } from './GiscusComments';
import { ArticleNavigation } from './ArticleNavigation';
import { cn } from '../lib/utils';

/**
 * Check if the summary content is empty or minimal (just whitespace/short placeholder)
 */
function isSummaryEmpty(summary: { text: string; html: string }): boolean {
  const trimmedText = summary.text.trim();
  return trimmedText.length === 0 || trimmedText.length < 20;
}

type SiblingArticle = {
  slug: string;
  title: string;
};

export function ArticleContent({
  article,
  knowledgePath = [],
  previousArticle,
  nextArticle,
}: {
  article: Article;
  knowledgePath?: KnowledgePathItem[];
  previousArticle?: SiblingArticle | null;
  nextArticle?: SiblingArticle | null;
}) {
  const isSummary = useIsSummaryView();
  const showEmptyPlaceholder = isSummary && isSummaryEmpty(article.summary);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
      <article className="prose prose-lg prose-slate max-w-none dark:prose-invert">
        <header className="not-prose mb-8 flex flex-col gap-4">
          {knowledgePath.length > 0 && (
            <nav aria-label="Knowledge path" className="mb-2">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm leading-none text-muted-foreground/80">
                {knowledgePath.map((node, index) => {
                  const isLast = index === knowledgePath.length - 1;
                  return (
                    <li key={node.slug} className="flex items-center gap-1.5">
                      <span className={cn("transition-colors", isLast ? "font-semibold text-foreground" : "hover:text-foreground")}>
                        {node.title}
                      </span>
                      {!isLast && (
                        <span aria-hidden="true" className="text-muted-foreground/40 select-none">
                          ›
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          )}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">{article.title}</h1>
              {article.status === 'draft' && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  Draft
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <time dateTime={article.date}>{formatDate(article.date)}</time>
              <span aria-hidden="true">•</span>
              <span>{article.readingTime.text}</span>
            </div>
          </div>
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
          showEmptyPlaceholder ? (
            <div className="not-prose rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-800/50">
              <div className="mb-3 text-4xl">📝</div>
              <p className="text-lg font-medium text-slate-600 dark:text-slate-300">
                Summary coming soon...
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                This article is still being written. Check back later for a summary!
              </p>
            </div>
          ) : (
            <MarkdownRenderer
              html={article.summary.html}
              className="prose-lg text-slate-600 dark:text-slate-300"
            />
          )
        ) : (
          <>
            <MarkdownRenderer html={article.html} />
            <ArticleNavigation
              previous={previousArticle}
              next={nextArticle}
              collectionSlug={article.collectionSlug}
            />
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
                <li key={heading.id} className={heading.level > 1 ? 'ml-4' : undefined}>
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


