import { unified } from 'unified';
import type { Plugin } from 'unified';
import type { Root } from 'hast';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import remarkSpoiler from './remark/spoiler';
import remarkDefinition from './remark/definition';
import remarkDiagram from './remark/diagram';
import remarkGithubAlerts from './remark/github-alerts';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import GithubSlugger from 'github-slugger';
import rehypeScopeClasses from './rehype/scope-classes';
import { Heading } from '../content/types';
import rehypeShiki, { type RehypeShikiOptions } from '@shikijs/rehype';
import rehypeCodeBlockCopy from './rehype/code-block-copy';
import remarkStrongHr from './remark/strong-hr';
import rehypeDevImages from './rehype/dev-images';

import rehypeProductionImages from './rehype/production-images';
import rehypeIframeWindow from './rehype/iframe-window';
import rehypeImageWrapper from './rehype/image-wrapper';

// rehype-katex and the rest of this pipeline operate on the same HAST root.
// Its exported transformer signature is not inferred as a Unified plugin by
// TypeScript in every dependency-resolution layout (notably pnpm's CI layout).
const rehypeKatexPlugin = rehypeKatex as unknown as Plugin<[], Root>;

const rehypeShikiOptions = {
  themes: {
    light: 'github-dark',
    dark: 'github-dark',
  },
  // Pin the grammar set explicitly. Omitting `langs` makes @shikijs/rehype
  // default to Object.keys(bundledLanguages) — all 332 bundled grammars —
  // which costs ~2.9s and ~58MB of extra heap per process on first use.
  // This list loads in ~90ms. Keep it a superset of what content/ actually
  // uses (currently just js + text) and add entries as new fences appear.
  langs: [
    'js', 'ts', 'jsx', 'tsx', 'json',
    'bash', 'html', 'css', 'python',
    'c', 'cpp', 'rust', 'glsl', 'wgsl',
    'sql', 'yaml', 'diff', 'md',
  ],
  // `text` is a Shiki special language rather than a bundled grammar, so it does
  // not belong in `langs`. It remains the fallback for unknown or plain-text
  // fences, so adding e.g. ```haskell degrades gracefully instead of throwing.
  fallbackLanguage: 'text',
} satisfies RehypeShikiOptions;

interface MarkdownOptions {
  slug?: string;
  parentCollectionSlug?: string | null;
  isCollection?: boolean;
}

function normalizeDefinitionDirectives(markdown: string): string {
  return markdown.replace(/^([ \t]*):::[ \t]+definition(?=\[|[ \t]*$)/gim, '$1:::definition');
}

export async function markdownToHtml(markdown: string, options?: MarkdownOptions): Promise<string> {
  const isDev = process.env.NODE_ENV === 'development';
  const slug = options?.slug || '';
  const normalizedMarkdown = normalizeDefinitionDirectives(markdown);

  let processor = unified()
    .use(remarkParse)
    // support github flavored markdown
    .use(remarkGfm)
    // enables $…$ and $$…$$
    .use(remarkMath)
    // 2) Enable directives and convert :::spoiler → <details><summary>…</summary>…</details>
    .use(remarkDirective)
    .use(remarkSpoiler)
    .use(remarkDefinition)
    .use(remarkDiagram)
    // GitHub-style alerts: > [!NOTE], > [!TIP], etc.
    .use(remarkGithubAlerts)

    // stronger horizontal rules using '==='
    .use(remarkStrongHr)

    // transform to HTML AST
    .use(remarkRehype, { allowDangerousHtml: true })
    // support raw HTML in markdown
    .use(rehypeRaw)
    // wrap iframes in styled window
    .use(rehypeIframeWindow)
    // Add ids to headings, so section links and the table of contents can target them.
    //
    // This MUST stay ahead of rehypeKatex. KaTeX expands `$p$` into three text-bearing
    // pieces — a MathML annotation holding the TeX source, the MathML render, and the
    // visual katex-html span — so `hast-util-to-string` reads "ppp" and rehype-slug
    // minted `...modulo-ppp`. extractHeadings() below slugs the *markdown* text and
    // gets `...modulo-p`, so every table-of-contents entry for a heading containing
    // math pointed at an id that did not exist on the page. Running before KaTeX makes
    // both sides read the same text.
    .use(rehypeSlug)
    // render math equations
    .use(rehypeKatexPlugin)
    // code highlighting
    .use(rehypeShiki, rehypeShikiOptions)
    .use(rehypeAutolinkHeadings, {
      behavior: 'prepend',
      properties: { className: ['anchor-link'], ariaHidden: 'true', tabIndex: -1 },
      content: [],
    })
    .use(rehypeScopeClasses, { prefix: 'md-' })
    .use(rehypeCodeBlockCopy)
    // wrap images with skeleton placeholders (after scope classes to avoid double-prefixing)
    .use(rehypeImageWrapper);

  // In dev mode with a slug, transform relative image URLs
  if (isDev && slug) {
    processor = processor.use(rehypeDevImages, { slug, isDev });
  } else if (!isDev && slug) {
    processor = processor.use(rehypeProductionImages, {
      slug,
      isDev,
      parentCollectionSlug: options?.parentCollectionSlug,
      isCollection: options?.isCollection,
    });
  }

  const file = await processor
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(normalizedMarkdown);

  return String(file);
}

export function extractHeadings(markdown: string): Heading[] {
  // Use remarkMath to properly parse math expressions in the AST
  const tree = remark().use(remarkParse).use(remarkMath).parse(markdown);
  const headings: Heading[] = [];
  const slugger = new GithubSlugger();

  visit(tree, 'heading', (node: any) => {
    // only headings of level 1-2
    if (!node.depth || node.depth < 1 || node.depth > 2) {
      return;
    }

    // Extract text excluding math nodes
    const textParts: string[] = [];
    visit(node, (child: any) => {
      if (child.type === 'text') {
        textParts.push(child.value);
      }
      // Skip inlineMath and math nodes - they'll be excluded from text
    });

    const rawText = toString(node).trim();
    const cleanText = textParts.join('').replace(/\s+/g, ' ').trim();

    if (!cleanText) return;

    headings.push({
      id: slugger.slug(rawText), // Use original text for slug to match rendered IDs
      text: cleanText,           // Use clean text (no math) for display
      level: node.depth,
    });
  });

  return headings;
}
