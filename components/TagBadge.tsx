"use client";

import Link from 'next/link';
import { cn } from '../lib/utils';
import { useViewPreference } from './ViewPreferenceContext';

export function TagBadge({ tag, className }: { tag: string; className?: string }) {
  const { view } = useViewPreference();
  const href = `/tags/${encodeURIComponent(tag)}/?view=${view}`;
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border/80 bg-secondary/70 px-3 py-1 text-xs font-medium text-muted-foreground transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:bg-primary/10 hover:text-primary',
        className
      )}
    >
      #{tag}
    </Link>
  );
}
