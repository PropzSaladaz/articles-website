const repoName = process.env.REPO_NAME || '';
const siteUrlEnv = process.env.SITE_URL || '';

export function getSiteUrl(): string {
  if (siteUrlEnv) {
    return siteUrlEnv.replace(/\/$/, '');
  }
  const defaultHost = 'https://example.com';
  return repoName ? `${defaultHost}/${repoName}` : defaultHost;
}

export function getCanonicalUrl(pathname: string): string {
  const site = getSiteUrl();
  if (!pathname.startsWith('/')) {
    return `${site}/${pathname}`;
  }
  return `${site}${pathname}`;
}
