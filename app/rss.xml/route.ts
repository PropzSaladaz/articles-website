import { getAllArticles } from '../../lib/content/content';
import { generateRssXml } from '../../lib/content/feeds';

// Static export invokes this route at build time and writes the response to
// `out/rss.xml`; it is never generated as a `public/` side effect.
export const dynamic = 'force-static';

export async function GET(): Promise<Response> {
  const articles = await getAllArticles();

  return new Response(generateRssXml(articles), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
    },
  });
}
