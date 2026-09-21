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
        const title = label ? `Definition: ${label}` : 'Definition';

        const titleNode = {
          type: 'paragraph',
          data: {
            hName: 'p',
            hProperties: { className: ['md-definition-title'] },
          },
          children: [{ type: 'text', value: title }],
        };

        node.data ||= {};
        node.data.hName = 'aside';
        node.data.hProperties = {
          className: ['md-definition'],
        };
        node.children = [titleNode, ...(node.children ?? [])];
      }
    );
  };
};

export default remarkDefinition;
