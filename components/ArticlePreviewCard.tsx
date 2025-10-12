import Link from 'next/link';
import Image from 'next/image';
import { Article } from '../lib/content';
import { formatDate } from '../lib/format';
import { TagBadge } from './TagBadge';
import { withBasePath } from '../lib/paths';

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
};

export function ArticlePreviewCard({ article, variant = 'default', className }: ArticlePreviewCardProps) {
  const href = withBasePath(`/articles/${article.slug}/`);
  const summary = article.summary.trim();
  const excerptLength = variant === 'featured' ? 220 : variant === 'compact' ? 140 : 160;
  const excerpt = truncate(summary || article.content, excerptLength);

  const baseClasses =
    'group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm transition hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/70';

  const variantClasses: Record<Variant, string> = {
    default: 'gap-5',
    featured: 'gap-6 md:flex-row md:items-stretch md:p-8 md:gap-8',
    compact: 'gap-3 p-4',
  };

  const titleClasses: Record<Variant, string> = {
    default: 'text-2xl font-semibold text-slate-900 transition-colors hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400',
    featured:
      'text-3xl font-semibold text-slate-900 transition-colors hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400',
    compact:
      'text-xl font-semibold text-slate-900 transition-colors hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400',
  };

  const excerptClasses: Record<Variant, string> = {
    default: 'text-base text-slate-600 dark:text-slate-300',
    featured: 'text-base text-slate-600 dark:text-slate-300',
    compact: 'text-sm text-slate-600 dark:text-slate-400',
  };

  const showTags = variant !== 'compact';

  return (
    <article className={[baseClasses, variantClasses[variant], className].filter(Boolean).join(' ')}>
      {variant === 'featured' && article.cover && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 md:w-1/2">
          <Image
            src={withBasePath(article.cover)}
            alt={article.title}
            fill
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-4">
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
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
        <div className="mt-auto">
          <Link
            href={href}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:gap-3 dark:text-blue-400"
          >
            Continue reading
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </article>
  );
}
