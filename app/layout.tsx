'use client';

import '../styles/globals.css';
import '../styles/markdown.css';
import Link from 'next/link';
import { ViewPreferenceProvider } from '../components/ViewPreferenceContext';
import { getBasePath } from '../lib/paths';
import { ThemeProvider } from 'next-themes';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system">
          <ViewPreferenceProvider>
            <div className="relative flex min-h-screen flex-col">
              <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-5">
                  <Link href={`${getBasePath()}/`} className="text-xl font-semibold tracking-tight">
                    Sid Makes Sense
                  </Link>
                  <span className="hidden text-sm font-medium text-muted-foreground sm:inline-flex">
                    Personal blog by Sidnei Teixeira
                  </span>
                </div>
              </header>
              <main className="flex-1">
                <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">{children}</div>
              </main>
              <footer className="border-t border-border/60 bg-background/70 py-8 backdrop-blur-xl">
                <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span>© {new Date().getFullYear()} Sidnei Teixeira. All rights reserved.</span>
                  <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-muted-foreground/80">
                    Built with care
                  </span>
                </div>
              </footer>
            </div>
          </ViewPreferenceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
