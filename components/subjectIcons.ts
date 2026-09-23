import { AudioWaveform, Box, Cpu, KeyRound, type LucideIcon } from 'lucide-react';

/**
 * Icons for the subject folders in the notes tree (fields like Computer Science
 * and the subjects under them), keyed by the folder's own slug segment (its name
 * run through `slugify`, lowercased here). Subject folders have no `index.md` and
 * so no frontmatter to carry an icon — this map is the place to add one when a
 * new subject folder appears. Unlisted subjects just render without an icon.
 */
const SUBJECT_ICONS: Record<string, LucideIcon> = {
  'computer-science': Cpu,
  cryptography: KeyRound,
  'dsp-acoustic-fundamentals': AudioWaveform,
  '3d-programming': Box,
};

export function subjectIcon(slug: string): LucideIcon | undefined {
  const segment = slug.split('/').filter(Boolean).pop() ?? '';
  return SUBJECT_ICONS[segment.toLowerCase()];
}
