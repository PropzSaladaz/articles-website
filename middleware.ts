import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.next();
    }

    const { pathname } = request.nextUrl;

    console.log('[middleware] pathname:', pathname);

    // Match /<slug>/images/... — a slug is the URL path (see lib/content/urls.ts). The
    // leading segment is required so a bare /images/... never matches; dev-images
    // answers 404 for any path that is not real content.
    const imagesMatch = pathname.match(/^\/(.+)\/(images\/.+)$/);

    if (imagesMatch) {
        const slug = imagesMatch[1];
        const imagePath = imagesMatch[2];

        console.log('[middleware] Matched! slug:', slug, '| imagePath:', imagePath);

        const apiUrl = new URL(`/api/dev-images?slug=${encodeURIComponent(slug)}&imagePath=${encodeURIComponent(imagePath)}`, request.url);
        console.log('[middleware] Rewriting to:', apiUrl.toString());
        return NextResponse.rewrite(apiUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};