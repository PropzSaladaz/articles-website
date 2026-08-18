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
                // No top bar and no border: the simulation content should be
                // the whole visible surface, not framed as an "app window".
                // The play/pause button (injected in MarkdownRenderer.tsx)
                // floats directly over the iframe's top-right corner instead.
                const wrapper: Element = {
                    type: 'element',
                    tagName: 'div',
                    properties: {
                        className: [
                            'md-iframe-window',
                            'relative',
                            'overflow-hidden',
                            'rounded-xl',
                            'my-14',
                            'bg-slate-900', // Fallback color visible briefly while the iframe loads
                        ],
                    },
                    children: [node],
                };

                // Replace the iframe with the wrapped version
                (parent.children as Element[])[index] = wrapper;
            }
        });
    };
};

export default rehypeIframeWindow;

