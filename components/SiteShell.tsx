'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Collection, SubjectNode } from '../lib/content/types';
import { getBasePath } from '../lib/paths';
import { TreeNavigation } from './TreeNavigation';

type SiteShellProps = {
  tree: SubjectNode;
  collections: Collection[];
  children: ReactNode;
};

export function SiteShell({ tree, collections, children }: SiteShellProps) {
  const basePath = getBasePath();

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-5">
          <Link href={`${basePath}/`} className="text-xl font-semibold tracking-tight">
            Sid Makes Sense
          </Link>
          <span className="hidden text-sm font-medium text-muted-foreground sm:inline-flex">
            Personal blog by Sidnei Teixeira
          </span>
        </div>
      </header>

      <div className="border-b border-border/60 bg-background/90 lg:hidden">
        <div className="mx-auto max-h-80 w-full max-w-6xl overflow-y-auto px-4 py-4">
          <TreeNavigation tree={tree} collections={collections} />
        </div>
      </div>

      <div className="flex flex-1">
        <aside className="hidden w-72 shrink-0 border-r border-border/60 bg-background/80 backdrop-blur lg:block xl:w-80">
          <div className="sticky top-[5.25rem] max-h-[calc(100vh-5.25rem)] overflow-y-auto px-4 py-6">
            <TreeNavigation tree={tree} collections={collections} />
          </div>
        </aside>
        <main className="flex-1">
          <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:py-16">{children}</div>
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
