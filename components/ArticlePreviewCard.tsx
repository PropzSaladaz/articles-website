import Link from 'next/link';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { Article } from '../lib/content/types';
import { formatDate } from '../lib/format';
import { withBasePath } from '../lib/paths';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

function truncate(text: string, length: number) {
  if (text.length <= length) return text;
  const truncated = text.slice(0, length);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${truncated.slice(0, lastSpace > 0 ? lastSpace : length).trimEnd()}…`;
}

type Variant = 'default' | 'featured' | 'compact';

type ArticlePreviewCardProps = {
  article: Article;
  variant?: Variant;
  className?: string;
  style?: CSSProperties;
};

export function ArticlePreviewCard({ article, variant = 'default', className, style }: ArticlePreviewCardProps) {
  const href = article.collectionSlug ? `/collections/${article.slug}/` : `/articles/${article.slug}/`;
  const summary = article.summary;
  const excerptLength = variant === 'featured' ? 220 : variant === 'compact' ? 140 : 160;
  const excerpt = truncate(summary.text, excerptLength);

  const variantClasses: Record<Variant, string> = {
    default: 'gap-5 p-6 sm:p-7',
    featured: 'gap-6 p-6 sm:p-8 md:items-stretch md:gap-10',
    compact: 'gap-4 p-5 sm:p-6',
  };

  const titleClasses: Record<Variant, string> = {
    default:
      'text-2xl font-semibold leading-tight text-foreground transition-colors group-hover:text-primary dark:text-foreground',
    featured:
      'text-3xl font-semibold leading-snug text-foreground transition-colors group-hover:text-primary dark:text-foreground',
    compact:
      'text-xl font-semibold leading-snug text-foreground transition-colors group-hover:text-primary dark:text-foreground',
  };

  const excerptClasses: Record<Variant, string> = {
    default: 'text-base text-muted-foreground',
    featured: 'text-base text-muted-foreground',
    compact: 'text-sm text-muted-foreground',
  };

  return (
    <Card
      style={style}
      className={cn(
        'group relative flex flex-col overflow-hidden border-border transition-all duration-300 hover:shadow-xl',
        variant === 'featured' && 'md:flex-row',
        className
      )}
    >
      {variant === 'featured' && article.cover && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted/60 md:w-1/2">
          {
            article.cover &&
            <Image // only show image if it exists
              src={withBasePath(article.cover)}
              alt={article.title}
              fill
              className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
              sizes="(min-width: 768px) 50vw, 100vw"
              priority
            />
          }

        </div>
      )}
      <CardContent className={cn('flex flex-1 flex-col', variantClasses[variant])}>
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Article
            </span>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <time dateTime={article.date}>{formatDate(article.date)}</time>
              <span aria-hidden="true">•</span>
              <span>{article.readingTime.text}</span>
            </div>
          </div>
          <Link href={href} className={titleClasses[variant]}>
            {article.title}
          </Link>
        </header>
        <p className={cn('text-balance', excerptClasses[variant])}>{excerpt}</p>
        <div className="mt-auto pt-4">
          <Link
            href={href}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all duration-200 group-hover:gap-3"
          >
            Read
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}


