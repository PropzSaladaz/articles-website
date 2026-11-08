import type { Metadata } from 'next';
import {
  getArticleBySlug,
  getCollectionBySlug,
  getLatestBySection,
  getSubjectTree,
} from '../../lib/content/content';
import { SECTIONS } from '../../lib/content/sections';
import { articlePath, contentPath } from '../../lib/content/urls';
import { NodeKind, type SubjectNode } from '../../lib/content/types';
import { formatDate, pluralize } from '../../lib/format';
import { CardSection } from '../../components/page/CardSection';
import { ContentCard } from '../../components/page/ContentCard';
import { PageContainer } from '../../components/page/PageContainer';
import { PageHeader } from '../../components/page/PageHeader';
import { subjectStyle } from '../../components/page/subjectIcons';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const section = SECTIONS.notes;

export const metadata: Metadata = {
  title: section.label,
  description: section.tagline,
};

type TopicGroup = { title: string; slug: string; items: SubjectNode[] };

type TopicCard = { slug: string; title: string; eyebrow: string; description?: string };

/** Summary + size for one navigable node, read from the full content models. */
async function toTopicCard(node: SubjectNode): Promise<TopicCard> {
  if (node.kind === NodeKind.CollectionArticle) {
    const collection = await getCollectionBySlug(node.slug);
    const chapters = collection?.totalArticles ?? node.articlesCount ?? 0;
    return {
      slug: node.slug,
      title: node.title,
      eyebrow: `Collection · ${pluralize(chapters, 'chapter')}`,
      description: collection?.summary.text,
    };
  }
  const article = await getArticleBySlug(node.slug);
  return {
    slug: node.slug,
    title: node.title,
    eyebrow: article ? `Note · ${article.readingTime.text}` : 'Note',
    description: article?.description,
  };
}

/**
 * A structural `Node` has no page of its own (see CLAUDE.md: sections are structural
 * nodes; the same is true of any subject folder without an `index.md`), so linking
 * straight to `notesNode.children` 404s the moment the curriculum nests more than one
 * level deep — which it already does (notes → Computer Science → 3D Programming → ...).
 * This collapses single-child pass-through wrappers (folders that exist only to hold
 * one other folder) and groups the first *branching* Node's children, each labeled by
 * that Node's title and listing its nearest navigable (Collection/Article) descendants
 * — the same folders `<TreeNavigation>` would show one level in.
 */
function collapsePassThrough(node: SubjectNode): SubjectNode {
  if (node.kind === NodeKind.Node && node.children?.length === 1) {
    return collapsePassThrough(node.children[0]);
  }
  return node;
}

function collectNavigable(node: SubjectNode): SubjectNode[] {
  if (node.kind !== NodeKind.Node) return [node];
  return (node.children ?? []).flatMap(collectNavigable);
}

function buildTopicGroups(sectionRoot: SubjectNode): TopicGroup[] {
  const root = collapsePassThrough(sectionRoot);
  if (root.kind !== NodeKind.Node) {
    return [{ title: root.title, slug: root.slug, items: [root] }];
  }
  return (root.children ?? []).map((child) =>
    child.kind === NodeKind.Node
      ? { title: child.title, slug: child.slug, items: collectNavigable(child) }
      : { title: child.title, slug: child.slug, items: [child] }
  );
}

export default async function NotesLandingPage() {
  const [tree, latest] = await Promise.all([getSubjectTree(), getLatestBySection('notes', 4)]);
  const notesNode = tree.children?.find((child) => child.slug === 'notes');
  const topicGroups = await Promise.all(
    (notesNode ? buildTopicGroups(notesNode) : []).map(async (group) => ({
      ...group,
      cards: await Promise.all(group.items.map(toTopicCard)),
    }))
  );

  return (
    <PageContainer>
      <PageHeader title={section.label} description={section.tagline} />

      {topicGroups.map((group) => (
        <CardSection
          key={group.slug}
          title={group.title}
          caption={pluralize(group.cards.length, 'topic')}
          iconStyle={subjectStyle(group.slug)}
        >
          {group.cards.map((card) => (
            <ContentCard
              key={card.slug}
              href={contentPath(card.slug)}
              title={card.title}
              eyebrow={card.eyebrow}
              description={card.description}
            />
          ))}
        </CardSection>
      ))}

      {latest.length > 0 && (
        <CardSection title="Latest notes">
          {latest.map((article) => (
            <ContentCard
              key={article.slug}
              href={articlePath(article)}
              title={article.title}
              eyebrow={`${formatDate(article.date)} · ${article.readingTime.text}`}
              description={article.description}
            />
          ))}
        </CardSection>
      )}
    </PageContainer>
  );
}
