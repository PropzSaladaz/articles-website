#!/usr/bin/env node

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { remark } from 'remark';
import { visit } from 'unist-util-visit';

const PROJECT_ROOT = process.cwd();
const CONTENT_ROOT = path.join(PROJECT_ROOT, 'content');
const PUBLIC_ROOT = path.join(PROJECT_ROOT, 'public');

const INDEX_FILENAME = 'index.md';
const IMAGE_SUFFIX = 'images';

const ENV_REPO_NAME = process.env.NEXT_REPO_NAME || '';

function slugify(value) {
  return value
    .trim()
    .replace(/^[0-9]+-/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function numericPrefixOrNull(name) {
  const match = name.match(/^([0-9]+)/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Sort directory entries by their numeric prefix, then by name.
 * Entries could be files or directories
 * @param {fs.Dirent[]} dirents - The directory entries to sort.
 * @returns {fs.Dirent[]} The sorted directory entries.
 */
function sortDirents(dirents) {
  return dirents.sort((a, b) => {
    const aNum = numericPrefixOrNull(a.name);
    const bNum = numericPrefixOrNull(b.name);
    if (aNum !== null && bNum !== null) return aNum - bNum;
    if (aNum !== null) return -1;
    if (bNum !== null) return 1;
    return a.name.localeCompare(b.name, undefined, { numeric: true });
  });
}

function hasIndex(dirAbs) {
  return fs.existsSync(path.join(dirAbs, INDEX_FILENAME));
}

function ensureContentRoot() {
  if (!fs.existsSync(CONTENT_ROOT)) {
    throw new Error(`Content directory not found: ${CONTENT_ROOT}`);
  }
}

function canonicalPathForEntry(slug, type, parentCollectionSlug) {
  const base = type === 'article' && !parentCollectionSlug ? '/articles' : '/collections';
  if (!slug) {
    return base;
  }
  return `${base}/${slug}`;
}

async function walkContent(dirAbs, slugPieces, parentCollectionSlug) {
  const results = [];
  // get direct child entries for current directory and sort them
  const dirents = sortDirents(await fsp.readdir(dirAbs, { withFileTypes: true }));
  // filter to only directories
  const childDirs = dirents.filter((entry) => entry.isDirectory());
  // check if current directory has an index.md
  const currentHasIndex = hasIndex(dirAbs);
  // filter children to those that have an index.md
  const contentChildDirs = childDirs.filter((entry) => hasIndex(path.join(dirAbs, entry.name)));
  const slug = slugPieces.join('/');

  let type = null;
  if (currentHasIndex) {
    // if has index & has 0 directories -> is article
    // if has index & has 1 or many directories -> is collection
    type = contentChildDirs.length > 0 ? 'collection' : 'article';
    const canonicalPath = canonicalPathForEntry(slug, type, parentCollectionSlug);
    const entry = {
      slug,
      folderAbs: dirAbs,
      indexPath: path.join(dirAbs, INDEX_FILENAME),
      type,
      canonicalPath,
      canonicalUrl: `${canonicalPath}/`,
      parentCollectionSlug: parentCollectionSlug ?? null,
    };
    results.push(entry);
  }

  if (type === 'collection') {
    // parse all children as part of this collection
    for (const child of contentChildDirs) {
      const childAbs = path.join(dirAbs, child.name);
      const childSlugPieces = slugPieces.length === 0
        ? [slugify(child.name)]
        : [...slugPieces, slugify(child.name)];
      const childResults = await walkContent(childAbs, childSlugPieces, slug);
      results.push(...childResults);
    }
    return results;
  }

  // otherwise, parse all children with the same parent collection
  for (const child of childDirs) {
    const childAbs = path.join(dirAbs, child.name);
    const childSlugPieces = slugPieces.length === 0
      ? [slugify(child.name)]
      : [...slugPieces, slugify(child.name)];
    const childResults = await walkContent(childAbs, childSlugPieces, parentCollectionSlug);
    results.push(...childResults);
  }

  return results;
}

async function collectEntries() {
  return walkContent(CONTENT_ROOT, [], null);
}

function normalizePath(p) {
  return path.normalize(p);
}

/**
 * Splits a link target into three components:
 *  - pathPart: the main path (before any ? or #)
 *  - query: the query string (starting with ?, if present)
 *  - hash: the hash fragment (starting with #, if present)
 *
 * This allows rewriting only the path while preserving any query
 * parameters or hash anchors exactly as they were.
 */
function splitTarget(target) {
  let pathPart = target;
  let hash = '';
  let query = '';

  const hashIndex = pathPart.indexOf('#');
  if (hashIndex !== -1) {
    hash = pathPart.slice(hashIndex);
    pathPart = pathPart.slice(0, hashIndex);
  }

  const queryIndex = pathPart.indexOf('?');
  if (queryIndex !== -1) {
    query = pathPart.slice(queryIndex);
    pathPart = pathPart.slice(0, queryIndex);
  }

  return { pathPart, hash, query };
}

/**
 * Check if a target URL is absolute or an anchor link.
 * @param {*} target 
 * @returns 
 */
function isAbsoluteOrAnchor(target) {
  if (!target) return true;
  if (target.startsWith('#')) return true;
  if (target.startsWith('/')) return true;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)) return true;
  return false;
}

function pathHasImageDir(absPath) {
  const parts = absPath.split(path.sep);
  return parts.some((segment) => segment.endsWith(IMAGE_SUFFIX));
}

function toPosixPath(p) {
  return p.split(path.sep).join('/');
}

async function findImageDirectories(entry) {
  const stack = [entry.folderAbs];
  const results = [];
  while (stack.length > 0) {
    const current = stack.pop();
    const dirents = await fsp.readdir(current, { withFileTypes: true });
    for (const dirent of dirents) {
      if (!dirent.isDirectory()) continue;
      const full = path.join(current, dirent.name);
      if (dirent.name.endsWith(IMAGE_SUFFIX)) {
        results.push(full);
        continue;
      }
      if (hasIndex(full)) {
        continue;
      }
      stack.push(full);
    }
  }
  return results;
}

async function copyDirectory(src, dest) {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else if (entry.isFile()) {
      await fsp.copyFile(srcPath, destPath);
    }
  }
}

function transformUrl(target, context) {
  const trimmed = target.trim();

  // check if target should be left untouched
  if (isAbsoluteOrAnchor(trimmed)) {
    return { changed: false, value: target };
  }

  // fetch actual image path without query/hash, if any
  const { pathPart, hash, query } = splitTarget(trimmed);
  if (!pathPart) {
    return { changed: false, value: target };
  }

  // get OS-specific path for the image
  const resolved = normalizePath(path.resolve(context.fileDir, pathPart));
  const ext = path.extname(pathPart).toLowerCase();

  if (ext === '.md' && context.indexByPath.has(resolved)) {
    const targetEntry = context.indexByPath.get(resolved);
    const newUrl = `${targetEntry.canonicalUrl}${query}${hash}`;
    return { changed: true, value: newUrl };
  }

  if (pathHasImageDir(resolved)) {
    if (!resolved.startsWith(context.entry.folderAbs)) {
      return { changed: false, value: target };
    }
    const relativeToArticle = path.relative(context.entry.folderAbs, resolved);
    if (relativeToArticle.startsWith('..')) {
      return { changed: false, value: target };
    }
    const normalizedRelative = toPosixPath(relativeToArticle);
    const newUrl = `${ENV_REPO_NAME}/${context.entry.canonicalPath}/${normalizedRelative}${query}${hash}`;
    return { changed: true, value: newUrl };
  }

  return { changed: false, value: target };
}

function rewriteLinksPlugin(context) {
  return (tree, file) => {
    let modified = false;
    visit(tree, ['link', 'image', 'definition'], (node) => {
      if (!node.url || typeof node.url !== 'string') {
        return;
      }
      const { changed, value } = transformUrl(node.url, context);
      if (changed) {
        node.url = value;
        modified = true;
      }
    });
    if (modified) {
      file.data.modified = true;
    }
  };
}

async function processMarkdownFile(entry, filePath, indexByPath) {
  const original = await fsp.readFile(filePath, 'utf8');
  const context = {
    fileDir: path.dirname(filePath),
    entry,
    indexByPath,
  };
  const processor = remark().use(rewriteLinksPlugin, context);
  const file = await processor.process(original);
  const changed = Boolean(file.data.modified);
  if (changed) {
    await fsp.writeFile(filePath, String(file));
  }
  return changed;
}

async function updateMarkdownFiles(entry, indexByPath) {
  // get all entries within the entry folder
  const dirents = await fsp.readdir(entry.folderAbs, { withFileTypes: true });
  // filter only markdown files
  const mdFiles = dirents.filter((dirent) => dirent.isFile() && dirent.name.toLowerCase().endsWith('.md'));
  const changedFiles = [];
  for (const md of mdFiles) {
    // build the path of the markdown file
    const filePath = path.join(entry.folderAbs, md.name);
    // update markdown file links
    const changed = await processMarkdownFile(entry, filePath, indexByPath);
    if (changed) {
      changedFiles.push(filePath);
    }
  }
  return changedFiles;
}

async function copyImageAssets(entry) {
  const imageDirs = await findImageDirectories(entry);
  if (imageDirs.length === 0) {
    return [];
  }
  const copied = [];
  for (const srcDir of imageDirs) {
    const relativeDir = path.relative(entry.folderAbs, srcDir);
    if (relativeDir.startsWith('..')) {
      continue;
    }
    const destBase = path.join(
      PUBLIC_ROOT,
      entry.canonicalPath.replace(/^\//, ''),
      relativeDir
    );
    await fsp.rm(destBase, { recursive: true, force: true });
    await copyDirectory(srcDir, destBase);
    copied.push({ from: srcDir, to: destBase });
  }
  return copied;
}

async function main() {
  ensureContentRoot();
  // get all individual articles & collections
  const entries = await collectEntries();
  // get the paths normalized for current OS-specific path
  const indexByPath = new Map(entries.map((entry) => [normalizePath(entry.indexPath), entry]));

  const summary = {
    updatedFiles: [],
    copiedAssets: [],
  };

  for (const entry of entries) {
    const updated = await updateMarkdownFiles(entry, indexByPath);
    summary.updatedFiles.push(...updated);
    const copied = await copyImageAssets(entry);
    summary.copiedAssets.push(...copied);
  }

  if (summary.updatedFiles.length > 0) {
    console.log(`Updated markdown references in ${summary.updatedFiles.length} file(s).`);
  }
  if (summary.copiedAssets.length > 0) {
    for (const { from, to } of summary.copiedAssets) {
      console.log(`Copied assets from ${from} to ${to}`);
    }
  }
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
