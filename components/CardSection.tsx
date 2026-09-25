import type { ReactNode } from 'react';
import { CardGrid } from './CardGrid';
import { IconBadge } from './IconBadge';
import type { IconStyle } from './subjectIcons';

type CardSectionProps = {
  title: string;
  /** Small line under the title, e.g. "3 topics". */
  caption?: string;
  iconStyle?: IconStyle;
  columns?: 2 | 3;
  /** One card per row, as an ordered list — see `CardGrid`. */
  ordered?: boolean;
  children: ReactNode;
};

/** A titled group of `<ContentCard>`s: optional icon badge, heading + caption, then the grid. */
export function CardSection({ title, caption, iconStyle, columns, ordered, children }: CardSectionProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-center gap-3">
        {iconStyle && <IconBadge style={iconStyle} />}
        <div>
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          {caption && <p className="text-sm text-muted-foreground">{caption}</p>}
        </div>
      </div>
      <CardGrid columns={columns} ordered={ordered}>{children}</CardGrid>
    </section>
  );
}
