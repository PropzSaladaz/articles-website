'use client';

import { useMemo } from 'react';
import clsx from 'clsx';
import { useViewPreference } from './ViewPreferenceContext';

const options = [
  { value: 'summary', label: 'Summary' },
  { value: 'full', label: 'Full' },
] as const;

export function ArticleViewToggle({ fullWidth = false }: { fullWidth?: boolean } = {}) {
  const { view, setView } = useViewPreference();

  return (
    <div
      role="group"
      aria-label="Article view mode"
      className={clsx(
        'inline-grid grid-cols-2 items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100/80 p-1 text-sm dark:border-slate-700 dark:bg-slate-800/70',
        fullWidth ? 'w-full' : 'w-auto'
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={view === option.value}
          className={clsx(
            'rounded-lg px-3 py-1.5 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            view === option.value
              ? 'bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/60'
              : 'text-slate-600 hover:bg-white/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700/70 dark:hover:text-slate-100'
          )}
          onClick={() => setView(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function GlobalViewToggle() {
  return <ArticleViewToggle />;
}

export function useIsSummaryView() {
  const { view } = useViewPreference();
  return useMemo(() => view === 'summary', [view]);
}
