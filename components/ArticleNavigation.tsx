'use client';

import Link from 'next/link';

type SiblingArticle = {
    slug: string;
    title: string;
};

type ArticleNavigationProps = {
    previous?: SiblingArticle | null;
    next?: SiblingArticle | null;
    collectionSlug?: string | null;
};

export function ArticleNavigation({ previous, next, collectionSlug }: ArticleNavigationProps) {
    if (!previous && !next) return null;

    const baseUrl = collectionSlug ? '/collections/' : '/articles/';

    return (
        <nav className="not-prose mt-12 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:justify-between">
            {previous ? (
                <Link
                    href={`${baseUrl}${previous.slug}/?view=full`}
                    className="group flex flex-1 flex-col gap-1 rounded-xl border border-border p-4 transition-all hover:border-foreground/20 hover:bg-muted/50"
                >
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        ← Previous
                    </span>
                    <span className="font-semibold text-foreground transition-colors group-hover:text-primary">
                        {previous.title}
                    </span>
                </Link>
            ) : (
                <div className="flex-1" />
            )}
            {next ? (
                <Link
                    href={`${baseUrl}${next.slug}/?view=full`}
                    className="group flex flex-1 flex-col gap-1 rounded-xl border border-border p-4 text-right transition-all hover:border-foreground/20 hover:bg-muted/50"
                >
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Next →
                    </span>
                    <span className="font-semibold text-foreground transition-colors group-hover:text-primary">
                        {next.title}
                    </span>
                </Link>
            ) : (
                <div className="flex-1" />
            )}
        </nav>
    );
}
