'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ArticlePreview } from '../lib/content/types';
import { articlePath } from '../lib/content/urls';
import { formatDate } from '../lib/format';
import { cn } from '../lib/utils';

type SectionListNavProps = {
  label: string;
  articles: ArticlePreview[];
};

/**
 * The sidebar nav for reverse-chronological sections (writing, devlog) — a flat,
 * dated link list, standing in for `<TreeNavigation>`, which assumes a curriculum
 * hierarchy that dated entries don't have.
 */
export function SectionListNav({ label, articles }: SectionListNavProps) {
  const pathname = usePathname();

  if (articles.length === 0) {
    return (
      <p className="px-2 py-1 text-sm text-muted-foreground/70">
        No {label.toLowerCase()} entries yet.
      </p>
    );
  }

  return (
    <nav aria-label={`${label} navigation`} className="space-y-1">
      {articles.map((article) => {
        const href = articlePath(article);
        const isActive = pathname === href;

        return (
          <Link
            key={article.slug}
            href={href}
            className={cn(
              'flex flex-col gap-0.5 rounded-md px-2 py-1.5 text-sm transition-colors',
              isActive
                ? 'bg-primary/[0.08] font-semibold text-primary/80 border-l-2 border-primary/70'
                : 'text-muted-foreground/70 hover:text-foreground'
            )}
          >
            <span className="truncate">{article.title}</span>
            <span className="text-xs text-muted-foreground/60">{formatDate(article.date)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
