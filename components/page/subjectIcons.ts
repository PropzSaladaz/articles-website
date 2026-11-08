import { AudioWaveform, Box, Cpu, KeyRound, type LucideIcon } from 'lucide-react';

/** An icon plus the tint its `<IconBadge>` is drawn in. */
export type IconStyle = {
  icon: LucideIcon;
  /** Badge background + icon color. Literal class strings so Tailwind's JIT sees them. */
  accent: string;
};

/**
 * Icons for the subject folders in the notes tree (fields like Computer Science
 * and the subjects under them), keyed by the folder's own slug segment (its name
 * run through `slugify`, lowercased here). Subject folders have no `index.md` and
 * so no frontmatter to carry an icon — this map is the place to add one when a
 * new subject folder appears. Unlisted subjects just render without an icon.
 */
const SUBJECT_STYLES: Record<string, IconStyle> = {
  'computer-science': { icon: Cpu, accent: 'bg-slate-500/10 text-slate-600 dark:text-slate-300' },
  cryptography: { icon: KeyRound, accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
  'dsp-acoustic-fundamentals': {
    icon: AudioWaveform,
    accent: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  '3d-programming': { icon: Box, accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
};

function segmentsOf(slug: string) {
  return slug.split('/').filter(Boolean).map((segment) => segment.toLowerCase());
}

/** The style of the subject folder at exactly this slug. */
export function subjectStyle(slug: string): IconStyle | undefined {
  return SUBJECT_STYLES[segmentsOf(slug).pop() ?? ''];
}

export function subjectIcon(slug: string): LucideIcon | undefined {
  return subjectStyle(slug)?.icon;
}

/**
 * The style of the deepest subject folder on the slug's path, so a collection
 * (or article) inside a subject is drawn with that subject's icon and tint.
 */
export function nearestSubjectStyle(slug: string): IconStyle | undefined {
  const segments = segmentsOf(slug);
  for (let i = segments.length - 1; i >= 0; i--) {
    const style = SUBJECT_STYLES[segments[i]];
    if (style) return style;
  }
  return undefined;
}
