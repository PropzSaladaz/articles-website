import { getLatestBySection } from '../lib/content/content';
import { SECTIONS, type SectionId } from '../lib/content/sections';
import { articlePath } from '../lib/content/urls';
import { formatDate } from '../lib/format';
import { CardGrid } from './CardGrid';
import { ContentCard } from './ContentCard';
import { PageContainer } from './PageContainer';
import { PageHeader } from './PageHeader';

/**
 * Landing page body for a date-ordered section (writing, devlog): header, then every
 * entry newest first as cards. Route files keep their own `metadata` export, which
 * Next requires per route.
 */
export async function ChronologicalSectionPage({ sectionId, emptyText }: { sectionId: SectionId; emptyText: string }) {
  const section = SECTIONS[sectionId];
  const articles = await getLatestBySection(sectionId);

  return (
    <PageContainer>
      <PageHeader title={section.label} description={section.tagline} />

      {articles.length > 0 ? (
        <CardGrid>
          {articles.map((article) => (
            <ContentCard
              key={article.slug}
              href={articlePath(article)}
              title={article.title}
              eyebrow={`${formatDate(article.date)} · ${article.readingTime.text}`}
              description={article.description}
            />
          ))}
        </CardGrid>
      ) : (
        <p className="text-lg text-muted-foreground">{emptyText}</p>
      )}
    </PageContainer>
  );
}
