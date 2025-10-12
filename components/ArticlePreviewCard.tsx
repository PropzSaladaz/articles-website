import Link from 'next/link';
import Image from 'next/image';
import type { CSSProperties } from 'react';
import { Article } from '../lib/content';
import { formatDate } from '../lib/format';
import { TagBadge } from './TagBadge';
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
  const href = `/articles/${article.slug}/`;
  const summary = article.summary;
  const excerptLength = variant === 'featured' ? 220 : variant === 'compact' ? 140 : 160;
  const excerpt = truncate(summary.text, excerptLength);

  const variantClasses: Record<Variant, string> = {
    default: 'gap-5 p-6',
    featured: 'gap-6 p-6 md:flex-row md:items-stretch md:p-8 md:gap-8',
    compact: 'gap-3 p-4',
  };

  const titleClasses: Record<Variant, string> = {
    default:
      'text-2xl font-semibold text-foreground transition-colors group-hover:text-primary dark:text-foreground',
    featured:
      'text-3xl font-semibold text-foreground transition-colors group-hover:text-primary dark:text-foreground',
    compact:
      'text-xl font-semibold text-foreground transition-colors group-hover:text-primary dark:text-foreground',
  };

  const excerptClasses: Record<Variant, string> = {
    default: 'text-base text-muted-foreground',
    featured: 'text-base text-muted-foreground',
    compact: 'text-sm text-muted-foreground',
  };

  const showTags = variant !== 'compact';

  return (
    <Card
      style={style}
      className={cn(
        'group relative flex flex-col overflow-hidden border-border/70 bg-card/80 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-glow',
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-primary/70 before:via-primary/40 before:to-transparent before:opacity-0 before:transition before:duration-500 before:content-["\00a0"] group-hover:before:opacity-100',
        variant === 'featured' && 'md:flex-row',
        className
      )}
    >
      {variant === 'featured' && article.cover && (
        <div className="relative aspect-[4/3] overflow-hidden bg-muted md:w-1/2">
          <Image
            src={withBasePath(article.cover)}
            alt={article.title}
            fill
            className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-105"
            sizes="(min-width: 768px) 50vw, 100vw"
            priority
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
      )}
      <CardContent className={cn('flex flex-1 flex-col', variantClasses[variant])}>
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <time dateTime={article.date}>{formatDate(article.date)}</time>
            <span aria-hidden="true">•</span>
            <span>{article.readingTime.text}</span>
          </div>
          <Link href={href} className={titleClasses[variant]}>
            {article.title}
          </Link>
        </header>
        <p className={excerptClasses[variant]}>{excerpt}</p>
        {showTags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        )}
        <div className="mt-auto pt-2">
          <Link
            href={href}
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all duration-300 group-hover:gap-3"
          >
            Continue reading
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
