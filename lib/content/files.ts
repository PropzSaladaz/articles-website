import 'server-only'; // prevent accidental client-side usage

import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import type { Frontmatter } from './frontmatter';

export const CONTENT_ROOT = path.join(process.cwd(), 'content');

/**
 * Check if a path is a file.
 * @param p Path to check
 * @returns True if the path is a file, false otherwise
 */
export function isFile(p: string) {
  try {
    return fs.statSync(p).isFile();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return false;
    }
    throw error;
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
  return { data: data as Frontmatter, content, raw };
}
