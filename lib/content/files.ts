import 'server-only'; // prevent accidental client-side usage

import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';

export const CONTENT_ROOT = path.join(process.cwd(), 'content');

/**
 * Check if a path is a file.
 * @param p Path to check
 * @returns True if the path is a file, false otherwise
 */
export function isFile(p: string) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/**
 * Load a Markdown file and extract its frontmatter and content.
 * @param filePath Path to the Markdown file
 * @returns An object containing the frontmatter and content
 */
export function loadMarkdown(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);
  return { data, content, raw };
}

/**
 * Read the cover image path out of frontmatter, as authored.
 *
 * The path is deliberately left relative and unverified: it is resolved on the client
 * against the article's public/ directory, which does not exist yet at load time.
 * @param front The frontmatter data
 * @returns The relative path to the cover image, or null if none is declared
 */
export function deriveCover(front: any): string | null {
  const key = front.coverImage ?? front.cover ?? null;
  if (typeof key !== 'string') return null;
  return key.trim();
}
