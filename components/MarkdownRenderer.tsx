// MarkdownRenderer.tsx
'use client';

import clsx from 'clsx';
import { useEffect, useRef } from 'react';

type Props = {
  html: string;
  className?: string;
  /** If you still want Tailwind Typography, keep it, but we also add "md" */
  useProse?: boolean;
};

export function MarkdownRenderer({ html, className, useProse = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const base = useProse
    ? 'prose prose-slate max-w-none dark:prose-invert md' // keep .md so our selectors match
    : 'md max-w-none';

  // Add load event listeners to images to trigger fade-in animation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const images = container.querySelectorAll('img');

    images.forEach((img) => {
      // If already loaded (cached), add loaded class immediately
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        // Otherwise, wait for load event
        const handleLoad = () => {
          img.classList.add('loaded');
        };
        img.addEventListener('load', handleLoad);
        // Cleanup not strictly needed but good practice
      }
    });
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={clsx(base, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

