const siteUrlEnv = process.env.SITE_URL || '';
const productionSiteUrl = 'https://articles.sidneiteixeira.com';

export function getSiteUrl(): string {
  if (siteUrlEnv) {
    return siteUrlEnv.replace(/\/$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    return productionSiteUrl;
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
