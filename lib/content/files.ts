import 'server-only'; // prevent accidental client-side usage

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export const CONTENT_ROOT = path.join(process.cwd(), 'content');
export const NAMESPACE_CHAPTER_SLUGS = true; // set false to keep chapter slugs un-namespaced

/**
 * Check if a path is a directory.
 * @param p Path to check
 * @returns True if the path is a directory, false otherwise
 */
export function isDir(p: string) { 
    try { 
        return fs.statSync(p).isDirectory(); 
    } catch { 
        return false; 
    } 
}


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
 * Derive the cover image path from frontmatter or fallback to a default.
 * @param front The frontmatter data
 * @param folderAbs The absolute path to the folder containing the article
 * @returns The relative path to the cover image, or null if not found
 */
export function deriveCover(front: any, folderAbs: string): string | null {
  const key = front.coverImage ?? front.cover ?? null;
  if (typeof key !== 'string') return null;
  const rel = key.trim();
  const abs = path.resolve(folderAbs, rel);
  if (isFile(abs)) return rel;
  return rel; // keep as-is for client resolution
}