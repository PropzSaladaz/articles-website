'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { getBasePath } from '../lib/paths';
import { cn } from '../lib/utils';
import type { Collection, SubjectNode } from '../lib/content/content';
import { NodeKind } from '../lib/content/content';

const TOGGLE_SIZE = 16;

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

  const active = useMemo(() => deriveActiveState(normalizedPath), [normalizedPath]);

  const collectionMap = useMemo(() => {
    const map = new Map<string, Collection>();
    for (const collection of collections) {
      map.set(normalizeSlug(collection.slug), collection);
    }
    return map;
  }, [collections]);

  const initialExpandedKeys = useMemo(
    () => computeInitialExpandedKeys(tree, active),
    [tree, active]
  );

  const initialFingerprint = useMemo(() => initialExpandedKeys.slice().sort().join('|'), [initialExpandedKeys]);

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set(initialExpandedKeys));

  useEffect(() => {
    setExpandedKeys(new Set(initialExpandedKeys));
  }, [initialFingerprint, initialExpandedKeys]);

  const handleToggle = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
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
          collectionMap={collectionMap}
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
  onToggle: (key: string) => void;
  collectionMap: Map<string, Collection>;
};

function TreeNodeItem({ node, depth, active, expandedKeys, onToggle, collectionMap }: TreeNodeItemProps) {
  if (node.kind === NodeKind.Node) {
    return (
      <SubjectBranch
        node={node}
        depth={depth}
        active={active}
        expandedKeys={expandedKeys}
        onToggle={onToggle}
        collectionMap={collectionMap}
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
        collectionMap={collectionMap}
      />
    );
  }

  return <StandaloneLeaf node={node} depth={depth} active={active} />;
}

function SubjectBranch({
  node,
  depth,
  active,
  expandedKeys,
  onToggle,
  collectionMap,
}: TreeNodeItemProps) {
  const slug = normalizeSlug(node.slug);
  const key = makeNodeKey(slug);
  const isExpanded = expandedKeys.has(key);
  const hasChildren = Boolean(node.children?.length);
  const isActive = branchContainsActive(slug, active);

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium transition-colors',
          isActive ? 'bg-muted text-foreground' : 'text-muted-foreground'
        )}
        style={{ paddingLeft: depth * 12 }}
      >
        {hasChildren ? (
          <ToggleButton
            isExpanded={isExpanded}
            onClick={() => onToggle(key)}
            label={`Toggle ${node.title}`}
          />
        ) : (
          <span className="inline-flex h-5 w-5 items-center justify-center text-xs text-muted-foreground">•</span>
        )}
        <span className="truncate">{node.title}</span>
      </div>
      {hasChildren && isExpanded && (
        <div className="space-y-1">
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              active={active}
              expandedKeys={expandedKeys}
              onToggle={onToggle}
              collectionMap={collectionMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionBranch({
  node,
  depth,
  active,
  expandedKeys,
  onToggle,
  collectionMap,
}: TreeNodeItemProps) {
  if (node.kind !== NodeKind.CollectionArticle) return null;

  const slug = normalizeSlug(node.collectionSlug || node.slug);
  const key = makeCollectionKey(slug);
  const isExpanded = expandedKeys.has(key);
  const collection = collectionMap.get(slug);
  const hasArticles = Boolean(collection?.articles.length);
  const isActive = active.collectionSlug === slug || Boolean(active.articleSlug && active.articleSlug.startsWith(`${slug}/`));

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'flex items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors',
          isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
        )}
        style={{ paddingLeft: depth * 12 }}
      >
        {hasArticles ? (
          <ToggleButton
            isExpanded={isExpanded}
            onClick={() => onToggle(key)}
            label={`Toggle ${node.title}`}
          />
        ) : (
          <span className="inline-flex h-5 w-5 items-center justify-center text-xs text-muted-foreground">•</span>
        )}
        <Link href={`/collections/${slug}/`} className="flex-1 truncate font-medium">
          {node.title}
        </Link>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
          {node.articlesCount}
        </span>
      </div>
      {hasArticles && isExpanded && collection && (
        <div className="space-y-1">
          {collection.articles.map((article) => {
            const articleSlug = article.slug.split('/').slice(1).join('/');
            const href = `/collections/${slug}/${articleSlug}/`;
            const isArticleActive = active.articleSlug === article.slug;
            return (
              <Link
                key={article.slug}
                href={href}
                className={cn(
                  'block rounded-md px-2 py-1 text-sm transition-colors',
                  isArticleActive
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                style={{ paddingLeft: (depth + 1) * 12 + TOGGLE_SIZE }}
              >
                {article.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StandaloneLeaf({
  node,
  depth,
  active,
}: {
  node: SubjectNode;
  depth: number;
  active: ActiveState;
}) {
  if (node.kind !== NodeKind.StandaloneArticle) return null;

  const slug = node.articleSlug;
  const isActive = active.articleSlug === slug;

  return (
    <Link
      href={`/articles/${slug}/`}
      className={cn(
        'block rounded-md px-2 py-1 text-sm transition-colors',
        isActive ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:text-foreground'
      )}
      style={{ paddingLeft: depth * 12 + TOGGLE_SIZE }}
    >
      {node.title}
    </Link>
  );
}

function ToggleButton({ isExpanded, onClick, label }: { isExpanded: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-5 w-5 items-center justify-center rounded border border-transparent text-xs text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
    >
      <span>{isExpanded ? '▾' : '▸'}</span>
    </button>
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
      const slug = normalizeSlug(node.collectionSlug || node.slug);
      if (active.collectionSlug === slug || Boolean(active.articleSlug && active.articleSlug.startsWith(`${slug}/`))) {
        keys.add(makeCollectionKey(slug));
      }
    }
  };

  tree.children?.forEach(visit);
  return Array.from(keys);
}

function deriveActiveState(pathname: string): ActiveState {
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
    const collectionSlug = rest[0];
    if (rest.length === 1) {
      return { collectionSlug };
    }
    return { collectionSlug, articleSlug: `${collectionSlug}/${rest.slice(1).join('/')}` };
  }

  return {};
}
