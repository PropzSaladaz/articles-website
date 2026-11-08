'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { collectionPath, contentPath } from '../../lib/content/urls';
import { cn } from '../../lib/utils';
import { SubjectNode, NodeKind, StandaloneArticle } from '../../lib/content/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { subjectIcon } from '../page/subjectIcons';

// Leaves have no disclosure toggle; this indent lines their titles up with
// sibling branch titles (4px row padding + 20px toggle + 6px gap).
const LEAF_INDENT = 'pl-[30px]';

// Row states, shared by every row kind. Deliberately neutral (no accent color):
// the current page gets a quiet fill, and the rows on the path down to it are
// only darkened, so exactly one row is ever "selected".
const ROW_BASE = 'flex items-center gap-1.5 rounded-md py-1 text-sm transition-colors';
const ROW_CURRENT = 'bg-muted font-medium text-foreground';
const ROW_ON_PATH = 'text-foreground';
const ROW_IDLE = 'text-muted-foreground hover:text-foreground';

function rowState(isCurrent: boolean, isOnPath: boolean) {
  return isCurrent ? ROW_CURRENT : isOnPath ? ROW_ON_PATH : ROW_IDLE;
}

type TreeNavigationProps = {
  tree: SubjectNode;
};

type ActiveState = {
  collectionSlug?: string;
  articleSlug?: string;
};

export function TreeNavigation({ tree }: TreeNavigationProps) {
  const pathname = usePathname();
  const normalizedPath = pathname || '/';

  const collectionSlugs = useMemo(() => collectCollectionSlugs(tree), [tree]);

  const active = useMemo(
    () => deriveActiveState(normalizedPath, collectionSlugs),
    [normalizedPath, collectionSlugs]
  );

  const initialExpandedKeys = useMemo(
    () => computeInitialExpandedKeys(tree, active),
    [tree, active]
  );

  const initialFingerprint = useMemo(() => initialExpandedKeys.slice().sort().join('|'), [initialExpandedKeys]);

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set(initialExpandedKeys));

  useEffect(() => {
    setExpandedKeys(new Set(initialExpandedKeys));
  }, [initialFingerprint, initialExpandedKeys]);

  const handleToggle = (key: string, value?: boolean) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      const shouldExpand = value ?? !next.has(key);
      if (shouldExpand) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  return (
    <nav aria-label="Content navigation" className="space-y-0.5">
      {tree.children?.map((child) => (
        <TreeNodeItem
          key={child.id}
          node={child}
          active={active}
          expandedKeys={expandedKeys}
          onToggle={handleToggle}
        />
      ))}
    </nav>
  );
}

type TreeNodeItemProps = {
  node: SubjectNode;
  active: ActiveState;
  expandedKeys: Set<string>;
  onToggle: (key: string, value?: boolean) => void;
};

function TreeNodeItem({ node, active, expandedKeys, onToggle }: TreeNodeItemProps) {
  if (node.kind === NodeKind.Node) {
    return (
      <SubjectBranch
        node={node}
        active={active}
        expandedKeys={expandedKeys}
        onToggle={onToggle}
      />
    );
  }

  if (node.kind === NodeKind.CollectionArticle) {
    return (
      <CollectionBranch
        node={node}
        active={active}
        expandedKeys={expandedKeys}
        onToggle={onToggle}
      />
    );
  }

  return <StandaloneLeaf node={node as StandaloneArticle} active={active} />;
}

type BranchShellProps = {
  branchKey: string;
  isCurrent: boolean;
  isOnPath: boolean;
  childNodes: SubjectNode[];
  active: ActiveState;
  expandedKeys: Set<string>;
  onToggle: (key: string, value?: boolean) => void;
  children: ReactNode;
};

/**
 * The shell shared by every branch kind: the collapsible wrapper, the row, and the
 * recursive child list, indented under a thin guide line that hangs from the
 * chevron. Variants supply only the row contents, so the disclosure and indentation
 * behaviour cannot drift between them.
 */
