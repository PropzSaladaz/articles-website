/**
 * Rehype plugin to transform relative image URLs during development.
 * 
 * In dev mode, images referenced as ./images/... need to be served from
 * the content folder. This plugin transforms them to point to the 
 * /api/dev-images route with the article slug and image path.
 */
import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';

interface Options {
    slug: string;
    isDev: boolean;
}

const rehypeDevImages: Plugin<[Options], Root> = ({ slug, isDev }) => {
    return (tree) => {
        if (!isDev) return;

        visit(tree, 'element', (node: Element) => {
            if (node.tagName === 'img' && node.properties?.src) {
                const src = String(node.properties.src);

                // Only transform relative paths that start with ./ and point to images folder
                if (src.startsWith('./images/') || src.startsWith('images/')) {
                    const imagePath = src.startsWith('./') ? src.slice(2) : src;
                    const newSrc = `/api/dev-images?slug=${encodeURIComponent(slug)}&imagePath=${encodeURIComponent(imagePath)}`;
                    node.properties.src = newSrc;
                }
            }
        });
    };
};

export default rehypeDevImages;
