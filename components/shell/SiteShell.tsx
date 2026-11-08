'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import type { ArticlePreview, SubjectNode } from '../../lib/content/types';
import { SECTION_LIST, sectionOf, type SectionId } from '../../lib/content/sections';
import { contentPath } from '../../lib/content/urls';
import { cn } from '../../lib/utils';
import { TreeNavigation } from './TreeNavigation';
import { SectionListNav } from './SectionListNav';
import { ThemeToggle } from './ThemeToggle';
import { PanelLeftClose, PanelLeft, Menu, X } from 'lucide-react';

const DEFAULT_SIDEBAR_WIDTH = 256;
const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 460;
const COLLAPSE_THRESHOLD = 80;
const HEADER_HEIGHT = 72;
// The sidebar overlays the page, so it only starts open where it clears the centered
// content column (max-w-5xl = 1024px, plus a sidebar's width on each side).
const AUTO_COLLAPSE_BREAKPOINT = 1024 + 2 * DEFAULT_SIDEBAR_WIDTH;

type SiteShellProps = {
  tree: SubjectNode;
  sectionArticles: Partial<Record<Exclude<SectionId, 'notes'>, ArticlePreview[]>>;
  children: ReactNode;
};

export function SiteShell({ tree, sectionArticles, children }: SiteShellProps) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const toggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const sidebarPanelRef = useRef<HTMLDivElement | null>(null);

  // sectionOf reads the first non-empty path segment, so it works directly on a
  // pathname ("/notes/x/") as well as a bare content slug.
  const activeSection = sectionOf(pathname || '');
  const notesNode = useMemo(() => tree.children?.find((child) => child.slug === 'notes'), [tree]);

  const sidebarContent = useMemo(() => {
    if (activeSection === 'notes') {
      return notesNode ? <TreeNavigation tree={notesNode} /> : null;
    }
    if (activeSection === 'writing' || activeSection === 'devlog') {
      const section = SECTION_LIST.find((candidate) => candidate.id === activeSection);
      return (
        <SectionListNav
          label={section?.label ?? activeSection}
          articles={sectionArticles[activeSection] ?? []}
        />
      );
    }
    return null;
  }, [activeSection, notesNode, sectionArticles]);

  const hasSidebar = sidebarContent !== null;
  const dragOriginRef = useRef(0);
  const lastExpandedWidthRef = useRef(DEFAULT_SIDEBAR_WIDTH);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

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

  const handleToggleSidebar = useCallback(() => {
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
    setIsMobileNavOpen(false);
  }, [pathname]);

  // Collapse on load below the breakpoint, and again only when a resize *crosses* it —
  // not on every resize, or zooming / opening devtools would close a sidebar the
  // reader just opened by hand.
  useEffect(() => {
    let wasWide: boolean | null = null;
    const syncSidebarForViewport = () => {
      const isWide = window.innerWidth >= AUTO_COLLAPSE_BREAKPOINT;
      if (!isWide && wasWide !== false) {
        setIsSidebarCollapsed(true);
        setSidebarWidth(0);
      }
      wasWide = isWide;
    };

    syncSidebarForViewport();
    window.addEventListener('resize', syncSidebarForViewport, { passive: true });

    return () => {
      window.removeEventListener('resize', syncSidebarForViewport);
    };
  }, []);

  // A collapsed panel is only faded out, so `inert` takes its links out of the tab
  // order (and the accessibility tree). Set on the node: React 18 has no `inert` prop.
  useEffect(() => {
    if (sidebarPanelRef.current) sidebarPanelRef.current.inert = isSidebarCollapsed;
  }, [isSidebarCollapsed, hasSidebar]);

  // Light dismiss: Esc always closes the overlay; a click on the page closes it only
  // where the viewport is narrow enough for it to be covering content.
  useEffect(() => {
    if (!hasSidebar || isSidebarCollapsed) return;

    const collapse = () => {
      lastExpandedWidthRef.current = sidebarWidth || DEFAULT_SIDEBAR_WIDTH;
      setIsSidebarCollapsed(true);
      setSidebarWidth(0);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') collapse();
    };
    const handlePointerDownOutside = (event: PointerEvent) => {
      if (window.innerWidth >= AUTO_COLLAPSE_BREAKPOINT) return;
      const target = event.target as Node;
      if (sidebarRef.current?.contains(target) || toggleButtonRef.current?.contains(target)) return;
      collapse();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', handlePointerDownOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', handlePointerDownOutside);
    };
  }, [hasSidebar, isSidebarCollapsed, sidebarWidth]);

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
      <header
        className="sticky top-0 z-30 site-bar"
      >
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            ST
          </Link>
          <nav aria-label="Primary" className="hidden items-center gap-1 text-sm font-medium sm:flex">
            {SECTION_LIST.map((section) => (
              <Link
                key={section.id}
                href={contentPath(section.id)}
                className={cn(
                  'rounded-md px-3 py-1.5 transition-colors',
                  activeSection === section.id
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {section.label}
              </Link>
            ))}
            <Link
              href="/about"
              className={cn(
                'rounded-md px-3 py-1.5 transition-colors',
                pathname === '/about' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              About
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Floating sidebar toggle button */}
      {hasSidebar && (
        <button
          ref={toggleButtonRef}
          onClick={handleToggleSidebar}
          className="hidden lg:flex fixed left-0 z-40 items-center justify-center w-8 h-8 rounded-r-md border border-l-0 border-border bg-background transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-background hover:w-10 shadow-sm opacity-60 hover:opacity-100"
          style={{ top: HEADER_HEIGHT + 16 }}
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isSidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      )}

      {hasSidebar && (
        <div className="border-b border-border bg-background lg:hidden">
          <div className="mx-auto w-full max-w-6xl px-3 py-2 sm:px-4">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium text-foreground"
              aria-expanded={isMobileNavOpen}
              aria-controls="mobile-navigation-panel"
            >
              <span className="inline-flex items-center gap-2">
                <Menu className="h-4 w-4" />
                Browse topics
              </span>
              {isMobileNavOpen ? <X className="h-4 w-4" /> : <span className="text-xs text-muted-foreground">Open</span>}
            </button>
            <div
              id="mobile-navigation-panel"
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-200 ease-out',
                isMobileNavOpen ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-background px-2 py-2">
                  {sidebarContent}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 items-stretch" ref={containerRef}>
        {/* Overlay: fixed under the header, so opening it never reflows the page body. */}
        {hasSidebar && (
          <aside
            ref={sidebarRef}
            className={cn(
              'fixed left-0 z-20 hidden overflow-hidden bg-background lg:flex',
              !isSidebarCollapsed && 'border-r border-border shadow-xl'
            )}
            style={{
              width: isSidebarCollapsed ? '0px' : `${sidebarWidth}px`,
              transition: isDragging ? 'none' : 'width 0.2s ease',
              top: HEADER_HEIGHT,
              height: `calc(100vh - ${HEADER_HEIGHT}px)`,
            }}
          >
            <div
              ref={sidebarPanelRef}
              className={cn(
                'w-full overflow-y-auto px-3 pb-6 pt-14 transition-opacity duration-200',
                isSidebarCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
              )}
            >
              {sidebarContent}
            </div>
            {!isSidebarCollapsed && (
              <div
                role="separator"
                aria-orientation="vertical"
                aria-label="Resize navigation"
                tabIndex={-1}
                className={cn(
                  'absolute inset-y-0 right-0 w-2 cursor-col-resize select-none transition-colors duration-150',
                  isDragging ? 'bg-border' : 'bg-transparent hover:bg-border/60'
                )}
                style={{ touchAction: 'none' }}
                onPointerDown={handlePointerDown}
                onDoubleClick={handleDoubleClick}
              />
            )}
          </aside>
        )}
        <main className="flex-1 min-w-0">
          <div className="mx-auto w-full max-w-5xl px-3 py-8 sm:px-4 sm:py-12 lg:py-16">{children}</div>
        </main>
      </div>

      <footer className="border-t border-border bg-background py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Sidnei Teixeira</span>
          <a href="/rss.xml" className="transition-colors hover:text-foreground">
            RSS
          </a>
        </div>
      </footer>
    </div>
  );
}
