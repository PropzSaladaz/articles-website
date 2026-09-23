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
        'inline-grid grid-cols-2 items-center gap-0.5 rounded-lg border border-border bg-muted p-0.5 text-sm',
        fullWidth ? 'w-full' : 'w-auto'
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={view === option.value}
          className={clsx(
            'rounded-md px-2.5 py-0.5 font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
            view === option.value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
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
