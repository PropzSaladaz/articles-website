import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug, getCollectionBySlug } from '@/lib/content/content';
import fs from 'fs';
import path from 'path';
import mime from 'mime';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    if (process.env.NODE_ENV !== 'development') {
        return new NextResponse('Not Found', { status: 404 });
    }

    console.log('[dev-images] Full URL:', request.url);

    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const imagePath = searchParams.get('imagePath');

    console.log('[dev-images] slug:', slug, '| imagePath:', imagePath);

    if (!slug || !imagePath) {
        console.error('[dev-images] Missing params!');
        return new NextResponse('Missing parameters', { status: 400 });
    }

    let target = await getArticleBySlug(slug);
    if (!target) {
        target = await getCollectionBySlug(slug);
    }

    console.log('[dev-images] Found target:', !!target, '| folderAbs:', target?.folderAbs);

    if (!target || !target.folderAbs) {
        return new NextResponse('Not found', { status: 404 });
    }

    const fullPath = path.resolve(target.folderAbs, imagePath);
    console.log('[dev-images] fullPath:', fullPath);

    if (!fullPath.startsWith(target.folderAbs)) {
        return new NextResponse('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(fullPath)) {
        console.error('[dev-images] File not found:', fullPath);
        return new NextResponse('Image not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(fullPath);
    const mimeType = mime.getType(fullPath) || 'application/octet-stream';
    return new NextResponse(fileBuffer, {
        headers: { 'Content-Type': mimeType, 'Cache-Control': 'no-store' },
    });
}