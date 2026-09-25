import { getLatestBySection } from '../lib/content/content';
import { SECTIONS, type SectionId } from '../lib/content/sections';
import { articlePath } from '../lib/content/urls';
import { formatDate } from '../lib/format';
import { CardGrid } from './CardGrid';
import { ContentCard } from './ContentCard';
import { PageContainer } from './PageContainer';
import { PageHeader } from './PageHeader';

/**
 * Landing page body for Writing: header, then every essay newest first as cards.
 * The route file keeps its own `metadata` export, which Next requires per route.
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
              tags={article.tags}
            />
          ))}
        </CardGrid>
      ) : (
        <p className="text-lg text-muted-foreground">{emptyText}</p>
      )}
    </PageContainer>
  );
}
