'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type ViewMode = 'summary' | 'full';

type ViewPreferenceContextValue = {
  view: ViewMode;
  setView: (view: ViewMode) => void;
};

const ViewPreferenceContext = createContext<ViewPreferenceContextValue | undefined>(undefined);

const STORAGE_KEY = 'articles-site:view-mode';

function normalizeView(value: string | null, fallback: ViewMode): ViewMode {
  return value === 'summary' || value === 'full' ? value : fallback;
}

export function ViewPreferenceProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [stored, setStored] = useState<ViewMode | null>(null);

  // read from localStorage the previously selected view mode if any
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value === 'summary' || value === 'full') {
      setStored(value);
    }
  }, []);

  // default to 'full' for article pages, 'summary' otherwise
  const fallbackView = pathname?.includes('/articles/') ? 'full' : 'summary';
  // set paramView as: search param 'view' > stored value > fallback
  const paramView = normalizeView(searchParams?.get('view'), stored ?? fallbackView);

  const [view, setViewState] = useState<ViewMode>(paramView);
  const pendingRef = useRef<ViewMode | null>(null);

  // Sync view with paramView
  useEffect(() => {
    if (pendingRef.current && pendingRef.current !== paramView) {
      return;
    }
    pendingRef.current = null;
    setViewState(paramView);
  }, [paramView]);

  const setView = (nextView: ViewMode) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, nextView);
    }
    setStored(nextView);
    pendingRef.current = nextView;
    setViewState(nextView);
  };

  useEffect(() => {
    if (!pathname) return;
    if (!pendingRef.current) {
      return;
    }

    const current = searchParams?.get('view');
    if (current === view) {
      pendingRef.current = null;
      return;
    }

    const params = new URLSearchParams(searchParams?.toString());
    params.set('view', view);
    pendingRef.current = null;
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [view, pathname, router, searchParams]);

  const value = useMemo(() => ({ view, setView }), [view]);

  return <ViewPreferenceContext.Provider value={value}>{children}</ViewPreferenceContext.Provider>;
}

export function useViewPreference(): ViewPreferenceContextValue {
  const context = useContext(ViewPreferenceContext);
  if (!context) {
    throw new Error('useViewPreference must be used within ViewPreferenceProvider');
  }
  return context;
}

export type { ViewMode };
