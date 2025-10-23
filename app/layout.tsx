import '../styles/globals.css';
import '../styles/markdown.css';
import { AppProviders } from '../components/AppProviders';
import { SiteShell } from '../components/SiteShell';
import { getCollections, getSubjectTree } from '../lib/content/content';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tree, collections] = await Promise.all([
    getSubjectTree(),
    getCollections(),
  ]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <base href="/<articles-website>/"></base>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <AppProviders>
          <SiteShell tree={tree} collections={collections}>
            {children}
          </SiteShell>
        </AppProviders>
      </body>
    </html>
  );
}