function BranchShell({
  branchKey,
  isCurrent,
  isOnPath,
  childNodes,
  active,
  expandedKeys,
  onToggle,
  children,
}: BranchShellProps) {
  const hasChildren = childNodes.length > 0;

  return (
    <Collapsible
      className="space-y-0.5"
      open={expandedKeys.has(branchKey)}
      onOpenChange={(value) => onToggle(branchKey, value)}
    >
      <div className={cn(ROW_BASE, 'px-1', rowState(isCurrent, isOnPath))}>{children}</div>
      {hasChildren && (
        <CollapsibleContent className="ml-3.5 space-y-0.5 border-l border-border pl-1">
          {childNodes.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              active={active}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
            />
          ))}
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

/**
 * The fixed-width slot opening every branch row: a disclosure toggle when the branch has
 * children, otherwise a placeholder of the same footprint so sibling rows stay aligned.
 */
function BranchLead({
  hasChildren,
  label,
}: {
  hasChildren: boolean;
  label: string;
}) {
  if (hasChildren) {
    return <ToggleButton label={label} />;
  }

  return <span className="inline-flex h-5 w-5 shrink-0" aria-hidden="true" />;
}

function SubjectBranch({ node, active, expandedKeys, onToggle }: TreeNodeItemProps) {
  const slug = normalizeSlug(node.slug);
  const childNodes = node.children ?? [];
  const Icon = subjectIcon(slug);

  return (
    <BranchShell
      branchKey={makeNodeKey(slug)}
      isCurrent={false}
      isOnPath={branchContainsActive(slug, active)}
      childNodes={childNodes}
      active={active}
      expandedKeys={expandedKeys}
      onToggle={onToggle}
    >
      <BranchLead hasChildren={childNodes.length > 0} label={`Toggle ${node.title}`} />
      {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />}
      <span className="truncate font-medium">{node.title}</span>
    </BranchShell>
  );
}

function CollectionBranch({ node, active, expandedKeys, onToggle }: TreeNodeItemProps) {
  if (node.kind !== NodeKind.CollectionArticle) return null;

  const slug = normalizeSlug(node.slug);
  const childNodes = node.children ?? [];
  const isCurrent = active.collectionSlug === slug && !active.articleSlug;
  const isOnPath =
    active.collectionSlug === slug ||
    Boolean(active.articleSlug && active.articleSlug.startsWith(`${slug}/`));

  return (
    <BranchShell
      branchKey={makeCollectionKey(slug)}
      isCurrent={isCurrent}
      isOnPath={isOnPath}
      childNodes={childNodes}
      active={active}
      expandedKeys={expandedKeys}
      onToggle={onToggle}
    >
      <BranchLead hasChildren={childNodes.length > 0} label={`Toggle ${node.title}`} />
      <Link href={collectionPath(slug)} className="flex-1 truncate">
        {node.title}
      </Link>
    </BranchShell>
  );
}

function StandaloneLeaf({ node, active }: { node: StandaloneArticle; active: ActiveState }) {
  const slug = normalizeSlug(node.articleSlug);
  const href = contentPath(slug);
  const isActive = active.articleSlug === slug;

  return (
    <Link
      href={href}
      aria-current={isActive ? 'page' : undefined}
      className={cn(ROW_BASE, LEAF_INDENT, 'pr-1', rowState(isActive, false))}
    >
      <span className="truncate">{node.title}</span>
    </Link>
  );
}

function ToggleButton({ label }: { label: string }) {
  return (
    <CollapsibleTrigger
      className="group inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-muted-foreground/70 transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={label}
    >
      <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-data-[state=open]:rotate-90" />
    </CollapsibleTrigger>
  );
}

function normalizeSlug(value?: string) {
  if (!value) return '';
  return value.replace(/^\/+|\/+$/g, '');
}

function makeNodeKey(slug: string) {
  return `node:${slug || '__root__'}`;
}

function makeCollectionKey(slug: string) {
  return `collection:${slug}`;
}

function branchContainsActive(slug: string, active: ActiveState) {
  if (!slug) {
    return Boolean(active.collectionSlug || active.articleSlug);
  }

  const activePaths = [active.collectionSlug, active.articleSlug].filter(Boolean) as string[];
  return activePaths.some((path) => path === slug || path.startsWith(`${slug}/`));
}

function computeInitialExpandedKeys(tree: SubjectNode, active: ActiveState) {
  const keys = new Set<string>();
  keys.add(makeNodeKey(''));

  const visit = (node: SubjectNode) => {
    if (node.kind === NodeKind.Node) {
      const slug = normalizeSlug(node.slug);
      if (slug && branchContainsActive(slug, active)) {
        keys.add(makeNodeKey(slug));
      }
      node.children?.forEach(visit);
      return;
    }

    if (node.kind === NodeKind.CollectionArticle) {
      const slug = normalizeSlug(node.slug);
      if (active.collectionSlug === slug || Boolean(active.articleSlug && active.articleSlug.startsWith(`${slug}/`))) {
        keys.add(makeCollectionKey(slug));
      }
    }
  };

  tree.children?.forEach(visit);
  return Array.from(keys);
}

/**
 * Every collection slug reachable in the nav tree.
 *
 * `walk()` in lib/content/tree.ts emits a Collection object and a
 * NodeKind.CollectionArticle node from the same branch, so this set is
 * identical to the slugs of `getCollections()` — deriving it here avoids
 * shipping the full Collection[] (and with it every article body) into the
 * client bundle just to answer prefix-membership questions.
 *
 * Both accessors use the same cascading draft projection, so this set contains
 * exactly the public collection URLs without shipping the rich collection model.
 */
function collectCollectionSlugs(node: SubjectNode, slugs = new Set<string>()): Set<string> {
  if (node.kind === NodeKind.CollectionArticle) {
    slugs.add(normalizeSlug(node.slug));
  }

  node.children?.forEach((child) => collectCollectionSlugs(child, slugs));

  return slugs;
}

/**
 * The pathname is the slug (see `contentPath`), so the active article is the whole path
 * and the active collection is its deepest prefix that is a known collection.
 */
function deriveActiveState(pathname: string, collectionSlugs: Set<string>): ActiveState {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return {};
  }

  let matchedCollection: string | undefined;
  let current = '';
  for (const segment of segments) {
    current = current ? `${current}/${segment}` : segment;
    if (collectionSlugs.has(current)) {
      matchedCollection = current;
    }
  }

  const joined = segments.join('/');
  if (matchedCollection === joined) {
    return { collectionSlug: matchedCollection };
  }
  return { collectionSlug: matchedCollection, articleSlug: joined };
}
