import type { Element, Root } from 'hast';
import { toString } from 'hast-util-to-string';
import GithubSlugger from 'github-slugger';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Heading } from '../../content/types';

type Options = {
  numberHeadings?: boolean;
};

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

function nextSectionNumber(counters: number[], level: number): string {
  const currentIndex = level - 1;
  counters[currentIndex] += 1;
  counters.fill(0, currentIndex + 1);
  return counters.slice(0, level).join('.');
}

/**
 * Assign heading IDs and collect the h1/h2 table-of-contents entries from the
 * same HAST tree. The output lives on the current VFile, so no state can leak
 * from one rendered article into another.
 */
const rehypeCollectHeadings: Plugin<[Options?], Root> = (options) => {
  return (tree, file) => {
    const slugger = new GithubSlugger();
    const headings: Heading[] = [];
    const sectionCounters = [0, 0, 0, 0, 0, 0];

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

      const number = options?.numberHeadings
        ? nextSectionNumber(sectionCounters, level)
        : undefined;

      if (number) {
        const numberElement: Element = {
          type: 'element',
          tagName: 'span',
          properties: { className: ['md-section-number'] },
          children: [{ type: 'text', value: number }],
        };
        node.children.unshift(numberElement, { type: 'text', value: ' ' });
      }

      if (level <= 2) {
        headings.push({ id, text, level, ...(number ? { number } : {}) });
      }
    });

    file.data.headings = headings;
  };
};

export default rehypeCollectHeadings;
