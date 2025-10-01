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
