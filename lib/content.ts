import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';
import { markdownToHtml, extractHeadings, Heading } from './md';
import { generateSummary } from './summaries';
import { getCanonicalUrl, getSiteUrl } from './site';

export type Article = {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  cover?: string | null;
  content: string;
  html: string;
  headings: Heading[];
  readingTime: {
    text: string;
    minutes: number;
    words: number;
  };
};

let cachePromise: Promise<Article[]> | null = null;

function getArticlesDirectory() {
  return path.join(process.cwd(), 'content', 'articles');
}

function validateFrontmatter(data: Record<string, unknown>, filePath: string) {
  const requiredFields: Array<[string, (value: unknown) => boolean, string]> = [
    ['title', (value) => typeof value === 'string' && value.trim().length > 0, 'a non-empty string'],
    ['date', (value) => typeof value === 'string' && !Number.isNaN(Date.parse(value)), 'an ISO8601 string'],
  ];

  for (const [field, validator, description] of requiredFields) {
    if (!validator(data[field])) {
      throw new Error(`Invalid frontmatter in ${filePath}: "${field}" must be ${description}.`);
    }
  }
}

async function loadArticlesFromDisk(): Promise<Article[]> {
  const dir = getArticlesDirectory();
  if (!fs.existsSync(dir)) {
    throw new Error(`Content directory not found: ${dir}`);
  }
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.md'));

  const articles: Article[] = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    validateFrontmatter(data, fullPath);

    const slug = (typeof data.slug === 'string' && data.slug.trim().length > 0
      ? data.slug.trim()
      : path.basename(file, path.extname(file))
    ).replace(/\s+/g, '-');

    const html = await markdownToHtml(content);
    const summary = await generateSummary(content, typeof data.summary === 'string' ? data.summary : undefined);
    const headings = extractHeadings(content);
    const reading = readingTime(content);

    const article: Article = {
      slug,
      title: data.title as string,
      date: new Date(data.date as string).toISOString(),
      tags: Array.isArray(data.tags) ? (data.tags as unknown[]).filter((tag): tag is string => typeof tag === 'string') : [],
      summary,
      cover: typeof data.cover === 'string' ? data.cover : null,
      content,
      html,
      headings,
      readingTime: {
        text: reading.text,
        minutes: reading.minutes,
        words: reading.words,
      },
    };

    articles.push(article);
  }

  articles.sort((a, b) => (a.date > b.date ? -1 : 1));

  persistArticleCache(articles);
  generateSitemap(articles);
  generateRss(articles);

  return articles;
}

function persistArticleCache(articles: Article[]) {
  const cacheDir = path.join(process.cwd(), '.cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  const cachePath = path.join(cacheDir, 'articles.json');
  fs.writeFileSync(cachePath, JSON.stringify(articles, null, 2), 'utf8');
}

function generateSitemap(articles: Article[]) {
  const siteUrl = getSiteUrl();
  const tagSet = new Set<string>();
  for (const article of articles) {
    for (const tag of article.tags) {
      tagSet.add(tag);
    }
  }

  const pages = [
    `${siteUrl}/`,
    ...articles.map((article) => `${siteUrl}/articles/${article.slug}/`),
    ...Array.from(tagSet).map((tag) => `${siteUrl}/tags/${encodeURIComponent(tag)}/`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    pages
      .map((url) => `<url><loc>${url}</loc></url>`)
      .join('') +
    '</urlset>';

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), xml, 'utf8');
}

function generateRss(articles: Article[]) {
  const siteUrl = getSiteUrl();
  const items = articles
    .map((article) => {
      const link = `${siteUrl}/articles/${article.slug}/`;
      return `\n  <item>\n    <title><![CDATA[${article.title}]]></title>\n    <link>${link}</link>\n    <guid>${link}</guid>\n    <pubDate>${new Date(article.date).toUTCString()}</pubDate>\n    <description><![CDATA[${article.summary}]]></description>\n  </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>Static Articles</title>\n  <link>${siteUrl}/</link>\n  <description>Latest articles from Static Articles</description>${items}\n</channel>\n</rss>`;

  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, 'rss.xml'), rss, 'utf8');
}

export async function getAllArticles(): Promise<Article[]> {
  if (!cachePromise) {
    cachePromise = loadArticlesFromDisk();
  }
  return cachePromise;
}

export async function getArticleBySlug(slug: string): Promise<Article | undefined> {
  const articles = await getAllArticles();
  return articles.find((article) => article.slug === slug);
}

export async function getAllTags(): Promise<string[]> {
  const articles = await getAllArticles();
  const set = new Set<string>();
  for (const article of articles) {
    for (const tag of article.tags) {
      set.add(tag);
    }
  }
  return Array.from(set).sort();
}

export function getArticleCanonicalUrl(slug: string) {
  return getCanonicalUrl(`/articles/${slug}/`);
}
