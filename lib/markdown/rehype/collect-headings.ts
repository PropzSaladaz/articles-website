import type { Element, Root } from 'hast';
import { toString } from 'hast-util-to-string';
import GithubSlugger from 'github-slugger';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Heading } from '../../content/types';

function headingLevel(node: Element): number | null {
  const match = /^h([1-6])$/.exec(node.tagName.toLowerCase());
  return match ? Number(match[1]) : null;
}

function headingText(node: Element): string {
  // This plugin runs before rehype-katex, when each math expression still has
  // one text representation. Reading after KaTeX would duplicate MathML and
  // visual output in both the id and the label.
  return toString(node).replace(/\s+/g, ' ').trim();
}

/**
 * Assign heading IDs and collect the h1/h2 table-of-contents entries from the
 * same HAST tree. The output lives on the current VFile, so no state can leak
 * from one rendered article into another.
 */
const rehypeCollectHeadings: Plugin<[], Root> = () => {
  return (tree, file) => {
    const slugger = new GithubSlugger();
    const headings: Heading[] = [];

    visit(tree, 'element', (node) => {
      const level = headingLevel(node);
      if (level === null) return;

      const text = headingText(node);
      if (!text) return;

      // Preserve an explicitly authored id. Otherwise mint the id and advance
      // the slugger for every h1–h6, even
      // though the table of contents only displays h1 and h2 entries.
      const existingId = node.properties.id;
      const id = typeof existingId === 'string' ? existingId : slugger.slug(text);
      node.properties.id = id;

      if (level <= 2) {
        headings.push({ id, text, level });
      }
    });

    file.data.headings = headings;
  };
};

export default rehypeCollectHeadings;
