'use client';

import { useMemo } from 'react';
import clsx from 'clsx';
import { useViewPreference } from './ViewPreferenceContext';

const options = [
  { value: 'summary', label: 'Summary' },
  { value: 'full', label: 'Full' },
] as const;

export function ArticleViewToggle() {
  const { view, setView } = useViewPreference();

  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={clsx(
            'rounded-full px-3 py-1 font-medium transition-colors',
            view === option.value
              ? 'bg-blue-600 text-white shadow dark:bg-blue-500'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
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
