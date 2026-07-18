// remark-strong-hr.ts
import { visit } from 'unist-util-visit';

const STRONG_HR_MARKERS = new Set(['===', '...']);

export default function remarkStrongHr() {
  return (tree: any) => {
    visit(tree, (node, index, parent) => {
      // Look for a paragraph whose only child is a section-break marker.
      if (
        node.type === 'paragraph' &&
        node.children?.length === 1 &&
        node.children[0].type === 'text' &&
        STRONG_HR_MARKERS.has(node.children[0].value.trim())
      ) {
        // Replace it with a styled separator element.
        parent.children[index as number] = {
          type: 'paragraph',
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
