'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { collectionPath, contentPath } from '../../lib/content/urls';

type SiblingArticle = {
    slug: string;
    title: string;
};

/** Where the article sits in its parent collection (1-based position). */
export type SeriesPosition = {
    slug: string;
    title: string;
    position: number;
    total: number;
};

type ArticleNavigationProps = {
    previous?: SiblingArticle | null;
    next?: SiblingArticle | null;
    series?: SeriesPosition | null;
};

/**
 * End-of-article navigation: a "Chapter n of m in <collection>" line, then the
 * previous/next links as outlined buttons so they read as controls rather than
 * more prose. Deliberately quiet: hairline border, arrow on the outer edge, a
 * --muted fill on hover (no accent color, no shadow).
 */
export function ArticleNavigation({ previous, next, series }: ArticleNavigationProps) {
    if (!previous && !next && !series) return null;

    return (
        <nav aria-label="Series navigation" className="not-prose mt-12 space-y-6 border-t border-border pt-8">
            {series && (
                <p className="text-sm text-muted-foreground">
                    Chapter {series.position} of {series.total} in{' '}
                    <Link
                        href={collectionPath(series.slug)}
                        className="italic text-foreground underline-offset-4 hover:underline"
                    >
                        {series.title}
                    </Link>
                </p>
            )}
            {(previous || next) && (
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4">
                    {previous ? (
                        <SiblingLink article={previous} direction="previous" />
                    ) : (
                        <div className="hidden flex-1 sm:block" />
                    )}
                    {next ? (
                        <SiblingLink article={next} direction="next" />
                    ) : (
                        <div className="hidden flex-1 sm:block" />
                    )}
                </div>
            )}
        </nav>
    );
}

function SiblingLink({ article, direction }: { article: SiblingArticle; direction: 'previous' | 'next' }) {
    const isNext = direction === 'next';
    const Arrow = isNext ? ArrowRight : ArrowLeft;

    return (
        <Link
            href={`${contentPath(article.slug)}?view=full`}
            rel={isNext ? 'next' : 'prev'}
            className={`group flex flex-1 items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:border-foreground/25 hover:bg-muted ${
                isNext ? 'flex-row-reverse text-right' : ''
            }`}
        >
            <Arrow
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:text-foreground ${
                    isNext ? 'group-hover:translate-x-0.5' : 'group-hover:-translate-x-0.5'
                }`}
                aria-hidden="true"
            />
            <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{isNext ? 'Next' : 'Previous'}</span>
                <span className="font-serif font-semibold text-foreground">{article.title}</span>
            </span>
        </Link>
    );
}
