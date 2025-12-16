/**
 * Rehype plugin to wrap images in a container with a skeleton placeholder.
 * This prevents layout shift while images are loading.
 * 
 * Transforms:
 *   <img src="..." alt="..." />
 * 
 * Into:
 *   <figure class="image-loading-wrapper">
 *     <div class="image-skeleton"></div>
 *     <img src="..." alt="..." loading="lazy" onload="..." />
 *   </figure>
 */
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';

const rehypeImageWrapper: Plugin<[], Root> = () => {
    return (tree) => {
        visit(tree, 'element', (node: Element, index, parent) => {
            if (!parent || index === undefined) return;

            if (node.tagName === 'img') {
                // Add loading="lazy" and onload handler to the image
                node.properties = node.properties || {};
                node.properties.loading = 'lazy';
                node.properties.onload = "this.classList.add('loaded');this.parentElement.querySelector('.image-skeleton')?.classList.add('hidden')";

                // Create the skeleton placeholder
                const skeleton: Element = {
                    type: 'element',
                    tagName: 'div',
                    properties: { className: ['image-skeleton'] },
                    children: [],
                };

                // Create the wrapper container
                const wrapper: Element = {
                    type: 'element',
                    tagName: 'figure',
                    properties: { className: ['image-loading-wrapper'] },
                    children: [skeleton, node],
                };

                // Replace the image with the wrapped version
                (parent.children as Element[])[index] = wrapper;
            }
        });
    };
};

export default rehypeImageWrapper;

