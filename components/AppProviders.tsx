'use client';

import { ThemeProvider } from 'next-themes';
import { ViewPreferenceProvider } from './ViewPreferenceContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system">
      <ViewPreferenceProvider>{children}</ViewPreferenceProvider>
    </ThemeProvider>
  );
}
