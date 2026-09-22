import type { Metadata } from 'next';
import Link from 'next/link';
import { getLatestBySection, getSubjectTree } from '../../lib/content/content';
import { SECTIONS } from '../../lib/content/sections';
import { contentPath } from '../../lib/content/urls';
import { NodeKind, type SubjectNode } from '../../lib/content/types';
import { SectionHeader } from '../../components/SectionHeader';
import { ArticlePreviewCard } from '../../components/ArticlePreviewCard';

export const runtime = 'nodejs';
export const dynamic = 'force-static';

const section = SECTIONS.notes;

export const metadata: Metadata = {
  title: section.label,
  description: section.tagline,
};

type TopicGroup = { title: string; slug: string; items: SubjectNode[] };

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
  const topicGroups = notesNode ? buildTopicGroups(notesNode) : [];

  return (
    <div className="space-y-12">
      <SectionHeader section={section} />

      {topicGroups.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Topics</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {topicGroups.map((group) => (
              <div key={group.slug} className="space-y-3 rounded-2xl border border-border p-5">
                <h3 className="text-lg font-semibold text-foreground">{group.title}</h3>
                <div className="flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.slug}
                      href={contentPath(item.slug)}
                      className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">Latest notes</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {latest.map((article) => (
              <ArticlePreviewCard key={article.slug} article={article} variant="compact" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
