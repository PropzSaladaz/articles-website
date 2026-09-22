import type { Slug } from './types';

/**
 * The single source of truth for the three editorial sections a top-level
 * `content/` folder can be. Mirrors `urls.ts`: dependency-free (type-only
 * imports) so client components and the esbuild-bundled Worker can both
 * import it.
 */
export type SectionId = 'notes' | 'writing' | 'devlog';

export type Section = {
  id: SectionId;
  label: string;
  tagline: string;
  /** Curriculum order follows folder/numeric-prefix order; chronological sorts by date. */
  order: 'curriculum' | 'chronological';
  /** Whether the section's sidebar nav is a collapsible tree or a flat list. */
  nav: 'tree' | 'list';
  feed: boolean;
};

export const SECTIONS: Record<SectionId, Section> = {
  notes: {
    id: 'notes',
    label: 'Notes',
    tagline: 'The mental cache — concept explainers, worked through with simulations.',
    order: 'curriculum',
    nav: 'tree',
    feed: true,
  },
  writing: {
    id: 'writing',
    label: 'Writing',
    tagline: 'Essays, opinions, and eureka moments.',
    order: 'chronological',
    nav: 'list',
    feed: true,
  },
  devlog: {
    id: 'devlog',
    label: 'Devlog',
    tagline: 'Dated entries from personal projects, as they happen.',
    order: 'chronological',
    nav: 'list',
    feed: true,
  },
};

export const SECTION_LIST: Section[] = Object.values(SECTIONS);

/**
 * The section a slug belongs to, i.e. its first path segment. Works equally on a
 * bare slug ("notes/foo") or a URL pathname ("/notes/foo/") since the leading and
 * trailing separators are stripped before reading the first segment.
 */
export function sectionOf(slug: Slug): SectionId | null {
  const first = slug.split('/').filter(Boolean)[0];
  return first && first in SECTIONS ? (first as SectionId) : null;
}
