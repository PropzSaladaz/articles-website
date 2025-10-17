/**
 * Slugify a string.
 * @param s String to slugify
 * @returns Slugified string
 */
export function slugify(s: string) {
  return s
    .trim()
    // Remove numeric prefixes like "01-"
    .replace(/^[0-9]+-/, '')
    // Convert spaces to dashes
    .replace(/\s+/g, '-')
    // Remove invalid characters
    .replace(/[^a-zA-Z0-9\-]/g, '')
    // Collapse multiple dashes
    .replace(/--+/g, '-')
    // Trim dashes from start and end
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/**
 * Get the numeric prefix of a folder name, if it exists.
 * @param name Folder name
 * @returns Numeric prefix or null
 */
export function numericPrefixOrNull(name: string): number | null {
  const m = name.match(/^([0-9]+)/);
  return m ? parseInt(m[1], 10) : null;
}

export function pathToId(slug: string) {
  return Buffer.from(slug || '/').toString('base64url').slice(0, 16);
}

/**
 * Basic validation for article frontmatter.
 * @param data Frontmatter data
 * @param filePath Path to the Markdown file
 */
export function ensureBasics(
  data: Record<string, unknown>,
  filePath: string,
  { requireSlug = true }: { requireSlug?: boolean } = {}
) {
  const titleOk = typeof data.title === 'string' && data.title.trim().length > 0;
  if (!titleOk) throw new Error(`Invalid frontmatter in ${filePath}: "title" must be non-empty.`);

  const dateStr = String(data.date ?? '');
  const date = new Date(dateStr);
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new Error(`Invalid frontmatter in ${filePath}: "date" must be a valid ISO date.`);
  }

  if (requireSlug) {
    const slugOk = typeof data.slug === 'string' && data.slug.trim().length > 0;
    if (!slugOk) throw new Error(`Invalid frontmatter in ${filePath}: "slug" must be non-empty.`);
  }
}