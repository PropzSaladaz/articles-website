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

    const iframes = container.querySelectorAll('iframe');
    const iframeCleanup: Array<() => void> = [];

    iframes.forEach((iframe) => {
      // Must have the rehype wrapper
      const wrapper = iframe.closest('.md-iframe-window') as HTMLElement;
      if (!wrapper) return;

      // Ensure no duplicates
      if (wrapper.querySelector('.sim-controls-btn')) return;

      // Floats directly over the simulation's top-right corner (wrapper is
      // already `relative` from the rehype plugin) instead of living in a
      // top bar — there's no top bar anymore.
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'sim-controls-btn absolute top-3 right-3 z-10 pointer-events-auto';

      const button = document.createElement('button');
      // Solid-ish dark pill so it stays legible over any simulation
      // background (dark or paper-cream) it happens to float above.
      button.className = 'flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-slate-200 bg-slate-900/80 hover:bg-slate-800 backdrop-blur-sm shadow-md transition-colors';

      // Inline SVGs for Play and Pause
      const playIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-play"><polygon points="6 3 20 12 6 21 6 3"/></svg>`;
      const pauseIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pause"><rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/></svg>`;

      // Start showing "Play" — simulations begin paused
      button.innerHTML = `${playIcon} Play`;
      buttonContainer.appendChild(button);
      wrapper.appendChild(buttonContainer);

      let isPaused = true;
      let isManuallyPaused = false;
      let isInView = false;

      const pause = () => {
        isPaused = true;
        const cw = iframe.contentWindow as any;
        if (cw) cw.__sim_paused__ = true;
        if (cw?.audioCtx && typeof cw.audioCtx.suspend === 'function' && cw.audioCtx.state === 'running') {
          cw.audioCtx.suspend();
        }
        button.innerHTML = `${playIcon} Play`;
      };

      const resume = () => {
        isPaused = false;
        const cw = iframe.contentWindow as any;
        if (cw) {
          cw.__sim_paused__ = false;
          if (cw.__sim_rAF_cb__) {
            const cb = cw.__sim_rAF_cb__;
            cw.__sim_rAF_cb__ = null;
            cw.requestAnimationFrame(cb);
          }
          if (cw.audioCtx && typeof cw.audioCtx.resume === 'function' && cw.audioCtx.state === 'suspended') {
            cw.audioCtx.resume();
          }
        }
        button.innerHTML = `${pauseIcon} Pause`;
      };

      const interceptAF = () => {
        const cw = iframe.contentWindow as any;
        if (!cw || cw.__sim_initialized__) return;

        cw.__sim_initialized__ = true;
        cw.__sim_paused__ = true;
        cw.__sim_rAF_cb__ = null;

        const originalAF = cw.requestAnimationFrame;

        cw.requestAnimationFrame = function (cb: FrameRequestCallback) {
          if (cw.__sim_paused__) {
            cw.__sim_rAF_cb__ = cb;
            return 999999;
          }
          return originalAF.call(cw, cb);
        };

        // If IO already reported this iframe as in-view before it finished loading, resume now
        if (isInView && !isManuallyPaused) {
          resume();
        }
      };

      if ((iframe.contentDocument && iframe.contentDocument.readyState === 'complete') || iframe.contentDocument?.readyState === 'interactive') {
        interceptAF();
      }
      iframe.addEventListener('load', interceptAF);

      button.addEventListener('click', () => {
        if (isPaused) {
          isManuallyPaused = false;
          resume();
        } else {
          isManuallyPaused = true;
          pause();
        }
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isInView = entry.isIntersecting;
            if (entry.isIntersecting) {
              if (!isManuallyPaused) resume();
            } else {
              pause();
            }
          });
        },
        { threshold: 0.25 }
      );

      observer.observe(iframe);
      iframeCleanup.push(() => observer.disconnect());
    });

    // ── Animated details (spoilers + alerts) ─────────────────────────────
    const allDetails = container.querySelectorAll<HTMLDetailsElement>('details');
    const detailCleanup: Array<() => void> = [];

    allDetails.forEach((details) => {
      const summary = details.querySelector<HTMLElement>(':scope > summary');
      if (!summary) return;

      const animateOpen = () => {
        details.open = true;
        const contentHeight = details.scrollHeight - summary.offsetHeight;
        details.style.height = `${summary.offsetHeight}px`;
        details.style.overflow = 'hidden';
        requestAnimationFrame(() => {
          details.style.transition = 'height 0.32s cubic-bezier(0.4,0,0.2,1)';
          details.style.height = `${summary.offsetHeight + contentHeight}px`;
          details.addEventListener('transitionend', () => {
            details.style.height = '';
            details.style.overflow = '';
            details.style.transition = '';
          }, { once: true });
        });
      };

      const animateClose = () => {
        const currentHeight = details.scrollHeight;
        details.style.height = `${currentHeight}px`;
        details.style.overflow = 'hidden';
        requestAnimationFrame(() => {
          details.style.transition = 'height 0.25s cubic-bezier(0.4,0,0.2,1)';
          details.style.height = `${summary.offsetHeight}px`;
          details.addEventListener('transitionend', () => {
            details.open = false;
            details.style.height = '';
            details.style.overflow = '';
            details.style.transition = '';
          }, { once: true });
        });
      };

      const handleClick = (e: MouseEvent) => {
        e.preventDefault();
        if (details.open) {
          animateClose();
        } else {
          animateOpen();
        }
      };

      summary.addEventListener('click', handleClick);
      detailCleanup.push(() => summary.removeEventListener('click', handleClick));
    });

    return () => {
      iframeCleanup.forEach(fn => fn());
      detailCleanup.forEach(fn => fn());
    };
  }, [html]);

  return (
    <div
      ref={containerRef}
      className={clsx(base, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
