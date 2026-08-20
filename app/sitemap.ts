import type { MetadataRoute } from 'next';
import { getAllArticles, getCollections } from '../lib/content/content';
import { getSitemapUrls } from '../lib/content/feeds';

/** Builds the static `/sitemap.xml` artifact from the published content corpus. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [articles, collections] = await Promise.all([getAllArticles(), getCollections()]);

  return getSitemapUrls(articles, collections).map((url) => ({ url }));
}
