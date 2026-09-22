#!/usr/bin/env node

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import 'dotenv/config';

const PROJECT_ROOT = process.cwd();
const CONTENT_ROOT = path.join(PROJECT_ROOT, 'content');
const PUBLIC_ROOT = path.join(PROJECT_ROOT, 'public');

const INDEX_FILENAME = 'index.md';
const IMAGE_SUFFIX = 'images';
const CONTENT_STATUSES = new Set(['draft', 'published', 'archived']);
const INCLUDE_DRAFTS = process.argv.includes('--include-drafts');

// Shared hand-drawn renderer kit. Committed at sim-lib/ (public/ is generated),
// copied verbatim into public/sim-lib/ so simulations can load it, and its
// <script>/<link> tags are injected into opted-in simulation HTML (see
// injectSimLib). Bump SIM_LIB_VERSION alongside the sim-lib/vN directory.
const SIM_LIB_SRC = path.join(PROJECT_ROOT, 'sim-lib');
const SIM_LIB_DEST = path.join(PUBLIC_ROOT, 'sim-lib');
const SIM_LIB_VERSION = 'v1';

// Before the section restructure every page lived under /articles or /collections. All of
// that content became the `notes` section with its slug unchanged, so both legacy prefixes
// map onto /notes. Cloudflare Workers Assets reads _redirects from the assets directory root.
const LEGACY_URL_PREFIXES = ['/articles', '/collections'];
const LEGACY_REDIRECT_TARGET = '/notes';

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

/** Keep asset visibility aligned with lib/content/utilities.ts's parseStatus(). */
function readStatus(indexPath) {
  const { data } = matter(fs.readFileSync(indexPath, 'utf8'));
  if (data.status === undefined) return 'draft';
  if (typeof data.status === 'string' && CONTENT_STATUSES.has(data.status)) {
    return data.status;
  }
  throw new Error(
    `Invalid frontmatter in ${indexPath}: "status" must be one of ${Array.from(CONTENT_STATUSES).join(', ')}.`
  );
}

function ensureContentRoot() {
  if (!fs.existsSync(CONTENT_ROOT)) {
    throw new Error(`Content directory not found: ${CONTENT_ROOT}`);
  }
}

/**
 * Where an entry's assets are copied, and so its URL. A slug's first segment is its
 * section (`notes`, `writing`, `devlog`) and the URL is just the slug. This repeats
 * lib/content/urls.ts's `contentPath()` — this file is plain `.mjs` and cannot import
 * it — so keep the two in agreement by hand.
 */
function canonicalPathForEntry(slug) {
  return slug ? `/${slug}` : '';
}

