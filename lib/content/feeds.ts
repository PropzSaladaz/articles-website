import type { Article, Collection } from './types';
import { getSiteUrl } from '../site';
import { articlePath, collectionPath } from './urls';

/**
 * Returns the absolute URLs for the published sitemap.
 *
 * The App Router's `app/sitemap.ts` serializes these into XML. Keeping this
 * function free of filesystem writes makes it safe for any server-side caller.
 */
export function getSitemapUrls(articles: Article[], collections: Collection[]): string[] {
  const siteUrl = getSiteUrl();
  const pages = new Set<string>();
  pages.add(`${siteUrl}/`);

  // Every public article and collection gets exactly one URL. The content accessors
  // apply cascading draft visibility before values reach this serializer.
  for (const a of articles) {
    pages.add(`${siteUrl}${articlePath(a)}`);
  }
  for (const c of collections) {
    pages.add(`${siteUrl}${collectionPath(c.slug)}`);
  }

  return Array.from(pages).sort();
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&apos;';
      default:
        return character;
    }
  });
}

function escapeCdata(value: string): string {
  return value.replace(/]]>/g, ']]]]><![CDATA[>');
}

/**
 * Serializes articles as RSS XML. The caller is responsible for serving the
 * result; this module never writes build inputs such as `public/`.
 */
export function generateRssXml(articles: Article[]): string {
  const siteUrl = getSiteUrl();

  const items = articles
    .map((a) => {
      const link = `${siteUrl}${articlePath(a)}`;

      return `\n  <item>\n    <title><![CDATA[${escapeCdata(a.title)}]]></title>\n    <link>${escapeXml(link)}</link>\n    <guid>${escapeXml(link)}</guid>\n    <pubDate>${new Date(a.date).toUTCString()}</pubDate>\n    <description><![CDATA[${escapeCdata(a.summary.text)}]]></description>\n  </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>Articles</title>\n  <link>${siteUrl}/</link>\n  <description>Latest articles</description>${items}\n</channel>\n</rss>`;
}
