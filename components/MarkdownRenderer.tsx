import clsx from 'clsx';

export function MarkdownRenderer({ html, className }: { html: string; className?: string }) {
  return (
    <div
      className={clsx('prose prose-slate max-w-none dark:prose-invert', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
