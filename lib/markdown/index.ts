import { unified, type Plugin } from 'unified';
import type { Root } from 'hast';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import rehypeShiki, { type RehypeShikiOptions } from '@shikijs/rehype';
import {
  remarkSpoiler,
  remarkDefinition,
  remarkDiagram,
  remarkGithubAlerts,
  remarkStrongHr,
} from './remark';
import {
  rehypeIframeWindow,
  rehypeScopeClasses,
  rehypeCodeBlockCopy,
  rehypeImageWrapper,
  rehypeDevImages,
  rehypeProductionImages,
  rehypeCollectHeadings,
} from './rehype';
import type { Heading } from '../content/types';

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

export type MarkdownRender = {
  html: string;
  headings: Heading[];
};

function normalizeDefinitionDirectives(markdown: string): string {
  return markdown.replace(/^([ \t]*):::[ \t]+definition(?=\[|[ \t]*$)/gim, '$1:::definition');
}

export async function renderMarkdown(
  markdown: string,
  options?: MarkdownOptions
): Promise<MarkdownRender> {
  const isDev = process.env.NODE_ENV === 'development';
  const slug = options?.slug || '';
  const normalizedMarkdown = normalizeDefinitionDirectives(markdown);

  let processor = unified()
    // =========================
    // Markdown AST parsing
    // =========================
    // markdown source → mdast; the parser every remark plugin below transforms
    .use(remarkParse)
    // support github flavored markdown
    .use(remarkGfm)
    // enables $…$ and $$…$$
    .use(remarkMath)
    // parse ::: fences into generic directive nodes for the three plugins below
    .use(remarkDirective)
    // :::spoiler[Title] → <details><summary>Title</summary>…</details>
    .use(remarkSpoiler)
    // :::definition[Term] → <aside class="md-definition"> with a generated title
    .use(remarkDefinition)
    // :::flow / :::branch / :::compare → .content-diagram block layouts
    .use(remarkDiagram)
    // GitHub-style alerts: > [!NOTE], > [!TIP], etc.
    .use(remarkGithubAlerts)
    // a lone '===' or '...' paragraph → styled section separator
    .use(remarkStrongHr)

    // transform to HTML AST
    .use(remarkRehype, { allowDangerousHtml: true })

    // =========================
    // HTML AST processing
    // =========================
    // re-parse the raw HTML remarkRehype passed through into real elements
    .use(rehypeRaw)
    // wrap each <iframe> in div.md-iframe-window (needs rehypeRaw's elements)
    .use(rehypeIframeWindow)
    // Assign heading ids and capture the matching TOC entries before KaTeX expands
    // each expression into MathML plus visual HTML. The plugin owns both outputs.
    .use(rehypeCollectHeadings)
    // render inlineMath/math nodes into KaTeX MathML + HTML
    .use(rehypeKatexPlugin)
    // syntax-highlight <pre><code> into themed spans
    .use(rehypeShiki, rehypeShikiOptions)
    // prepend a clickable anchor to each heading, using the ids above
    .use(rehypeAutolinkHeadings, {
      behavior: 'prepend',
      properties: { className: ['anchor-link'], ariaHidden: 'true', tabIndex: -1 },
      content: [],
    })
    // stamp md-* classes on every element — the hook styles/markdown.css targets
    .use(rehypeScopeClasses, { prefix: 'md-' })
    // wrap <pre> in .code-block with a header + copy button carrying the raw source
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

  return {
    html: String(file),
    headings: (file.data.headings as Heading[] | undefined) ?? [],
  };
}

/** Render Markdown when callers only need HTML. */
export async function markdownToHtml(markdown: string, options?: MarkdownOptions): Promise<string> {
  return (await renderMarkdown(markdown, options)).html;
}
