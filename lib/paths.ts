// next.config.js reads REPO_NAME and re-exports it as NEXT_PUBLIC_REPO_NAME, since Next
// only inlines NEXT_PUBLIC_-prefixed vars into browser bundles. Accept either name so
// client components, the server render, and plain Node scripts all resolve the same base
// path — previously lib/md.ts read REPO_NAME while this file read only the public alias,
// and they agreed purely by coincidence of that re-export.
const repoName = process.env.NEXT_PUBLIC_REPO_NAME || process.env.REPO_NAME || '';

export function getBasePath(): string {
  return repoName ? `/${repoName}` : '';
}

export function withBasePath(path: string): string {
  const base = getBasePath();
  if (!base) return path;
  if (path.startsWith(base)) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
