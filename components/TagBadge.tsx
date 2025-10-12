"use client";

import Link from 'next/link';
import clsx from 'clsx';
import { useViewPreference } from './ViewPreferenceContext';

export function TagBadge({ tag, className }: { tag: string; className?: string }) {
  const { view } = useViewPreference();
  const href = `/tags/${encodeURIComponent(tag)}/?view=${view}`;
  return (
    <Link
      href={href}
      className={clsx(
        'inline-flex items-center rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
        className
      )}
    >
      #{tag}
    </Link>
  );
}
