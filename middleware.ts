import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.next();
    }

    const { pathname } = request.nextUrl;

    console.log('[middleware] pathname:', pathname);

    // Match /articles/.../images/... OR /collections/.../images/...
    const imagesMatch = pathname.match(/\/(articles|collections)\/(.+)\/(images\/.+)$/);

    if (imagesMatch) {
        const slug = imagesMatch[2];
        const imagePath = imagesMatch[3];

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