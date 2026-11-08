import type { Metadata } from 'next';
import Link from 'next/link';
import { ArticleCard } from '../../components/page/ArticleCard';
import { CardSection } from '../../components/page/CardSection';
import { PageContainer } from '../../components/page/PageContainer';
import { PageHeader } from '../../components/page/PageHeader';
import { getCollections, getLatestBySection } from '../../lib/content/content';
import { collectionPath } from '../../lib/content/urls';
import { SECTIONS } from '../../lib/content/sections';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const section = SECTIONS.devlog;

export const metadata: Metadata = {
  title: section.label,
  description: section.tagline,
};

export default async function DevlogLandingPage() {
  const [collections, articles] = await Promise.all([
    getCollections(),
    getLatestBySection('devlog'),
  ]);

  // A direct child collection under /devlog is a project. Keep its dated entries
  // together here; the collection page itself contains the project overview.
  const projects = collections
    .filter((collection) => collection.slug.startsWith('devlog/') && collection.slug.split('/').length === 2)
    .map((project) => ({
      project,
      entries: articles.filter((article) => article.slug.startsWith(`${project.slug}/`)),
    }))
    .sort((a, b) => {
      const aDate = a.entries[0]?.date ?? '';
      const bDate = b.entries[0]?.date ?? '';
      return bDate.localeCompare(aDate) || a.project.title.localeCompare(b.project.title);
    });

  const groupedSlugs = new Set(projects.flatMap(({ entries }) => entries.map((entry) => entry.slug)));
  const otherEntries = articles.filter((article) => !groupedSlugs.has(article.slug));

  return (
    <PageContainer>
      <PageHeader title={section.label} description={section.tagline} />

      {projects.map(({ project, entries }) => (
        <CardSection
          key={project.slug}
          title={
            <Link href={collectionPath(project.slug)} className="underline-offset-4 hover:underline">
              {project.title}
            </Link>
          }
          caption={project.summary.text || undefined}
        >
          {entries.map((entry) => (
            <ArticleCard key={entry.slug} article={entry} />
          ))}
        </CardSection>
      ))}

      {otherEntries.length > 0 && (
        <CardSection title="Other entries">
          {otherEntries.map((entry) => (
            <ArticleCard key={entry.slug} article={entry} />
          ))}
        </CardSection>
      )}

      {articles.length === 0 && <p className="text-lg text-muted-foreground">No entries yet.</p>}
    </PageContainer>
  );
}
