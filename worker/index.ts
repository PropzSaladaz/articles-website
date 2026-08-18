import { contentPath } from '../lib/content/urls';

const VIEW_PATH = '/api/article-views';
const POPULAR_PATH = '/api/article-views/popular';
const PERIOD_DAYS = 3;
const MAX_REQUEST_BYTES = 1024;

type PopularRow = {
  slug: string;
  views: number;
};

function jsonResponse(data: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json; charset=utf-8');

  return new Response(JSON.stringify(data), { ...init, headers });
}

function isValidSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 240 &&
    /^[a-z0-9](?:[a-z0-9/_-]*[a-z0-9])?$/.test(value) &&
    !value.includes('//') &&
    !value.includes('..')
  );
}

async function readSlug(request: Request): Promise<string | null> {
  const contentLength = Number(request.headers.get('Content-Length') ?? '0');
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) return null;

  const contentType = request.headers.get('Content-Type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) return null;

  const payload: unknown = await request.json();
  if (typeof payload !== 'object' || payload === null || !('slug' in payload)) return null;

  return isValidSlug(payload.slug) ? payload.slug : null;
}

async function articleExists(request: Request, env: Env, slug: string) {
  // The tracker posts a bare slug and cannot say whether the article belongs to a
  // collection, so probe both export locations. Assuming /articles silently failed
  // the check for any chapter inside a collection, which is exported under
  // /collections — the view would then never be recorded, with no error surfaced.
  for (const pathname of [contentPath(slug), contentPath(slug, { isCollection: true })]) {
    const assetUrl = new URL(request.url);
    assetUrl.pathname = pathname;
    assetUrl.search = '';
    assetUrl.hash = '';

    const response = await env.ASSETS.fetch(
      new Request(assetUrl, {
        method: 'HEAD',
        headers: { Accept: 'text/html' },
      })
    );

    if (response.ok) return true;
  }

  return false;
}

async function recordView(env: Env, slug: string) {
  await env.DB.prepare(
    `INSERT INTO article_views_daily (article_slug, day, views)
     VALUES (?, date('now'), 1)
     ON CONFLICT(article_slug, day)
     DO UPDATE SET views = article_views_daily.views + 1`
  )
    .bind(slug)
    .run();
}

async function handleView(request: Request, env: Env, ctx: ExecutionContext) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get('Origin');
  if (origin && origin !== requestUrl.origin) {
    return jsonResponse({ error: 'Cross-origin requests are not allowed.' }, { status: 403 });
  }

  let slug: string | null;
  try {
    slug = await readSlug(request);
  } catch {
    slug = null;
  }

  if (!slug) {
    return jsonResponse({ error: 'A valid article slug is required.' }, { status: 400 });
  }

  if (!(await articleExists(request, env, slug))) {
    return jsonResponse({ error: 'Article not found.' }, { status: 404 });
  }

  ctx.waitUntil(
    recordView(env, slug).catch((error: unknown) => {
      console.error(
        JSON.stringify({
          message: 'Failed to record article view',
          slug,
          error: error instanceof Error ? error.message : String(error),
        })
      );
    })
  );

  return jsonResponse({ accepted: true }, {
    status: 202,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function handlePopular(env: Env) {
  const result = await env.DB.prepare(
    `SELECT article_slug AS slug, SUM(views) AS views
     FROM article_views_daily
     WHERE day >= date('now', '-2 days')
       AND day <= date('now')
     GROUP BY article_slug
     ORDER BY views DESC, article_slug ASC
     LIMIT 20`
  ).all<PopularRow>();

  const articles = result.results.map((row) => ({
    slug: row.slug,
    views: Number(row.views),
  }));

  return jsonResponse(
    { periodDays: PERIOD_DAYS, articles },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    }
  );
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.pathname === VIEW_PATH) {
        if (request.method !== 'POST') {
          return jsonResponse({ error: 'Method not allowed.' }, {
            status: 405,
            headers: { Allow: 'POST' },
          });
        }
        return await handleView(request, env, ctx);
      }

      if (url.pathname === POPULAR_PATH) {
        if (request.method !== 'GET') {
          return jsonResponse({ error: 'Method not allowed.' }, {
            status: 405,
            headers: { Allow: 'GET' },
          });
        }
        return await handlePopular(env);
      }

      if (url.pathname.startsWith('/api/')) {
        return jsonResponse({ error: 'Not found.' }, { status: 404 });
      }

      return await env.ASSETS.fetch(request);
    } catch (error) {
      console.error(
        JSON.stringify({
          message: 'Unhandled article analytics error',
          path: url.pathname,
          error: error instanceof Error ? error.message : String(error),
        })
      );
      return jsonResponse({ error: 'Internal server error.' }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
