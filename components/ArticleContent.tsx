'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Article, KnowledgePathItem } from '../lib/content/types';
import Image from 'next/image';
import Link from 'next/link';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ArticleViewToggle, useIsSummaryView } from './ArticleViewToggle';
import { formatDate } from '../lib/format';
import { collectionPath } from '../lib/content/urls';
import { GiscusComments } from './GiscusComments';
import { ArticleNavigation, type SeriesPosition } from './ArticleNavigation';
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
  series,
  collectionSlugs = [],
}: {
  article: Article;
  knowledgePath?: KnowledgePathItem[];
  previousArticle?: SiblingArticle | null;
  nextArticle?: SiblingArticle | null;
  series?: SeriesPosition | null;
  collectionSlugs?: string[];
}) {
  const isSummary = useIsSummaryView();
  const showEmptyPlaceholder = isSummary && isSummaryEmpty(article.summary);
  const [revealDurationMs, setRevealDurationMs] = useState(450);
  const transitionRef = useRef<HTMLDivElement | null>(null);
  const collectionSlugSet = new Set(collectionSlugs);
  // The path ends at the article itself, which the <h1> right below already
  // names — show only its ancestors.
  const breadcrumb =
    knowledgePath.at(-1)?.slug === article.slug ? knowledgePath.slice(0, -1) : knowledgePath;

  useLayoutEffect(() => {
    const element = transitionRef.current;
    if (!element) return;

    // Keep reveal speed roughly constant across short/long content.
    const contentHeight = element.scrollHeight;
    const pixelsPerSecond = 1400;
    const nextDuration = Math.round((contentHeight / pixelsPerSecond) * 1000);
    const clampedDuration = Math.min(1400, Math.max(260, nextDuration));
    setRevealDurationMs(clampedDuration);
  }, [isSummary]);

  const revealStyle = {
    ['--reveal-duration' as string]: `${revealDurationMs}ms`,
  } as CSSProperties;

  return (
    <>
      {/* Reading progress bar - only show in full view */}
      {!isSummary && <ReadingProgressBar contentSelector="article" />}

      {/* The reading column is capped at ~70 characters per line; the TOC only
          gets its own column on xl screens, where there is real spare margin. */}
      <div className="grid gap-6 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_200px] xl:gap-12">
        <div className="reading-shell mx-auto w-full min-w-0 max-w-[720px] py-6 text-foreground sm:py-10 lg:py-12">
          <article className="prose prose-semantic prose-base min-w-0 max-w-none text-foreground sm:prose-lg">
            <header className="not-prose mb-12 flex flex-col gap-4">
              {breadcrumb.length > 0 && (
                <nav aria-label="Knowledge path" className="mb-2">
                  <ol className="flex flex-wrap items-center gap-1.5 text-sm leading-none text-muted-foreground/80">
                    {breadcrumb.map((node, index) => {
                      const isLast = index === breadcrumb.length - 1;
                      return (
                        <li key={node.slug} className="flex items-center gap-1.5">
                          {collectionSlugSet.has(node.slug) ? (
                            <Link
                              href={collectionPath(node.slug)}
                              className="transition-colors hover:text-foreground"
                            >
                              {node.title}
                            </Link>
                          ) : (
                            <span>
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
                  <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{article.title}</h1>
                  {article.status === 'draft' && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      Draft
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-3">
                    <time dateTime={article.date}>{formatDate(article.date)}</time>
                    <span aria-hidden="true">•</span>
                    <span>{article.readingTime.text}</span>
                  </div>
                  {/* Below xl there is no side column; the toggle lives here instead. */}
                  <div className="xl:hidden">
                    <ArticleViewToggle />
                  </div>
                </div>
              </div>
            </header>
            <div
              ref={transitionRef}
              key={isSummary ? 'summary' : 'full'}
              className="animate-reveal-down motion-reduce:animate-none"
              style={revealStyle}
            >
              {isSummary ? (
                showEmptyPlaceholder ? (
                  <p className="not-prose text-muted-foreground">
                    No summary for this one yet. Switch to Full to read the article.
                  </p>
                ) : (
                  <MarkdownRenderer
                    html={article.summary.html}
                    className="prose-base text-muted-foreground sm:prose-lg"
                  />
                )
              ) : (
                <>
                  {article.cover && (
                    <figure className="not-prose overflow-hidden rounded-3xl border border-border shadow-sm">
                      <Image
                        src={article.cover}
                        alt={article.title}
                        width={1200}
                        height={630}
                        className="h-auto w-full object-cover"
                        priority
                      />
                    </figure>
                  )}
                  <MarkdownRenderer html={article.html} />
                  <ArticleNavigation previous={previousArticle} next={nextArticle} series={series} />
                  <section className="not-prose mt-12 space-y-6">
                    <h2 className="font-serif text-2xl font-semibold text-foreground">Comments</h2>
                    <GiscusComments discussionIdentifier={article.slug} />
                  </section>
                </>
              )}
            </div>
          </article>
        </div>
        <aside className="hidden xl:block sticky top-[88px] self-start max-h-[calc(100vh-104px)] overflow-y-auto pt-12">
          <div className="space-y-8">
            <ArticleViewToggle fullWidth />
            {!isSummary && article.headings.length > 0 && (
              <TableOfContents headings={article.headings} />
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
