import { cn } from '../../lib/utils';
import type { IconStyle } from './subjectIcons';

const SIZES = {
  sm: { box: 'h-8 w-8 rounded-md', icon: 'h-4 w-4' },
  md: { box: 'h-10 w-10 rounded-lg', icon: 'h-5 w-5' },
};

/** A subject/section icon on a soft tinted square — the site's main splash of color. */
export function IconBadge({ style, size = 'md' }: { style: IconStyle; size?: keyof typeof SIZES }) {
  const { icon: Icon, accent } = style;
  return (
    <span className={cn('flex shrink-0 items-center justify-center', SIZES[size].box, accent)}>
      <Icon className={SIZES[size].icon} aria-hidden />
    </span>
  );
}
