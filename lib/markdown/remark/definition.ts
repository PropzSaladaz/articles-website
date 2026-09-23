import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';

const remarkDefinition: Plugin<[], Root> = () => {
  return (tree: any) => {
    visit(
      tree,
      (node: any) => node.type === 'containerDirective' && node.name === 'definition',
      (node: any) => {
        // :::name[Label] surfaces as a leading child paragraph flagged
        // data.directiveLabel — not a node.label string — so it must be
        // pulled out of the body and flattened for use as the title.
        let label = '';
        const first = node.children?.[0];
        if (first?.type === 'paragraph' && first.data?.directiveLabel) {
          label = toString(first).trim();
          node.children = node.children.slice(1);
        }
        // Labels are sometimes written as `[**Term:**]`; the bold is
        // flattened by toString, the trailing colon is dropped here.
        label = label.replace(/[:.]\s*$/, '');
        const title = label ? `Definition (${label}).` : 'Definition.';

        const titleNode = {
          type: 'strong',
          data: { hProperties: { className: ['md-definition-title'] } },
          children: [{ type: 'text', value: title }],
        };

        // Textbook-style run-in label: "Definition (Term). Body text…".
        // Bodies that open with display math or a table get the label on
        // its own line instead.
        const body = node.children ?? [];
        if (body[0]?.type === 'paragraph') {
          body[0].children = [titleNode, { type: 'text', value: ' ' }, ...body[0].children];
        } else {
          body.unshift({ type: 'paragraph', children: [titleNode] });
        }
        node.children = body;

        node.data ||= {};
        node.data.hName = 'aside';
        node.data.hProperties = {
          className: ['md-definition'],
        };
      }
    );
  };
};

export default remarkDefinition;
