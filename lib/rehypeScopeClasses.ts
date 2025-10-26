// rehypeScopeClasses.ts
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

type Options = {
  /** Class prefix, e.g., "md-" → "md-p", "md-h2", "md-table"... */
  prefix?: string;
};

/**
 * Add predictable classes + data attributes to all Markdown-produced elements.
 * - Headings: md-heading + md-h{1..6}
 * - Paragraphs: md-p
 * - Lists: md-ul / md-ol / md-li
 * - Blockquotes: md-blockquote
 * - Tables: md-table / md-thead / md-tbody / md-tr / md-th / md-td
 * - Links: md-a (so you can remove default underlines, add icons, etc.)
 * - Strong/Em: md-strong / md-em
 * - Inline code: md-code-inline
 * - Code blocks: md-pre + data-lang="ts" (etc.) on <pre>, md-code-block on <code>
 * - Details/Summary: md-details / md-summary
 */
const rehypeScopeClasses: Plugin<[Options?], Root> = (opts) => {
  const prefix = (opts?.prefix ?? 'md-').trim();
  const cls = (name: string) => `${prefix}${name}`;

  return (tree) => {
    visit(tree, 'element', (node: Element, _idx, parent) => {
      const tag = node.tagName;
      const props = (node.properties ??= {});
      const className = (props.className ??= []) as Array<string>;

      // helper to append a class (avoid duplicates)
      const add = (c: string) => {
        if (!c) return;
        if (Array.isArray(className)) {
          if (!className.includes(c)) className.push(c);
        }
      };

      // Base tag classes
      switch (tag) {
        case 'p':
          add(cls('p'));
          break;

        case 'h1': case 'h2': case 'h3':
        case 'h4': case 'h5': case 'h6': {
          add(cls('heading'));
          add(cls(`h${tag.slice(1)}`)); // md-h1 .. md-h6
          break;
        }

        case 'blockquote':
          add(cls('blockquote'));
          break;

        case 'ul': add(cls('ul')); break;
        case 'ol': add(cls('ol')); break;
        case 'li': add(cls('li')); break;

        case 'table': add(cls('table')); break;
        case 'thead': add(cls('thead')); break;
        case 'tbody': add(cls('tbody')); break;
        case 'tr': add(cls('tr')); break;
        case 'th': add(cls('th')); break;
        case 'td': add(cls('td')); break;

        case 'a':
          add(cls('a'));
          break;

        case 'strong':
          add(cls('strong'));
          break;

        case 'em':
          add(cls('em'));
          break;

        case 'img':
          add(cls('img'));
          break;

        case 'details':
          add(cls('details'));
          break;

        case 'summary':
          add(cls('summary'));
          break;

        case 'code': {
          // Inline vs block code
          const isBlock = parent && (parent as Element).tagName === 'pre';
          if (isBlock) {
            add(cls('code-block'));
          } else {
            add(cls('code-inline'));
          }

          // Ensure code has a language class like "language-ts" if present
          // (remark→rehype usually sets this already from the fenced info string)
          break;
        }

        case 'pre': {
          add(cls('pre'));

          // Attach data-lang to <pre> by inspecting its child <code class="language-xyz">
          const firstChild = (node.children?.[0] ?? null) as Element | null;
          if (firstChild && firstChild.type === 'element' && firstChild.tagName === 'code') {
            const codeProps = (firstChild.properties ?? {}) as Record<string, any>;
            const langs: string[] = Array.isArray(codeProps.className)
              ? (codeProps.className as string[]).filter((c) => c.startsWith('language-'))
              : typeof codeProps.className === 'string'
                ? codeProps.className.split(/\s+/).filter((c) => c.startsWith('language-'))
                : [];

            if (langs.length) {
              const lang = langs[0].replace(/^language-/, '');
              // data-lang for CSS targeting; also add md-pre--lang-xyz helper class
              (node.properties as any)['data-lang'] = lang;
              add(cls(`pre--lang-${lang}`));
            }
          }

          break;
        }
      }
    });
  };
};

export default rehypeScopeClasses;
