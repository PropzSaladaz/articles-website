import './globals.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ViewPreferenceProvider } from '../components/ViewPreferenceContext';
import { GlobalViewToggle } from '../components/ArticleViewToggle';
import { getBasePath } from '../lib/paths';

export const metadata: Metadata = {
  title: {
    default: 'Static Articles',
    template: '%s | Static Articles',
  },
  description: 'A static Next.js knowledge base with full and summarized views.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <ViewPreferenceProvider>
          <div className="flex min-h-screen flex-col">
            <header className="border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
              <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-5">
                <Link href={`${getBasePath()}/`} className="text-xl font-semibold">
                  Static Articles
                </Link>
                <GlobalViewToggle />
              </div>
            </header>
            <main className="flex-1">
              <div className="mx-auto w-full max-w-5xl px-4 py-8">{children}</div>
            </main>
            <footer className="border-t border-slate-200 bg-white/70 py-6 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/70">
              <div className="mx-auto flex w-full max-w-5xl justify-between px-4">
                <span>© {new Date().getFullYear()} Static Articles</span>
                <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
                  Built with Next.js
                </a>
              </div>
            </footer>
          </div>
        </ViewPreferenceProvider>
      </body>
    </html>
  );
}
