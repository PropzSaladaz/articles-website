/** Non-interactive labels for authored article tags. */
export function TagList({ tags }: { tags?: readonly string[] }) {
  if (!tags?.length) return null;

  return (
    <ul aria-label="Tags" className="flex flex-wrap gap-1.5">
      {tags.map((tag, index) => (
        <li
          key={`${tag}-${index}`}
          className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
        >
          {tag}
        </li>
      ))}
    </ul>
  );
}
