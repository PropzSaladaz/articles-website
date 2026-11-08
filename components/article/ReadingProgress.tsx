'use client';

import { useEffect, useState, useCallback, useRef, useSyncExternalStore } from 'react';
import { cn } from '../../lib/utils';
import type { Heading } from '../../lib/content/types';

// Store for scroll state - avoids re-rendering parent components
let scrollListeners: Set<() => void> = new Set();
let currentProgress = 0;
let currentActiveHeadingId: string | null = null;

function subscribeToScroll(callback: () => void) {
    scrollListeners.add(callback);
    return () => scrollListeners.delete(callback);
}

function getProgress() {
    return currentProgress;
}

function getActiveHeadingId() {
    return currentActiveHeadingId;
}

function notifyListeners() {
    scrollListeners.forEach(listener => listener());
}

/**
 * Reading progress bar component - self-contained, doesn't cause parent re-renders
 */
export function ReadingProgressBar({ contentSelector = 'article' }: { contentSelector?: string }) {
    const progress = useSyncExternalStore(subscribeToScroll, getProgress, getProgress);

    useEffect(() => {
        const updateProgress = () => {
            const article = document.querySelector(contentSelector);
            if (!article) return;

            const articleRect = article.getBoundingClientRect();
            const windowHeight = window.innerHeight;

            const articleTop = articleRect.top + window.scrollY;
            const articleHeight = articleRect.height;
            const scrollY = window.scrollY;

            const startPoint = articleTop - windowHeight * 0.1;
            const endPoint = articleTop + articleHeight - windowHeight * 0.9;

            let progressPercent = 0;
            if (scrollY <= startPoint) {
                progressPercent = 0;
            } else if (scrollY >= endPoint) {
                progressPercent = 100;
            } else {
                progressPercent = ((scrollY - startPoint) / (endPoint - startPoint)) * 100;
            }

            const newProgress = Math.min(100, Math.max(0, progressPercent));
            if (Math.abs(newProgress - currentProgress) > 0.5) {
                currentProgress = newProgress;
                notifyListeners();
            }
        };

        let rafId: number | null = null;
        const handleScroll = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateProgress);
        };

        updateProgress();
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [contentSelector]);

    return (
        <div
            className="fixed top-[72px] left-0 right-0 z-50 h-1 bg-muted/30"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading progress"
        >
            <div
                className="h-full bg-primary transition-[width] duration-150 ease-out"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}

/**
 * Table of contents with active section highlighting - self-contained
 */
export function TableOfContents({ headings }: { headings: Heading[] }) {
    const activeHeadingId = useSyncExternalStore(subscribeToScroll, getActiveHeadingId, getActiveHeadingId);

    useEffect(() => {
        if (headings.length === 0) return;

        const updateActiveHeading = () => {
            const windowHeight = window.innerHeight;
            let activeId: string | null = null;

            for (let i = headings.length - 1; i >= 0; i--) {
                const heading = headings[i];
                const element = document.getElementById(heading.id);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    if (rect.top <= windowHeight * 0.3) {
                        activeId = heading.id;
                        break;
                    }
                }
            }

            if (activeId !== currentActiveHeadingId) {
                currentActiveHeadingId = activeId;
                notifyListeners();
            }
        };

        let rafId: number | null = null;
        const handleScroll = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(updateActiveHeading);
        };

        updateActiveHeading();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [headings]);

    return (
        <nav aria-label="On this page">
            <div className="text-sm">
                <h2 className="text-sm font-semibold text-foreground">On this page</h2>
                <ul className="mt-3 space-y-2 border-l border-border">
                    {headings.map((heading) => {
                        const isActive = activeHeadingId === heading.id;
                        return (
                            <li
                                key={heading.id}
                                className="transition-all duration-200"
                            >
                                <a
                                    href={`#${heading.id}`}
                                    className={cn(
                                        // The active marker overlays the list's left rail.
                                        '-ml-px block border-l-2 transition-colors duration-200',
                                        heading.level > 1 ? 'pl-6' : 'pl-3',
                                        isActive
                                            ? 'border-primary font-medium text-foreground'
                                            : 'border-transparent text-muted-foreground hover:text-foreground'
                                    )}
                                >
                                    {heading.number && (
                                        <span className="mr-1.5 tabular-nums">{heading.number}</span>
                                    )}
                                    {heading.text}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </nav>
    );
}
