import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

const remarkDefinition: Plugin<[], Root> = () => {
  return (tree: any) => {
    visit(
      tree,
      (node: any) => node.type === 'containerDirective' && node.name === 'definition',
      (node: any) => {
        const label = typeof node.label === 'string' ? node.label.trim() : '';
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
