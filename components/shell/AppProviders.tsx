'use client';

import { ThemeProvider } from 'next-themes';
import { Suspense } from 'react';
import { ViewPreferenceProvider } from './ViewPreferenceContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <Suspense fallback={null}>
        <ViewPreferenceProvider>{children}</ViewPreferenceProvider>
      </Suspense>
    </ThemeProvider>
  );
}
