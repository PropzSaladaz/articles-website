import { visit } from 'unist-util-visit';
import type { Root, Element } from 'hast';
import type { Plugin } from 'unified';
import path from 'path';

interface Options {
    slug: string;
    isDev: boolean;
    repoName?: string;
    parentCollectionSlug?: string | null;
}

const rehypeProductionImages: Plugin<[Options], Root> = ({ slug, isDev, repoName = '', parentCollectionSlug }) => {
    return (tree) => {
        if (isDev) return;

        visit(tree, 'element', (node: Element) => {
            if (node.tagName === 'img' && node.properties?.src) {
                const src = String(node.properties.src);

                // Check for local relative images
                if (src.startsWith('./images/') || src.startsWith('images/')) {
                    const imagePath = src.startsWith('./') ? src.slice(2) : src;

                    // Determine canonical path prefix based on content type
                    // Logic mirrors scripts/prepare-content.mjs:
                    // - Collections: /collections/collection-slug/article-slug (or nested)
                    // - Articles: /articles/article-slug

                    // NOTE: The 'slug' passed here is the full slug (e.g. computer-science/...)
                    // But we need to know if it's an article or collection to prepend /articles or /collections
                    // The caller (md.ts) / (builders.ts) knows this context.
                    // However, builder only passes 'slug'.

                    // Let's rely on how the copying script works:
                    // It copies to public/collections/... or public/articles/...
                    // We need to match that.

                    // Actually, simpler approach:
                    // The 'slug' usually includes the hierarchy. 
                    // If we look at `content/types.ts`, `slug` is just the path parts joined.
                    // But `prepare-content.mjs` uses `canonicalPathForEntry`.

                    // We need to know if the current page is a standalone article or part of a collection.
                    // 'parentCollectionSlug' option can help.

                    const prefix = parentCollectionSlug ? '/collections' : '/articles';

                    // Clean repoName to ensure it starts with / if present
                    const cleanRepo = repoName ? (repoName.startsWith('/') ? repoName : `/${repoName}`) : '';

                    const newSrc = `${cleanRepo}${prefix}/${slug}/${imagePath}`;
                    node.properties.src = newSrc;
                }
            }
        });
    };
};

export default rehypeProductionImages;
