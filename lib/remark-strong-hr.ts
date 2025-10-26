// remark-strong-hr.js
import { visit } from 'unist-util-visit';

export default function remarkStrongHr() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      // Look for a paragraph whose only child is "===" (ignoring whitespace)
      if (
        node.type === 'paragraph' &&
        node.children?.length === 1 &&
        node.children[0].type === 'text' &&
        node.children[0].value.trim() === '==='
      ) {
        // Replace it with an <p> element
        parent.children[index as number] = {
        type: 'paragraph', // easiest way to inject a generic element via mdast→hast
        data: {
            hName: 'div',
            hProperties: {
            role: 'separator',
            className: ['md-hr-strong', 'md-hr-dots'],
            'aria-hidden': 'true',
            },
        },
        children: [], // no content; CSS will inject dots
        };
      }
    });
  };
}
