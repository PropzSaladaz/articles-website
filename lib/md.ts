import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import remarkSpoiler from './remark-spoiler';
import remarkGithubAlerts from './remark-github-alerts';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import GithubSlugger from 'github-slugger';
import rehypeScopeClasses from './rehypeScopeClasses';
import { Heading } from './content/types';
import rehypeShiki from '@shikijs/rehype';
import rehypeCodeBlockCopy from './rehypeCodeBlockCopy';
import remarkStrongHr from './remark-strong-hr';
import rehypeDevImages from './rehype-dev-images';

import rehypeProductionImages from './rehype-production-images';
import rehypeIframeWindow from './rehype-iframe-window';

interface MarkdownOptions {
  slug?: string;
  parentCollectionSlug?: string | null;
  isCollection?: boolean;
}

export async function markdownToHtml(markdown: string, options?: MarkdownOptions): Promise<string> {
  const isDev = process.env.NODE_ENV === 'development';
  const slug = options?.slug || '';

  let processor = unified()
    .use(remarkParse)
    // support github flavored markdown
    .use(remarkGfm)
    // enables $…$ and $$…$$
    .use(remarkMath)
    // 2) Enable directives and convert :::spoiler → <details><summary>…</summary>…</details>
    .use(remarkDirective)
    .use(remarkSpoiler)
    // GitHub-style alerts: > [!NOTE], > [!TIP], etc.
    .use(remarkGithubAlerts)

    // stronger horizontal rules using '==='
    .use(remarkStrongHr)

    // transform to HTML AST
    .use(remarkRehype, { allowDangerousHtml: true })
    // support raw HTML in markdown
    .use(rehypeRaw as any)
    // wrap iframes in macOS-styled window
    .use(rehypeIframeWindow)
    // render math equations
    .use(rehypeKatex)
    // code highlighting
    .use(rehypeShiki, {
      themes: {
        light: 'github-dark',
        dark: 'github-dark',
      },
      // Optional: add line numbers, highlight lines, etc., later
    })
    // add ids to headings - allow making link jumps to sections possible
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: 'wrap' })
    .use(rehypeScopeClasses, { prefix: 'md-' })
    .use(rehypeCodeBlockCopy);

  // In dev mode with a slug, transform relative image URLs
  if (isDev && slug) {
    processor = processor.use(rehypeDevImages, { slug, isDev });
  } else if (!isDev && slug) {
    processor = processor.use(rehypeProductionImages, {
      slug,
      isDev,
      repoName: process.env.NEXT_REPO_NAME,
      parentCollectionSlug: options?.parentCollectionSlug,
      isCollection: options?.isCollection
    });
  }

  const file = await processor
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return String(file);
}

export function extractHeadings(markdown: string): Heading[] {
  const tree = remark().use(remarkParse).parse(markdown);
  const headings: Heading[] = [];
  const slugger = new GithubSlugger();

  visit(tree, 'heading', (node: any) => {
    // only headings of level 1-2
    if (!node.depth || node.depth < 1 || node.depth > 2) {
      return;
    }
    const text = toString(node).trim();
    if (!text) return;
    headings.push({
      id: slugger.slug(text),
      text,
      level: node.depth,
    });
  });

  return headings;
}
