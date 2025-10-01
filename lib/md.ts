import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeRaw from 'rehype-raw';
import rehypeStringify from 'rehype-stringify';
import { remark } from 'remark';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import GithubSlugger from 'github-slugger';

export async function markdownToHtml(markdown: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: 'wrap',
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return String(file);
}

export type Heading = {
  id: string;
  text: string;
  level: number;
};

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
