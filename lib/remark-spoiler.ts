// remark-spoiler.js
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';

export default function remarkSpoiler() {
  return (tree: any) => {
    visit(tree, (node: any) => node.type === 'containerDirective' && node.name === 'spoiler', (node) => {
      node.data ||= {};
      // 1) Title from label: :::spoiler[Title]
      // 2) Fallback: first paragraph inside block
      let title = (node.label && node.label.trim()) || 'Details';

      if (!node.label && node.children && node.children[0]?.type === 'paragraph') {
        const p = node.children[0];
        const text = toString(p).trim();
        if (text) {
          title = text;
          node.children = node.children.slice(1); // remove that title paragraph
        }
      }

      const summary = {
        type: 'paragraph',
        data: { hName: 'summary' },
        children: [{ type: 'text', value: title }],
      };

      const body = node.children?.length ? node.children : [{ type: 'paragraph', children: [] }];

      node.data.hName = 'details';
      node.data.hProperties ||= {};
      node.children = [summary, ...body];
    });
  };
}
