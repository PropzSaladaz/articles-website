export function getArticleHref(slug: string): string {
  if (typeof slug !== 'string' || slug.length === 0) {
    return '/articles/';
  }

  if (slug.includes('/')) {
    const segments = slug.split('/').filter(Boolean);
    if (segments.length >= 2) {
      const [collectionSlug, ...articleSegments] = segments;
      const chapterPath = articleSegments.join('/');
      return `/collections/${collectionSlug}/${chapterPath}/`;
    }
    const [collectionSlug] = segments;
    if (collectionSlug) {
      return `/collections/${collectionSlug}/`;
    }
  }

  return `/articles/${slug}/`;
}
