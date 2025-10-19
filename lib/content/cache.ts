import path from "path";
import fs from "fs";
import { NAMESPACE_CHAPTER_SLUGS } from "./files";
import { Article, Collection } from "./types";
import { getSiteUrl } from "../site";
import { WalkResult } from "./tree";

/**
 * Persists the content tree, articles, and collections to the cache directory as JSON files.
 * @param payload The full walk result to persist
 */
export function persistCaches(payload: WalkResult) {
  const cacheDir = path.join(process.cwd(), '.cache');
  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  fs.writeFileSync(path.join(cacheDir, 'content-tree.json'), JSON.stringify(payload.tree, null, 2));
  fs.writeFileSync(path.join(cacheDir, 'articles.json'), JSON.stringify(payload.articles, null, 2));
  fs.writeFileSync(path.join(cacheDir, 'collections.json'), JSON.stringify(payload.collections, null, 2));
}

/**
 * Generates a sitemap XML from the given articles and collections.
 * Useful for SEO.
 * @param articles The list of articles to include
 * @param collections The list of collections to include
 */
export function generateSitemap(articles: Article[], collections: Collection[]) {
  const siteUrl = getSiteUrl();
  const pages = new Set<string>();
  pages.add(`${siteUrl}/`);

  // Standalone vs chapter URLs:
  for (const a of articles) {
    if (NAMESPACE_CHAPTER_SLUGS && a.slug.includes('/')) {
      const [cSlug, chSlug] = a.slug.split('/');
      pages.add(`${siteUrl}/collections/${cSlug}/`);
      pages.add(`${siteUrl}/collections/${cSlug}/${chSlug}/`);
    } else {
      pages.add(`${siteUrl}/articles/${a.slug}/`);
    }
  }
  for (const c of collections) {
    pages.add(`${siteUrl}/collections/${c.slug}/`);
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    Array.from(pages)
      .sort()
      .map((url) => `<url><loc>${url}</loc></url>`)
      .join('') +
    '</urlset>';

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
}

/**
 * Generates an RSS feed XML from the given articles.
 * Useful for discribing updates to subscribers.
 * @param articles The list of articles to include
 */
export function generateRss(articles: Article[]) {
  const siteUrl = getSiteUrl();

  const items = articles
    .map((a) => {
      const link =
        NAMESPACE_CHAPTER_SLUGS && a.slug.includes('/')
          ? `${siteUrl}/collections/${a.slug}/` // e.g., collections/rendering-pipeline/introduction/
          : `${siteUrl}/articles/${a.slug}/`;

      return `\n  <item>\n    <title><![CDATA[${a.title}]]></title>\n    <link>${link}</link>\n    <guid>${link}</guid>\n    <pubDate>${new Date(a.date).toUTCString()}</pubDate>\n    <description><![CDATA[${a.summary.text}]]></description>\n  </item>`;
    })
    .join('');

  const rss =
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>Articles</title>\n  <link>${siteUrl}/</link>\n  <description>Latest articles</description>${items}\n</channel>\n</rss>`;

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'rss.xml'), rss, 'utf8');
}