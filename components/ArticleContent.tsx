'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Article, KnowledgePathItem } from '../lib/content/types';
import Image from 'next/image';
import Link from 'next/link';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ArticleViewToggle, useIsSummaryView } from './ArticleViewToggle';
import { formatDate } from '../lib/format';
import { withBasePath } from '../lib/paths';
import { GiscusComments } from './GiscusComments';
import { ArticleNavigation } from './ArticleNavigation';
import { cn } from '../lib/utils';
import { ReadingProgressBar, TableOfContents } from './ReadingProgress';

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
  collectionSlugs = [],
}: {
  article: Article;
  knowledgePath?: KnowledgePathItem[];
  previousArticle?: SiblingArticle | null;
  nextArticle?: SiblingArticle | null;
  collectionSlugs?: string[];
}) {
  const isSummary = useIsSummaryView();
  const showEmptyPlaceholder = isSummary && isSummaryEmpty(article.summary);
  const [viewTransitionKey, setViewTransitionKey] = useState(0);
  const [revealDurationMs, setRevealDurationMs] = useState(450);
  const transitionRef = useRef<HTMLDivElement | null>(null);
  const collectionSlugSet = new Set(collectionSlugs);

  useEffect(() => {
    setViewTransitionKey((prev) => prev + 1);
  }, [isSummary]);

  useLayoutEffect(() => {
    const element = transitionRef.current;
    if (!element) return;

    // Keep reveal speed roughly constant across short/long content.
    const contentHeight = element.scrollHeight;
    const pixelsPerSecond = 1400;
    const nextDuration = Math.round((contentHeight / pixelsPerSecond) * 1000);
    const clampedDuration = Math.min(1400, Math.max(260, nextDuration));
    setRevealDurationMs(clampedDuration);
  }, [viewTransitionKey]);

  const revealStyle = {
    ['--reveal-duration' as string]: `${revealDurationMs}ms`,
  } as CSSProperties;

  return (
    <>
      {/* Reading progress bar - only show in full view */}
      {!isSummary && <ReadingProgressBar contentSelector="article" />}

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
        <div className="reading-shell rounded-2xl border border-slate-200 bg-white px-4 py-6 shadow-md dark:border-slate-700/30 dark:bg-slate-900/50 dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)] sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <article className="prose prose-base sm:prose-lg prose-slate max-w-none dark:prose-invert">
            <header className="not-prose mb-8 flex flex-col gap-4">
              {knowledgePath.length > 0 && (
                <nav aria-label="Knowledge path" className="mb-2">
                  <ol className="flex flex-wrap items-center gap-1.5 text-sm leading-none text-muted-foreground/80">
                    {knowledgePath.map((node, index) => {
                      const isLast = index === knowledgePath.length - 1;
                      return (
                        <li key={node.slug} className="flex items-center gap-1.5">
                          {!isLast && collectionSlugSet.has(node.slug) ? (
                            <Link
                              href={`/collections/${node.slug}/`}
                              className="transition-colors hover:text-foreground"
                            >
                              {node.title}
                            </Link>
                          ) : (
                            <span className={cn("transition-colors", isLast ? "font-semibold text-foreground" : "hover:text-foreground")}>
                              {node.title}
                            </span>
                          )}
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
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">{article.title}</h1>
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
            <div
              ref={transitionRef}
              key={`${isSummary ? 'summary' : 'full'}-${viewTransitionKey}`}
              className="animate-reveal-down motion-reduce:animate-none"
              style={revealStyle}
            >
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
                    className="prose-base sm:prose-lg text-slate-600 dark:text-slate-300"
                  />
                )
              ) : (
                <>
                  {article.cover && (
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
            </div>
          </article>
        </div>
        <aside className="hidden lg:block sticky top-[88px] self-start max-h-[calc(100vh-104px)] overflow-y-auto lg:pr-4">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Article view
              </p>
              <div className="mt-3">
                <ArticleViewToggle fullWidth />
              </div>
            </div>
            {!isSummary && article.headings.length > 0 && (
              <TableOfContents headings={article.headings} />
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
