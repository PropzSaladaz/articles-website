import type { Metadata } from 'next';
import Link from 'next/link';
import { CardGrid } from '../../components/CardGrid';
import { ContentCard } from '../../components/ContentCard';
import { PageContainer } from '../../components/PageContainer';
import { PageHeader } from '../../components/PageHeader';
import { getCollections, getLatestBySection } from '../../lib/content/content';
import { collectionPath, articlePath } from '../../lib/content/urls';
import { SECTIONS } from '../../lib/content/sections';
import { formatDate } from '../../lib/format';

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
        <section key={project.slug} className="space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">
              <Link href={collectionPath(project.slug)} className="underline-offset-4 hover:underline">
                {project.title}
              </Link>
            </h2>
            {project.summary.text && (
              <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {project.summary.text}
              </p>
            )}
          </div>
          {entries.length > 0 && (
            <CardGrid>
              {entries.map((entry) => (
                <ContentCard
                  key={entry.slug}
                  href={articlePath(entry)}
                  title={entry.title}
                  eyebrow={`${formatDate(entry.date)} · ${entry.readingTime.text}`}
                  description={entry.description}
                  tags={entry.tags}
                />
              ))}
            </CardGrid>
          )}
        </section>
      ))}

      {otherEntries.length > 0 && (
        <section className="space-y-5">
          <h2 className="text-xl font-semibold text-foreground">Other entries</h2>
          <CardGrid>
            {otherEntries.map((entry) => (
              <ContentCard
                key={entry.slug}
                href={articlePath(entry)}
                title={entry.title}
                eyebrow={`${formatDate(entry.date)} · ${entry.readingTime.text}`}
                description={entry.description}
                tags={entry.tags}
              />
            ))}
          </CardGrid>
        </section>
      )}

      {articles.length === 0 && <p className="text-lg text-muted-foreground">No entries yet.</p>}
    </PageContainer>
  );
}
