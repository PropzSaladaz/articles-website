import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import remarkDirective from 'remark-directive';
import remarkMath from 'remark-math';
import remarkSpoiler from './remark-spoiler';
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



export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    // built the AST
    .use(remarkParse)
    // support github flavored markdown
    .use(remarkGfm)
    // enables $…$ and $$…$$
    .use(remarkMath)
    // 2) Enable directives and convert :::spoiler → <details><summary>…</summary>…</details>
    .use(remarkDirective)
    .use(remarkSpoiler)

    // stronger horizontal rules using '==='
    .use(remarkStrongHr)
    
    // transform to HTML AST
    .use(remarkRehype, { allowDangerousHtml: true })
    // support raw HTML in markdown
    .use(rehypeRaw as any)
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
    // add links to headings
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
    })
    // set custom classes for each HTML element - allow styling markdown content
    .use(rehypeScopeClasses, { prefix: 'md-' })
    // add copy button to code blocks
    .use(rehypeCodeBlockCopy)
    // serialize HTML AST to HTML
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return String(file);
}

export function extractHeadings(markdown: string): Heading[] {
  const tree = remark().use(remarkParse).parse(markdown);
  const headings: Heading[] = [];
  const slugger = new GithubSlugger();

  visit(tree, 'heading', (node: any) => {
    if (!node.depth || node.depth < 2 || node.depth > 4) {
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
