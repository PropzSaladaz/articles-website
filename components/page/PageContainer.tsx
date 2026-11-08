import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

/** The centered column every non-article page sits in: wide for card grids, narrow for prose. */
export function PageContainer({ width = 'wide', children }: { width?: 'wide' | 'narrow'; children: ReactNode }) {
  return <div className={cn('mx-auto space-y-16', width === 'narrow' ? 'max-w-2xl' : 'max-w-4xl')}>{children}</div>;
}
