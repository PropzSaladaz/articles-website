import type { Metadata } from 'next';
import { getLatestBySection } from '../../lib/content/content';
import { SECTIONS } from '../../lib/content/sections';
import { SectionHeader } from '../../components/SectionHeader';
import { ArticlePreviewCard } from '../../components/ArticlePreviewCard';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const section = SECTIONS.devlog;

export const metadata: Metadata = {
  title: section.label,
  description: section.tagline,
};

export default async function DevlogLandingPage() {
  const articles = await getLatestBySection('devlog');

  return (
    <div className="space-y-12">
      <SectionHeader section={section} />

      {articles.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {articles.map((article) => (
            <ArticlePreviewCard key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <p className="text-lg text-muted-foreground">No entries yet.</p>
      )}
    </div>
  );
}
