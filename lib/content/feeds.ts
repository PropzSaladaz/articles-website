import path from "path";
import fs from "fs";
import { Article, Collection } from "./types";
import { getSiteUrl } from "../site";
import { articlePath, collectionPath } from "./urls";

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

  // Every published article and every published collection gets exactly one URL.
  // Do not also add an article's *parent* collection here: for a published parent
  // the loop below already covers it, and for a draft parent it would advertise a
  // page that was never exported. Status does not cascade — each folder's own
  // frontmatter decides it — so a published chapter under a draft collection is
  // exported while its parent is not.
  for (const a of articles) {
    pages.add(`${siteUrl}${articlePath(a)}`);
  }
  for (const c of collections) {
    pages.add(`${siteUrl}${collectionPath(c.slug)}`);
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
      const link = `${siteUrl}${articlePath(a)}`;

      return `\n  <item>\n    <title><![CDATA[${a.title}]]></title>\n    <link>${link}</link>\n    <guid>${link}</guid>\n    <pubDate>${new Date(a.date).toUTCString()}</pubDate>\n    <description><![CDATA[${a.summary.text}]]></description>\n  </item>`;
    })
    .join('');

  const rss =
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>Articles</title>\n  <link>${siteUrl}/</link>\n  <description>Latest articles</description>${items}\n</channel>\n</rss>`;

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'rss.xml'), rss, 'utf8');
}
