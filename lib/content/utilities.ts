import { ContentStatus } from "./types";

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
 * Convert a folder name into a human-readable title.
 * @param folderName Folder name to convert
 * @returns Title-cased string
 */
export function titleFromFolder(folderName: string) {
  const cleaned = folderName
    .replace(/^[0-9]+[-_]/, '') // drop numeric prefix if present
    .replace(/[-_]+/g, ' ')
    .trim();

  if (!cleaned) return folderName;

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function parseStatus(value: unknown, filePath: string): ContentStatus {
  const allowed = new Set(['draft', 'published', 'archived']);
  if (typeof value === 'string' && allowed.has(value)) {
    return value as ContentStatus;
  }
  if (value === undefined) {
    return 'draft';
  }
  throw new Error(
    `Invalid frontmatter in ${filePath}: "status" must be one of ${Array.from(allowed).join(', ')}.`
  );
}

export function extractTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === 'string').map((tag) => tag.trim()).filter(Boolean);
}
