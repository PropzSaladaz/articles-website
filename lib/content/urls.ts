import type { Article, Slug } from './types';

/**
 * The single source of truth for whether a slug lives under /articles or /collections.
 *
 * This rule is mirrored by `scripts/prepare-content.mjs`'s `canonicalPathForEntry`,
 * which decides where the prebuild step actually *copies* files. That script is plain
 * `.mjs` and cannot import this module, so the two must be kept in agreement by hand —
 * they are the only two copies left, and when they drifted apart before, images in
 * collection pages pointed at paths nothing had been copied to.
 *
 * Deliberately dependency-free (types only) so client components can import it.
 */
export function contentPath(
  slug: Slug,
  { collectionSlug, isCollection }: { collectionSlug?: Slug | null; isCollection?: boolean } = {}
): string {
  const base = isCollection || collectionSlug ? '/collections' : '/articles';
  return slug ? `${base}/${slug}/` : `${base}/`;
}

/** Path to an article page — under /collections when it belongs to one, else /articles. */
export function articlePath(article: Pick<Article, 'slug' | 'collectionSlug'>): string {
  return contentPath(article.slug, { collectionSlug: article.collectionSlug });
}

/** Path to a collection's own page. Always under /collections. */
export function collectionPath(slug: Slug): string {
  return contentPath(slug, { isCollection: true });
}
