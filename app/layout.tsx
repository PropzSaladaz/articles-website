import '../styles/globals.css';
import '../styles/markdown.css';
import '../styles/content-diagrams.css';
import Script from 'next/script';
import { AppProviders } from '../components/AppProviders';
import { SiteShell } from '../components/SiteShell';
import { getSubjectTree } from '../lib/content/content';
import 'katex/dist/katex.min.css';


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tree = await getSubjectTree();

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AppProviders>
          <SiteShell tree={tree}>
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
