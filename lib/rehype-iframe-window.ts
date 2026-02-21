/**
 * Rehype plugin to wrap iframes in a simple rounded container.
 * 
 * This transforms:
 *   <iframe src="..." ...></iframe>
 * 
 * Into:
 *   <div class="md-iframe-window">
 *     <iframe src="..." ...></iframe>
 *   </div>
 */
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';

const rehypeIframeWindow: Plugin<[], Root> = () => {
    return (tree) => {
        visit(tree, 'element', (node: Element, index, parent) => {
            if (!parent || index === undefined) return;

            if (node.tagName === 'iframe') {
                // Create a simple wrapper with rounded corners
                const wrapper: Element = {
                    type: 'element',
                    tagName: 'div',
                    properties: { className: ['md-iframe-window'] },
                    children: [node], // The original iframe
                };

                // Replace the iframe with the wrapped version
                (parent.children as Element[])[index] = wrapper;
            }
        });
    };
};

export default rehypeIframeWindow;

