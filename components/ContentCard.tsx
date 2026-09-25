import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '../lib/utils';
import { IconBadge } from './IconBadge';
import { TagList } from './TagList';
import type { IconStyle } from './subjectIcons';

type ContentCardProps = {
  /** Omit for a card with nowhere to go yet (e.g. an empty section): it renders static and dimmed. */
  href?: string;
  title: string;
  /** Short meta line, e.g. "Collection · 5 chapters" or "May 2, 2026 · 6 min read". */
  eyebrow?: string;
  description?: string;
  tags?: readonly string[];
  /**
   * Position in an ordered run (a collection's chapters). Switches to the row layout:
   * the number in a circle on the left, then title, summary and the meta line.
   */
  number?: number;
  iconStyle?: IconStyle;
  className?: string;
};

const cardClasses = 'rounded-xl border border-border bg-card p-5';

// The lift is motion-safe: reduced-motion visitors still get the border + shadow change.
const linkClasses =
  'group transition-all duration-200 motion-safe:hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md';

/** The card's outer box: a whole-card link, or a static dimmed box when there is no href. */
function CardShell({ href, className, children }: { href?: string; className: string; children: ReactNode }) {
  if (!href) {
    return <div className={cn(cardClasses, 'opacity-60', className)}>{children}</div>;
  }
  return (
    <Link href={href} className={cn(cardClasses, linkClasses, className)}>
      {children}
    </Link>
  );
}

const titleClasses =
  'font-serif text-xl leading-snug text-foreground transition-colors group-hover:text-primary';

const eyebrowClasses = 'text-xs font-medium uppercase tracking-wide text-muted-foreground';

/** The site's one card: serif title and clamped summary, usually as a whole-card link. */
export function ContentCard({ href, title, eyebrow, description, tags, number, iconStyle, className }: ContentCardProps) {
  if (number !== undefined) {
    return (
      <CardShell href={href} className={cn('flex items-center gap-4', className)}>
        {/* aria-hidden: position is announced by the surrounding <ol>, not read into the link name. */}
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--link)/0.12)] font-serif text-lg font-semibold tabular-nums text-[hsl(var(--link))]"
        >
          {number}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className={titleClasses}>{title}</span>
          {description && <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{description}</p>}
          {eyebrow && <span className={eyebrowClasses}>{eyebrow}</span>}
          <TagList tags={tags} />
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell href={href} className={cn('flex flex-col gap-2', className)}>
      {(iconStyle || eyebrow) && (
        <span className="flex items-center gap-3">
          {iconStyle && <IconBadge style={iconStyle} size="sm" />}
          {eyebrow && <span className={eyebrowClasses}>{eyebrow}</span>}
        </span>
      )}
      <span className={titleClasses}>{title}</span>
      {description && <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      <TagList tags={tags} />
    </CardShell>
  );
}
