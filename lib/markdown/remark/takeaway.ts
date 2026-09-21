import type { Root } from 'mdast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

// :::takeaway ... ::: → <aside class="md-takeaway"> — a non-collapsible,
// prominent one-line distillation, distinct from md-definition (terminology)
// and md-alert (collapsible admonitions).
const remarkTakeaway: Plugin<[], Root> = () => {
  return (tree: any) => {
    visit(
      tree,
      (node: any) => node.type === 'containerDirective' && node.name === 'takeaway',
      (node: any) => {
        node.data ||= {};
        node.data.hName = 'aside';
        node.data.hProperties = {
          className: ['md-takeaway'],
        };
      }
    );
  };
};

export default remarkTakeaway;