async function walkContent(dirAbs, slugPieces, parentCollectionSlug, hasDraftCollectionAncestor = false) {
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
  let status = null;
  if (currentHasIndex) {
    // if has index & has 0 directories -> is article
    // if has index & has 1 or many directories -> is collection
    type = contentChildDirs.length > 0 ? 'collection' : 'article';
    status = readStatus(path.join(dirAbs, INDEX_FILENAME));
    const canonicalPath = canonicalPathForEntry(slug);
    const entry = {
      slug,
      folderAbs: dirAbs,
      indexPath: path.join(dirAbs, INDEX_FILENAME),
      type,
      status,
      isPublic: INCLUDE_DRAFTS || (status !== 'draft' && !hasDraftCollectionAncestor),
      canonicalPath,
      canonicalUrl: `${canonicalPath}/`,
      parentCollectionSlug: parentCollectionSlug ?? null,
    };
    results.push(entry);
  }

  const childHasDraftCollectionAncestor =
    hasDraftCollectionAncestor || (type === 'collection' && status === 'draft');

  if (type === 'collection') {
    // parse all children as part of this collection
    for (const child of contentChildDirs) {
      const childAbs = path.join(dirAbs, child.name);
      const childSlugPieces = slugPieces.length === 0
        ? [slugify(child.name)]
        : [...slugPieces, slugify(child.name)];
      const childResults = await walkContent(
        childAbs,
        childSlugPieces,
        slug,
        childHasDraftCollectionAncestor
      );
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
    const childResults = await walkContent(
      childAbs,
      childSlugPieces,
      parentCollectionSlug,
      childHasDraftCollectionAncestor
    );
    results.push(...childResults);
  }

  return results;
}

async function collectEntries() {
  return walkContent(CONTENT_ROOT, [], null);
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

const ASSET_DIRS = [IMAGE_SUFFIX, 'simulations'];

function pathHasAssetDir(absPath) {
  const parts = absPath.split(path.sep);
  return parts.some((segment) => ASSET_DIRS.includes(segment));
}

async function findAssetDirectories(entry) {
  const stack = [entry.folderAbs];
  const results = [];
  while (stack.length > 0) {
    const current = stack.pop();
    const dirents = await fsp.readdir(current, { withFileTypes: true });
    for (const dirent of dirents) {
      if (!dirent.isDirectory()) continue;
      const full = path.join(current, dirent.name);

      if (ASSET_DIRS.includes(dirent.name)) {
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

/**
 * Inject the sim-lib <script>/<link> tags into a simulation's HTML, opt-in via
 *   <meta name="sim-paper" content="full">
 * (any value other than "full"/"off" is ignored so future modes fail closed).
 *
 * Script paths are computed relative to the destination file, so a simulation
 * resolves them wherever `out/` happens to be mounted.
 * No-op for HTML without the meta tag, so un-migrated simulations are untouched.
 *
 * @param {string} html      source HTML
 * @param {string} destFile  absolute destination path (for relative URL math)
 * @returns {string} possibly-transformed HTML
 */
function injectSimLib(html, destFile) {
  const meta = html.match(/<meta\s+name=["']sim-paper["']\s+content=["']([^"']*)["'][^>]*>/i);
  if (!meta) return html;
  const mode = meta[1].trim().toLowerCase();
  if (mode !== 'full') return html;

  if (/data-sim-lib/i.test(html)) return html; // already injected

  const relDir = path
    .relative(path.dirname(destFile), path.join(SIM_LIB_DEST, SIM_LIB_VERSION))
    .split(path.sep)
    .join('/');
  const base = relDir === '' ? '.' : relDir;

  const tags =
    [
      '<!-- sim-lib: injected by prepare-content.mjs -->',
      '<link data-sim-lib rel="preconnect" href="https://fonts.googleapis.com">',
      '<link data-sim-lib rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
      '<link data-sim-lib rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap">',
      `<link data-sim-lib rel="stylesheet" href="${base}/paper-ui.css">`,
      `<script data-sim-lib src="${base}/vendor/rough.js"></script>`,
      `<script data-sim-lib src="${base}/sketch.js"></script>`,
    ].join('\n  ') + '\n';

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `  ${tags}</head>`);
  }
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/(<body[^>]*>)/i, `$1\n  ${tags}`);
  }
  return tags + html;
}

async function copyDirectory(src, dest, opts = {}) {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath, opts);
    } else if (entry.isFile()) {
      if (opts.injectSim && entry.name.toLowerCase().endsWith('.html')) {
        const html = await fsp.readFile(srcPath, 'utf8');
        await fsp.writeFile(destPath, injectSimLib(html, destPath));
      } else {
        await fsp.copyFile(srcPath, destPath);
      }
    }
  }
}

/** Write public/_redirects so links published before the section restructure keep working. */
async function writeLegacyRedirects() {
  const rules = LEGACY_URL_PREFIXES.map(
    (prefix) => `${prefix}/*  ${LEGACY_REDIRECT_TARGET}/:splat  301`
  );
  const dest = path.join(PUBLIC_ROOT, '_redirects');
  await fsp.mkdir(PUBLIC_ROOT, { recursive: true });
  await fsp.writeFile(dest, `${rules.join('\n')}\n`);
  return dest;
}

/** Copy the committed sim-lib/ kit into public/sim-lib/ (verbatim, no injection). */
async function copySimLib() {
  if (!fs.existsSync(SIM_LIB_SRC)) return null;
  await fsp.rm(SIM_LIB_DEST, { recursive: true, force: true });
  await copyDirectory(SIM_LIB_SRC, SIM_LIB_DEST);
  return { from: SIM_LIB_SRC, to: SIM_LIB_DEST };
}

async function copyAssets(entry) {
  const assetDirs = await findAssetDirectories(entry);
  if (assetDirs.length === 0) {
    return [];
  }
  const copied = [];
  for (const srcDir of assetDirs) {
    const relativeDir = path.relative(entry.folderAbs, srcDir);
    if (relativeDir.startsWith('..')) {
      continue;
    }
    const destBase = path.join(
      PUBLIC_ROOT,
      entry.canonicalPath.replace(/^\//, ''),
      relativeDir
    );
    // main() already wiped public/, so destBase cannot exist yet — this only guards
    // against two entries in the same run writing the same destBase, which would
    // otherwise merge an old copy's leftover files into the new one's.
    await fsp.rm(destBase, { recursive: true, force: true });
    if (!entry.isPublic) {
      continue;
    }
    const injectSim = path.basename(srcDir) === 'simulations';
    await copyDirectory(srcDir, destBase, { injectSim });
    copied.push({ from: srcDir, to: destBase });
  }
  return copied;
}

/**
 * public/ is fully generated (see CLAUDE.md) and fully gitignored, so nothing of value can
 * live there between runs. copyAssets() only clears the destination path it is about to
 * write, never a path a *previous* run wrote and this run no longer would — those go stale
 * silently, since nothing is tracked to notice them missing. That was invisible while the
 * URL scheme was stable (same slug, same destination, overwritten every run); the section
 * restructure changed every destination at once and left the old /articles and /collections
 * trees sitting in public/ (and from there, in the exported out/) indefinitely. Wiping the
 * whole directory up front is the only rule that can't drift.
 */
async function clearPublicRoot() {
  await fsp.rm(PUBLIC_ROOT, { recursive: true, force: true });
  await fsp.mkdir(PUBLIC_ROOT, { recursive: true });
}

async function main() {
  ensureContentRoot();
  await clearPublicRoot();
  // Enumerate every entry so hidden entries can have stale public assets removed.
  const entries = await collectEntries();

  const summary = {
    copiedAssets: [],
  };

  const simLib = await copySimLib();
  if (simLib) {
    console.log(`Copied sim-lib from ${simLib.from} to ${simLib.to}`);
  }

  console.log(`Wrote legacy redirects to ${await writeLegacyRedirects()}`);

  for (const entry of entries) {
    const copied = await copyAssets(entry);
    summary.copiedAssets.push(...copied);
  }

  if (summary.copiedAssets.length > 0) {
    for (const { from, to } of summary.copiedAssets) {
      console.log(`Copied assets from ${from} to ${to}`);
    }
  }
}

export { injectSimLib };

// Only run the pipeline when invoked as a script (not when imported for tests).
const invokedAsScript =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedAsScript) {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}
