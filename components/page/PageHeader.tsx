import { cn } from '../../lib/utils';
import { IconBadge } from './IconBadge';
import type { IconStyle } from './subjectIcons';

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Small line above the title, e.g. "Collection · 5 chapters". */
  eyebrow?: string;
  iconStyle?: IconStyle;
  size?: 'default' | 'large';
};

export function PageHeader({ title, description, eyebrow, iconStyle, size = 'default' }: PageHeaderProps) {
  return (
    <header className="space-y-4">
      {(iconStyle || eyebrow) && (
        <div className="flex items-center gap-3">
          {iconStyle && <IconBadge style={iconStyle} />}
          {eyebrow && <span className="text-sm font-medium text-muted-foreground">{eyebrow}</span>}
        </div>
      )}
      <h1
        className={cn(
          'font-serif font-semibold tracking-tight text-foreground',
          size === 'large' ? 'text-4xl sm:text-5xl' : 'text-4xl'
        )}
      >
        {title}
      </h1>
      {description && <p className="font-serif text-lg leading-relaxed text-muted-foreground">{description}</p>}
    </header>
  );
}
