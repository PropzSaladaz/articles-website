import type { Article, Slug } from './types';

/**
 * The single source of truth for where a slug lives in the exported site.
 *
 * A slug is the content folder path, and its first segment is the section
 * (`notes`, `writing`, `devlog`), so the URL is just the slug — nothing about
 * the folder's shape (leaf vs. collection) decides it, and re-organizing a
 * folder never moves a URL.
 *
 * `scripts/prepare-content.mjs`'s `canonicalPathForEntry` decides where assets
 * are *copied* and cannot import this module (plain `.mjs`), so it repeats this
 * one-line rule. Keep the two in agreement by hand.
 *
 * Deliberately dependency-free (types only) so client components and the
 * esbuild-bundled Worker can both import it.
 */
export function contentPath(slug: Slug): string {
  return slug ? `/${slug}/` : '/';
}

/** Path to an article page. */
export function articlePath(article: Pick<Article, 'slug'>): string {
  return contentPath(article.slug);
}

/** Path to a collection's own page. */
export function collectionPath(slug: Slug): string {
  return contentPath(slug);
}
