import type { ContentStatus } from './types';
import { parseStatus } from './utilities';

export type Frontmatter = Record<string, unknown>;

type SharedFrontmatter = {
  status: ContentStatus;
  summary: string | null;
  cover: string | null;
};

export type ArticleFrontmatter = SharedFrontmatter & {
  date: string | null;
  featured: boolean;
};

export type CollectionFrontmatter = SharedFrontmatter;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function invalidField(filePath: string, field: string, expectation: string): never {
  throw new Error(`Invalid frontmatter in ${filePath}: "${field}" ${expectation}.`);
}

function parseOptionalString(value: unknown, field: string, filePath: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    invalidField(filePath, field, 'must be a string');
  }
  return value.trim() || null;
}

function parseOptionalDate(value: unknown, filePath: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !ISO_DATE.test(value)) {
    invalidField(filePath, 'date', 'must be a valid YYYY-MM-DD string');
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    invalidField(filePath, 'date', 'must be a valid calendar date');
  }
  return date.toISOString();
}

function parseFeatured(value: unknown, filePath: string): boolean {
  if (value === undefined) return false;
  if (typeof value !== 'boolean') {
    invalidField(filePath, 'featured', 'must be a boolean');
  }
  return value;
}

function parseSharedFrontmatter(data: Frontmatter, filePath: string): SharedFrontmatter {
  return {
    status: parseStatus(data.status, filePath),
    summary: parseOptionalString(data.summary, 'summary', filePath),
    // Keep the existing coverImage-over-cover precedence while validating both
    // authored values when they are present.
    cover:
      parseOptionalString(data.coverImage, 'coverImage', filePath) ??
      parseOptionalString(data.cover, 'cover', filePath),
  };
}

/** Parse and validate frontmatter for a leaf article. */
export function parseArticleFrontmatter(data: Frontmatter, filePath: string): ArticleFrontmatter {
  const shared = parseSharedFrontmatter(data, filePath);
  const date = parseOptionalDate(data.date, filePath);

  if (shared.status !== 'draft' && !date) {
    invalidField(filePath, 'date', `is required when status is "${shared.status}"`);
  }

  return {
    ...shared,
    date,
    featured: parseFeatured(data.featured, filePath),
  };
}

/** Parse collection frontmatter and validate optional shared fields. */
export function parseCollectionFrontmatter(
  data: Frontmatter,
  filePath: string
): CollectionFrontmatter {
  // Collections do not expose a date today, but reject an invalid authored value
  // instead of silently accepting malformed metadata.
  parseOptionalDate(data.date, filePath);
  return parseSharedFrontmatter(data, filePath);
}
