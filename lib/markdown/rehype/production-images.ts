import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';
import { contentPath } from '../../content/urls';

interface Options {
    slug: string;
    isDev: boolean;
}

/**
 * Rewrite relative image URLs to the locations `scripts/prepare-content.mjs` copies them to.
 *
 * Assets land at the content's own URL (`contentPath(slug)`), which that script's
 * `canonicalPathForEntry` mirrors — keep the two in agreement.
 */
const rehypeProductionImages: Plugin<[Options], Root> = ({ slug, isDev }) => {
    return (tree) => {
        if (isDev) return;

        visit(tree, 'element', (node: Element) => {
            if (node.tagName !== 'img' || !node.properties?.src) return;

            const src = String(node.properties.src);
            if (!src.startsWith('./images/') && !src.startsWith('images/')) return;

            const imagePath = src.startsWith('./') ? src.slice(2) : src;

            node.properties.src = `${contentPath(slug)}${imagePath}`;
        });
    };
};

export default rehypeProductionImages;
