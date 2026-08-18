import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';
import { contentPath } from '../../content/urls';

interface Options {
    slug: string;
    isDev: boolean;
    /** Deployment base path, e.g. "/articles-website". Already leading-slashed, or empty. */
    basePath?: string;
    parentCollectionSlug?: string | null;
    isCollection?: boolean;
}

/**
 * Rewrite relative image URLs to the locations `scripts/prepare-content.mjs` copies them to.
 *
 * The prefix rule mirrors that script's `canonicalPathForEntry`: content lands under
 * /articles only when it is a standalone article with no parent collection. A collection's
 * own index.md, and every chapter inside one, land under /collections. Deciding this from
 * `parentCollectionSlug` alone used to send a collection index's images to /articles/...,
 * where nothing was ever copied.
 */
const rehypeProductionImages: Plugin<[Options], Root> = ({
    slug,
    isDev,
    basePath = '',
    parentCollectionSlug,
    isCollection,
}) => {
    return (tree) => {
        if (isDev) return;

        visit(tree, 'element', (node: Element) => {
            if (node.tagName !== 'img' || !node.properties?.src) return;

            const src = String(node.properties.src);
            if (!src.startsWith('./images/') && !src.startsWith('images/')) return;

            const imagePath = src.startsWith('./') ? src.slice(2) : src;

            node.properties.src =
                `${basePath}${contentPath(slug, { collectionSlug: parentCollectionSlug, isCollection })}${imagePath}`;
        });
    };
};

export default rehypeProductionImages;
