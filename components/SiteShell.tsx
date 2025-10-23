'use client';

import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import type { Collection, SubjectNode } from '../lib/content/types';
import { getBasePath } from '../lib/paths';
import { cn } from '../lib/utils';
import { TreeNavigation } from './TreeNavigation';
import { ThemeToggle } from './ThemeToggle';

const DEFAULT_SIDEBAR_WIDTH = 288;
const MIN_SIDEBAR_WIDTH = 224;
const MAX_SIDEBAR_WIDTH = 460;
const COLLAPSE_THRESHOLD = 80;

type SiteShellProps = {
  tree: SubjectNode;
  collections: Collection[];
  children: ReactNode;
};

export function SiteShell({ tree, collections, children }: SiteShellProps) {
  const basePath = getBasePath();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragOriginRef = useRef(0);
  const lastExpandedWidthRef = useRef(DEFAULT_SIDEBAR_WIDTH);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isSidebarCollapsed && sidebarWidth > 0) {
      lastExpandedWidthRef.current = sidebarWidth;
    }
  }, [isSidebarCollapsed, sidebarWidth]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    dragOriginRef.current = rect.left;
    setIsDragging(true);
    event.preventDefault();
  }, []);

  const handleDoubleClick = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      if (prev) {
        const restoredWidth = Math.min(
          MAX_SIDEBAR_WIDTH,
          Math.max(MIN_SIDEBAR_WIDTH, lastExpandedWidthRef.current || DEFAULT_SIDEBAR_WIDTH)
        );
        setSidebarWidth(restoredWidth);
        return false;
      }
      lastExpandedWidthRef.current = sidebarWidth || DEFAULT_SIDEBAR_WIDTH;
      setSidebarWidth(0);
      return true;
    });
  }, [sidebarWidth]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const containerLeft = dragOriginRef.current;
      const rawWidth = event.clientX - containerLeft;
      const clampedWidth = Math.max(0, Math.min(MAX_SIDEBAR_WIDTH, rawWidth));

      if (clampedWidth <= COLLAPSE_THRESHOLD) {
        setIsSidebarCollapsed(true);
        setSidebarWidth(0);
        return;
      }

      const nextWidth = Math.max(MIN_SIDEBAR_WIDTH, clampedWidth);
      lastExpandedWidthRef.current = nextWidth;
      setSidebarWidth(nextWidth);
      setIsSidebarCollapsed(false);
    };

    const stopDragging = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);
    window.addEventListener('pointercancel', stopDragging);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
      window.removeEventListener('pointercancel', stopDragging);
    };
  }, [isDragging]);

  useEffect(() => {
    if (!isDragging) return;
    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
    };
  }, [isDragging]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <Link href={`${basePath}/`} className="text-xl font-semibold tracking-tight">
            Sid Makes Sense
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline-flex">
              Personal blog by Sidnei Teixeira
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="border-b border-border bg-background lg:hidden">
        <div className="mx-auto max-h-80 w-full max-w-6xl overflow-y-auto px-4 py-4">
          <TreeNavigation tree={tree} collections={collections} />
        </div>
      </div>

      <div className="flex flex-1" ref={containerRef}>
        <aside
          className={cn(
            'relative hidden shrink-0 overflow-hidden bg-background backdrop-blur transition-[width] duration-200 ease-out lg:flex',
            isSidebarCollapsed ? 'border-r border-transparent' : 'border-r border-border'
          )}
          style={{
            width: isSidebarCollapsed ? '0px' : `${sidebarWidth}px`,
            minWidth: isSidebarCollapsed ? '0px' : `${sidebarWidth}px`,
            transition: isDragging ? 'none' : 'width 0.2s ease',
          }}
        >
          <div
            className={cn(
              'sticky top-[5.25rem] max-h-[calc(100vh-5.25rem)] overflow-y-auto px-4 py-6 transition-opacity duration-200',
              isSidebarCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
            )}
            aria-hidden={isSidebarCollapsed}
          >
            <TreeNavigation tree={tree} collections={collections} />
          </div>
        </aside>
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize navigation"
          tabIndex={-1}
          className={cn(
            'hidden w-2 cursor-col-resize select-none transition-colors duration-150 lg:block',
            isDragging ? 'bg-border' : 'bg-transparent hover:bg-border/60'
          )}
          style={{ touchAction: 'none' }}
          onPointerDown={handlePointerDown}
          onDoubleClick={handleDoubleClick}
        />
        <main className="flex-1 min-w-0">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:py-16">{children}</div>
        </main>
      </div>

      <footer className="border-t border-border/60 bg-background/80 py-8 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Sidnei Teixeira. All rights reserved.</span>
          <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.3em] text-muted-foreground/80">
            Built with care
          </span>
        </div>
      </footer>
    </div>
  );
}
