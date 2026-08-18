'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronRight, FolderOpen, FileText } from 'lucide-react';
import { getBasePath } from '../lib/paths';
import { collectionPath, contentPath } from '../lib/content/urls';
import { cn } from '../lib/utils';
import { SubjectNode, NodeKind, StandaloneArticle } from '../lib/content/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

const TOGGLE_SIZE = 24;

type TreeNavigationProps = {
  tree: SubjectNode;
};

type ActiveState = {
  collectionSlug?: string;
  articleSlug?: string;
};

export function TreeNavigation({ tree }: TreeNavigationProps) {
  const pathname = usePathname();
  const basePath = getBasePath();

  const normalizedPath = useMemo(() => {
    if (!pathname) return '/';
    if (basePath && pathname.startsWith(basePath)) {
      const sliced = pathname.slice(basePath.length);
      return sliced.length > 0 ? sliced : '/';
    }
    return pathname || '/';
  }, [pathname, basePath]);

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
    <nav aria-label="Content navigation" className="space-y-2">
      {tree.children?.map((child) => (
        <TreeNodeItem
          key={child.id}
          node={child}
          depth={0}
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
  depth: number;
  active: ActiveState;
  expandedKeys: Set<string>;
  onToggle: (key: string, value?: boolean) => void;
};

function TreeNodeItem({ node, depth, active, expandedKeys, onToggle }: TreeNodeItemProps) {
  if (node.kind === NodeKind.Node) {
    return (
      <SubjectBranch
        node={node}
        depth={depth}
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
        depth={depth}
        active={active}
        expandedKeys={expandedKeys}
        onToggle={onToggle}
      />
    );
  }

  return <StandaloneLeaf node={node as StandaloneArticle} depth={depth} active={active} />;
}

type BranchShellProps = {
  branchKey: string;
  depth: number;
  isActive: boolean;
  childNodes: SubjectNode[];
  active: ActiveState;
  expandedKeys: Set<string>;
  onToggle: (key: string, value?: boolean) => void;
  children: ReactNode;
};

/**
 * The shell shared by every branch kind: the collapsible wrapper, the indented row, and
 * the recursive child list. Variants supply only the row contents, so the disclosure and
 * indentation behaviour cannot drift between them.
 */
function BranchShell({
  branchKey,
  depth,
  isActive,
  childNodes,
  active,
  expandedKeys,
  onToggle,
  children,
}: BranchShellProps) {
  const hasChildren = childNodes.length > 0;

  return (
    <Collapsible
      className="space-y-1"
      open={expandedKeys.has(branchKey)}
      onOpenChange={(value) => onToggle(branchKey, value)}
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors',
          isActive
            ? 'bg-primary/[0.08] text-primary/80 border-l-2 border-primary/70'
            : 'text-muted-foreground/70 hover:text-foreground'
        )}
        style={{ paddingLeft: depth * 12 }}
      >
        {children}
      </div>
      {hasChildren && (
        <CollapsibleContent className="space-y-1 pt-1">
          {childNodes.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
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
  placeholder,
}: {
  hasChildren: boolean;
  label: string;
  placeholder?: ReactNode;
}) {
  if (hasChildren) {
    return <ToggleButton label={label} />;
  }

  return (
    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-xs text-muted-foreground">
      {placeholder}
    </span>
  );
}

function SubjectBranch({ node, depth, active, expandedKeys, onToggle }: TreeNodeItemProps) {
  const slug = normalizeSlug(node.slug);
  const childNodes = node.children ?? [];

  return (
    <BranchShell
      branchKey={makeNodeKey(slug)}
      depth={depth}
      isActive={branchContainsActive(slug, active)}
      childNodes={childNodes}
      active={active}
      expandedKeys={expandedKeys}
      onToggle={onToggle}
    >
      <BranchLead hasChildren={childNodes.length > 0} label={`Toggle ${node.title}`} placeholder="•" />
      <span className="truncate font-medium">{node.title}</span>
    </BranchShell>
  );
}

function CollectionBranch({ node, depth, active, expandedKeys, onToggle }: TreeNodeItemProps) {
  if (node.kind !== NodeKind.CollectionArticle) return null;

  const slug = normalizeSlug(node.slug);
  const childNodes = node.children ?? [];
  const isActive =
    active.collectionSlug === slug ||
    Boolean(active.articleSlug && active.articleSlug.startsWith(`${slug}/`));

  const collectionCount = node.collectionsCount ?? 0;
  const articleCount = node.articlesCount ?? 0;
  const badgeValue = collectionCount > 0 ? collectionCount : articleCount;
  const badgeLabel =
    collectionCount > 0
      ? `${collectionCount} ${collectionCount === 1 ? 'collection' : 'collections'}`
      : `${articleCount} ${articleCount === 1 ? 'article' : 'articles'}`;

  return (
    <BranchShell
      branchKey={makeCollectionKey(slug)}
      depth={depth}
      isActive={isActive}
      childNodes={childNodes}
      active={active}
      expandedKeys={expandedKeys}
      onToggle={onToggle}
    >
      <BranchLead hasChildren={childNodes.length > 0} label={`Toggle ${node.title}`} />
      <FolderOpen className="h-4 w-4 shrink-0 text-primary/70" />
      <Link href={collectionPath(slug)} className="flex-1 truncate font-medium">
        {node.title}
      </Link>
      <span
        className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
        title={badgeLabel}
      >
        {badgeValue}
      </span>
    </BranchShell>
  );
}

function StandaloneLeaf({ node, depth, active }: { node: StandaloneArticle; depth: number; active: ActiveState }) {
  const slug = normalizeSlug(node.articleSlug);
  const isCollectionArticle = Boolean(node.collectionSlug);
  const href = contentPath(slug, { isCollection: isCollectionArticle });
  const isActive = active.articleSlug === slug;

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors',
        isActive
          ? 'bg-primary/[0.08] font-semibold text-primary/80 border-l-2 border-primary/70'
          : 'text-muted-foreground/70 hover:text-foreground'
      )}
      style={{ paddingLeft: depth * 12 + TOGGLE_SIZE }}
    >
      <FileText className="h-4 w-4 shrink-0 opacity-60" />
      <span className="truncate">{node.title}</span>
    </Link>
  );
}

function ToggleButton({ label }: { label: string }) {
  return (
    <CollapsibleTrigger
      className="group inline-flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
      aria-label={label}
    >
      <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
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
 * One caveat: getSubjectTree() prunes a draft node together with its whole
 * subtree, while getCollections() filters drafts flatly. A *published*
 * collection nested under a *draft* one would therefore be missing here. No
 * such content exists today (every draft is a leaf article), but if that
 * changes, fix the cascade in filterTreeNode rather than reinstating the prop.
 */
function collectCollectionSlugs(node: SubjectNode, slugs = new Set<string>()): Set<string> {
  if (node.kind === NodeKind.CollectionArticle) {
    slugs.add(normalizeSlug(node.slug));
  }

  node.children?.forEach((child) => collectCollectionSlugs(child, slugs));

  return slugs;
}

function deriveActiveState(pathname: string, collectionSlugs: Set<string>): ActiveState {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) {
    return {};
  }

  const [root, ...rest] = segments;

  if (root === 'articles') {
    if (rest.length === 0) return {};
    return { articleSlug: rest.join('/') };
  }

  if (root === 'collections') {
    if (rest.length === 0) return {};
    let matchedCollection: string | undefined;
    let current = '';
    for (const segment of rest) {
      current = current ? `${current}/${segment}` : segment;
      if (collectionSlugs.has(current)) {
        matchedCollection = current;
      }
    }
    const joined = rest.join('/');
    if (matchedCollection) {
      if (matchedCollection === joined) {
        return { collectionSlug: matchedCollection };
      }
      return { collectionSlug: matchedCollection, articleSlug: joined };
    }
    return { collectionSlug: rest[0], articleSlug: joined };
  }

  return {};
}
