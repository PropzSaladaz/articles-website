'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, FolderOpen, FileText } from 'lucide-react';
import { getBasePath } from '../lib/paths';
import { cn } from '../lib/utils';
import { Collection, SubjectNode, NodeKind, StandaloneArticle } from '../lib/content/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

const TOGGLE_SIZE = 24;

type TreeNavigationProps = {
  tree: SubjectNode;
  collections: Collection[];
};

type ActiveState = {
  collectionSlug?: string;
  articleSlug?: string;
};

export function TreeNavigation({ tree, collections }: TreeNavigationProps) {
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

  const collectionSlugs = useMemo(() => {
    const set = new Set<string>();
    for (const collection of collections) {
      set.add(normalizeSlug(collection.slug));
    }
    return set;
  }, [collections]);

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

function SubjectBranch({ node, depth, active, expandedKeys, onToggle }: TreeNodeItemProps) {
  const slug = normalizeSlug(node.slug);
  const key = makeNodeKey(slug);
  const isExpanded = expandedKeys.has(key);
  const hasChildren = Boolean(node.children?.length);
  const isActive = branchContainsActive(slug, active);

  return (
    <Collapsible
      className="space-y-1"
      open={isExpanded}
      onOpenChange={(value) => onToggle(key, value)}
    >
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-colors',
          isActive
            ? 'bg-primary/[0.08] text-primary/80 border-l-2 border-primary/70 pl-[calc(0.5rem-2px)]'
            : 'text-muted-foreground/70 hover:text-foreground'
        )}
        style={{ paddingLeft: depth * 12 }}
      >
        {hasChildren ? (
          <ToggleButton label={`Toggle ${node.title}`} />
        ) : (
          <span className="inline-flex h-6 w-6 items-center justify-center text-xs text-muted-foreground">•</span>
        )}
        <span className="truncate">{node.title}</span>
      </div>
      {hasChildren && (
        <CollapsibleContent className="space-y-1 pt-1">
          {node.children!.map((child) => (
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

function CollectionBranch({
  node,
  depth,
  active,
  expandedKeys,
  onToggle,
}: TreeNodeItemProps) {
  if (node.kind !== NodeKind.CollectionArticle) return null;

  const slug = normalizeSlug(node.slug);
  const key = makeCollectionKey(slug);
  const isExpanded = expandedKeys.has(key);
  const childNodes = node.children ?? [];
  const hasChildren = childNodes.length > 0;
  const isActive = active.collectionSlug === slug || Boolean(active.articleSlug && active.articleSlug.startsWith(`${slug}/`));
  const collectionCount = node.collectionsCount ?? 0;
  const articleCount = node.articlesCount ?? 0;
  const badgeValue = collectionCount > 0 ? collectionCount : articleCount;
  const badgeLabel =
    collectionCount > 0
      ? `${collectionCount} ${collectionCount === 1 ? 'collection' : 'collections'}`
      : `${articleCount} ${articleCount === 1 ? 'article' : 'articles'}`;

  return (
    <Collapsible
      className="space-y-1"
      open={isExpanded}
      onOpenChange={(value) => onToggle(key, value)}
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
        {hasChildren ? (
          <ToggleButton label={`Toggle ${node.title}`} />
        ) : (
          <FolderOpen className="h-4 w-4 text-primary/70" />
        )}
        <FolderOpen className="h-4 w-4 text-primary/70" />
        <Link href={`/collections/${slug}/`} className="flex-1 truncate font-medium">
          {node.title}
        </Link>
        <span
          className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground"
          title={badgeLabel}
        >
          {badgeValue}
        </span>
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

function StandaloneLeaf({ node, depth, active }: { node: StandaloneArticle; depth: number; active: ActiveState }) {
  const slug = normalizeSlug(node.articleSlug);
  const isCollectionArticle = Boolean(node.collectionSlug);
  const href = isCollectionArticle ? `/collections/${slug}/` : `/articles/${slug}/`;
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
