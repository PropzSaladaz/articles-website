const siteUrlEnv = process.env.SITE_URL || '';

export function getSiteUrl(): string {
  if (siteUrlEnv) {
    return siteUrlEnv.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SITE_URL must be configured for production builds');
  }
  return 'http://localhost:3000';
}

export function getCanonicalUrl(pathname: string): string {
  const site = getSiteUrl();
  if (!pathname.startsWith('/')) {
    return `${site}/${pathname}`;
  }
  return `${site}${pathname}`;
}
