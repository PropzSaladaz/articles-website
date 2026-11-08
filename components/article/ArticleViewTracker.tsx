'use client';

import { useEffect, useRef } from 'react';

export function ArticleViewTracker({ slug }: { slug: string }) {
  const trackedSlug = useRef<string | null>(null);

  useEffect(() => {
    // React can re-run effects during development. Count once per mounted route,
    // while still counting a real reload or a later client-side navigation.
    if (trackedSlug.current === slug) return;
    trackedSlug.current = slug;

    void fetch('/api/article-views', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {
      // Analytics must never interrupt reading the article.
    });
  }, [slug]);

  return null;
}
