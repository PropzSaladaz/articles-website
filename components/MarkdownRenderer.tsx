// MarkdownRenderer.tsx
import clsx from 'clsx';

type Props = {
  html: string;
  className?: string;
  /** If you still want Tailwind Typography, keep it, but we also add "md" */
  useProse?: boolean;
};

export function MarkdownRenderer({ html, className, useProse = false }: Props) {
  const base = useProse
    ? 'prose prose-slate max-w-none dark:prose-invert md' // keep .md so our selectors match
    : 'md max-w-none';

  return (
    <>
      <div
        className={clsx(base, className)}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
