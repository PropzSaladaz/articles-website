import '../styles/globals.css';
import '../styles/markdown.css';
import '../styles/content-diagrams.css';
import Script from 'next/script';
import { Source_Serif_4 } from 'next/font/google';
import { AppProviders } from '../components/AppProviders';
import { SiteShell } from '../components/SiteShell';
import { getLatestBySection, getSubjectTree } from '../lib/content/content';
import 'katex/dist/katex.min.css';

// Reading typeface for article bodies and titles (the UI stays sans).
// Self-hosted by next/font at build time; exposed as --font-serif.
const serif = Source_Serif_4({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  axes: ['opsz'],
  display: 'swap',
  variable: '--font-serif',
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tree, writingArticles, devlogArticles] = await Promise.all([
    getSubjectTree(),
    getLatestBySection('writing'),
    getLatestBySection('devlog'),
  ]);

  return (
    <html lang="en" className={serif.variable} suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AppProviders>
          <SiteShell tree={tree} sectionArticles={{ writing: writingArticles, devlog: devlogArticles }}>
            {children}
          </SiteShell>
        </AppProviders>
        <Script
          type="module"
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token":"4b9d3e16e95141999b5f3b72ceb13063","spa":true}'
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
