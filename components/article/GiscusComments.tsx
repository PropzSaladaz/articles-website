'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

type GiscusCommentsProps = {
  discussionIdentifier: string;
};

const GISCUS_REPO = process.env.NEXT_PUBLIC_GISCUS_REPO;
const GISCUS_REPO_ID = process.env.NEXT_PUBLIC_GISCUS_REPO_ID;
const GISCUS_CATEGORY = process.env.NEXT_PUBLIC_GISCUS_CATEGORY;
const GISCUS_CATEGORY_ID = process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID;
const GISCUS_MAPPING = process.env.NEXT_PUBLIC_GISCUS_MAPPING ?? 'pathname';
const GISCUS_STRICT = process.env.NEXT_PUBLIC_GISCUS_STRICT ?? '0';
// Off by default: a page-level "0 reactions" block floats between the heading and
// the thread and adds noise; readers can still react to individual comments.
const GISCUS_REACTIONS_ENABLED = process.env.NEXT_PUBLIC_GISCUS_REACTIONS_ENABLED ?? '0';
const GISCUS_EMIT_METADATA = process.env.NEXT_PUBLIC_GISCUS_EMIT_METADATA ?? '0';
const GISCUS_INPUT_POSITION = process.env.NEXT_PUBLIC_GISCUS_INPUT_POSITION ?? 'top';
const GISCUS_LANG = process.env.NEXT_PUBLIC_GISCUS_LANG ?? 'en';
const GISCUS_LOADING = process.env.NEXT_PUBLIC_GISCUS_LOADING ?? 'lazy';

/**
 * Giscus runs in a giscus.app iframe, so the site's CSS can't style it. Instead it
 * gets a custom theme by URL: giscus/{light,dark}.css, copied to public/giscus/ by
 * scripts/prepare-content.mjs and served with a CORS header (giscus.app fetches it
 * cross-origin). The URL must be absolute, hence window.location.origin.
 */
function giscusThemeUrl(resolvedTheme: string | undefined) {
  const mode = resolvedTheme === 'dark' ? 'dark' : 'light';
  return `${window.location.origin}/giscus/${mode}.css`;
}

function createScriptAttributes(discussionIdentifier: string, theme: string) {
  const attributes: Record<string, string> = {
    src: 'https://giscus.app/client.js',
    'data-repo': GISCUS_REPO ?? '',
    'data-repo-id': GISCUS_REPO_ID ?? '',
    'data-category': GISCUS_CATEGORY ?? '',
    'data-category-id': GISCUS_CATEGORY_ID ?? '',
    'data-mapping': GISCUS_MAPPING,
    'data-strict': GISCUS_STRICT,
    'data-reactions-enabled': GISCUS_REACTIONS_ENABLED,
    'data-emit-metadata': GISCUS_EMIT_METADATA,
    'data-input-position': GISCUS_INPUT_POSITION,
    'data-theme': theme,
    'data-lang': GISCUS_LANG,
    'data-loading': GISCUS_LOADING,
    crossorigin: 'anonymous',
  };

  if (GISCUS_MAPPING === 'specific' || GISCUS_MAPPING === 'number') {
    attributes['data-term'] = discussionIdentifier;
  }

  return attributes satisfies Record<string, string>;
}

function applyThemeToGiscus(theme: string) {
  const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
  if (!iframe || !iframe.contentWindow) {
    return false;
  }

  iframe.contentWindow.postMessage(
    {
      giscus: {
        setConfig: {
          theme,
        },
      },
    },
    'https://giscus.app'
  );

  return true;
}

export function GiscusComments({ discussionIdentifier }: GiscusCommentsProps) {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isConfigured = Boolean(
    GISCUS_REPO && GISCUS_REPO_ID && GISCUS_CATEGORY && GISCUS_CATEGORY_ID,
  );

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    const script = document.createElement('script');
    const attributes = createScriptAttributes(discussionIdentifier, giscusThemeUrl(resolvedTheme));
    Object.entries(attributes).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });
    script.async = true;
    container.appendChild(script);
  }, [discussionIdentifier, isConfigured]);

  useEffect(() => {
    const giscusTheme = giscusThemeUrl(resolvedTheme);
    if (applyThemeToGiscus(giscusTheme)) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const observer = new MutationObserver(() => {
      if (applyThemeToGiscus(giscusTheme)) {
        observer.disconnect();
      }
    });

    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [resolvedTheme]);

  if (!isConfigured) {
    if (process.env.NODE_ENV === 'development') {
      return (
        <p className="rounded-lg border border-dashed border-border bg-muted p-4 text-sm text-muted-foreground">
          Comments are disabled because the Giscus environment variables are not configured.
        </p>
      );
    }
    return null;
  }

  return <div ref={containerRef} />;
}
