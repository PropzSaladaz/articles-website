/**
 * Rehype plugin to wrap iframes in a macOS-styled window container.
 * 
 * This transforms:
 *   <iframe src="..." ...></iframe>
 * 
 * Into:
 *   <div class="md-iframe-window">
 *     <div class="md-iframe-titlebar">
 *       <span class="md-iframe-light md-iframe-light-red"></span>
 *       <span class="md-iframe-light md-iframe-light-yellow"></span>
 *       <span class="md-iframe-light md-iframe-light-green"></span>
 *     </div>
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
                // Create the macOS-style window wrapper
                const wrapper: Element = {
                    type: 'element',
                    tagName: 'div',
                    properties: { className: ['md-iframe-window'] },
                    children: [
                        {
                            type: 'element',
                            tagName: 'div',
                            properties: { className: ['md-iframe-titlebar'] },
                            children: [
                                {
                                    type: 'element',
                                    tagName: 'span',
                                    properties: { className: ['md-iframe-light', 'md-iframe-light-red'] },
                                    children: [],
                                },
                                {
                                    type: 'element',
                                    tagName: 'span',
                                    properties: { className: ['md-iframe-light', 'md-iframe-light-yellow'] },
                                    children: [],
                                },
                                {
                                    type: 'element',
                                    tagName: 'span',
                                    properties: { className: ['md-iframe-light', 'md-iframe-light-green'] },
                                    children: [],
                                },
                            ],
                        },
                        node, // The original iframe
                    ],
                };

                // Replace the iframe with the wrapped version
                (parent.children as Element[])[index] = wrapper;
            }
        });
    };
};

export default rehypeIframeWindow;
