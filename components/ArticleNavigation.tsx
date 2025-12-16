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
        <nav className="not-prose mt-12 flex flex-col gap-4 border-t border-slate-200 pt-8 dark:border-slate-700 sm:flex-row sm:justify-between">
            {previous ? (
                <Link
                    href={`${baseUrl}${previous.slug}/?view=full`}
                    className="group flex flex-1 flex-col gap-1 rounded-xl border border-slate-200 p-4 transition-all hover:border-primary/50 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-primary/50 dark:hover:bg-slate-800/50"
                >
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        ← Previous
                    </span>
                    <span className="font-semibold text-slate-900 transition-colors group-hover:text-primary dark:text-slate-100">
                        {previous.title}
                    </span>
                </Link>
            ) : (
                <div className="flex-1" />
            )}
            {next ? (
                <Link
                    href={`${baseUrl}${next.slug}/?view=full`}
                    className="group flex flex-1 flex-col gap-1 rounded-xl border border-slate-200 p-4 text-right transition-all hover:border-primary/50 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-primary/50 dark:hover:bg-slate-800/50"
                >
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Next →
                    </span>
                    <span className="font-semibold text-slate-900 transition-colors group-hover:text-primary dark:text-slate-100">
                        {next.title}
                    </span>
                </Link>
            ) : (
                <div className="flex-1" />
            )}
        </nav>
    );
}
