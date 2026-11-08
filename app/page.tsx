import type { Metadata } from 'next';
import { BookOpen, Hammer, PenLine } from 'lucide-react';
import { getLatestBySection } from '../lib/content/content';
import { SECTIONS, SECTION_LIST, sectionOf, type SectionId } from '../lib/content/sections';
import { articlePath, contentPath } from '../lib/content/urls';
import { formatDate, pluralize } from '../lib/format';
import { CardSection } from '../components/page/CardSection';
import { ContentCard } from '../components/page/ContentCard';
import { PageContainer } from '../components/page/PageContainer';
import { PageHeader } from '../components/page/PageHeader';
import type { IconStyle } from '../components/page/subjectIcons';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const RECENT_LIMIT = 6;

const bio =
  "Hi, I'm Sidnei Teixeira — a software engineer working through graphics, cryptography, " +
  'and DSP one concept at a time.';

export const metadata: Metadata = {
  title: 'Sidnei Teixeira',
  description: bio,
};

/**
 * Icon, tint and entry noun per section. Lives here rather than in `sections.ts`,
 * which must stay dependency-free for the Worker bundle.
 */
const SECTION_STYLES: Record<SectionId, IconStyle & { noun: [string, string] }> = {
  notes: { icon: BookOpen, accent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400', noun: ['note', 'notes'] },
  writing: {
    icon: PenLine,
    accent: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    noun: ['essay', 'essays'],
  },
  devlog: {
    icon: Hammer,
    accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    noun: ['entry', 'entries'],
  },
};

export default async function HomePage() {
  const perSection = await Promise.all(SECTION_LIST.map((section) => getLatestBySection(section.id)));
  const sectionLatest = perSection.flatMap((articles) => articles.slice(0, 1));
  const includedSlugs = new Set(sectionLatest.map((article) => article.slug));
  const remainingRecent = perSection
    .flat()
    .filter((article) => !includedSlugs.has(article.slug))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, Math.max(0, RECENT_LIMIT - sectionLatest.length));
  const recent = [...sectionLatest, ...remainingRecent].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <PageContainer>
      <PageHeader title="Sidnei Teixeira" description={bio} size="large" />

      <CardSection title="Sections" columns={3}>
        {SECTION_LIST.map((section, index) => {
          const style = SECTION_STYLES[section.id];
          const count = perSection[index].length;
          return (
            <ContentCard
              key={section.id}
              href={count > 0 ? contentPath(section.id) : undefined}
              title={section.label}
              eyebrow={count > 0 ? pluralize(count, ...style.noun) : 'Coming soon'}
              description={section.tagline}
              iconStyle={style}
            />
          );
        })}
      </CardSection>

      {recent.length > 0 && (
        <CardSection title="Recent">
          {recent.map((article) => {
            const section = sectionOf(article.slug);
            return (
              <ContentCard
                key={article.slug}
                href={articlePath(article)}
                title={article.title}
                eyebrow={[formatDate(article.date), section && SECTIONS[section].label].filter(Boolean).join(' · ')}
                description={article.description}
              />
            );
          })}
        </CardSection>
      )}
    </PageContainer>
  );
}
