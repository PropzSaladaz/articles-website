import { Children, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

type CardGridProps = {
  columns?: 2 | 3;
  /**
   * An ordered run (a collection's chapters): one card per row, so reading order is
   * never scrambled across columns, and an `<ol>` so assistive tech announces position.
   */
  ordered?: boolean;
  children: ReactNode;
};

export function CardGrid({ columns = 2, ordered = false, children }: CardGridProps) {
  if (ordered) {
    return (
      <ol className="grid gap-4">
        {Children.map(children, (child) => (
          <li className="grid">{child}</li>
        ))}
      </ol>
    );
  }
  return <div className={cn('grid gap-4 sm:grid-cols-2', columns === 3 && 'lg:grid-cols-3')}>{children}</div>;
}
