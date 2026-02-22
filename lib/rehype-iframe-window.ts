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
                // Create the macOS-style top bar
                const topBar: Element = {
                    type: 'element',
                    tagName: 'div',
                    properties: {
                        className: [
                            'flex',
                            'items-center',
                            'h-10',
                            'px-4',
                            'bg-slate-900', // Always dark
                            'border-b',
                            'border-slate-800', // Always dark
                            'sim-top-bar' // identifier for attaching the button later
                        ]
                    },
                    children: [
                        {
                            type: 'element',
                            tagName: 'div',
                            properties: { className: ['flex', 'gap-2'] },
                            children: [
                                { type: 'element', tagName: 'div', properties: { className: ['w-3', 'h-3', 'rounded-full', 'bg-red-400', 'dark:bg-red-500'] }, children: [] },
                                { type: 'element', tagName: 'div', properties: { className: ['w-3', 'h-3', 'rounded-full', 'bg-amber-400', 'dark:bg-amber-500'] }, children: [] },
                                { type: 'element', tagName: 'div', properties: { className: ['w-3', 'h-3', 'rounded-full', 'bg-green-400', 'dark:bg-green-500'] }, children: [] }
                            ]
                        }
                    ]
                };

                // Create a simple wrapper with rounded corners
                const wrapper: Element = {
                    type: 'element',
                    tagName: 'div',
                    properties: {
                        className: [
                            'md-iframe-window',
                            'relative',
                            'overflow-hidden',
                            'rounded-xl', // Make it rounded-xl for standard macOS window shape
                            'border',
                            'border-slate-800', // Enforce dark border to match the dark top bar
                            'my-14',
                            'bg-slate-900', // Background is also dark so the card fits seamlessly
                            'flex',
                            'flex-col'
                        ],
                    },
                    children: [topBar, node], // The top bar, then the original iframe
                };

                // Replace the iframe with the wrapped version
                (parent.children as Element[])[index] = wrapper;
            }
        });
    };
};

export default rehypeIframeWindow;

