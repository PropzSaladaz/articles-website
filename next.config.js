const repoName = process.env.REPO_NAME || '';
const basePath = repoName ? `/${repoName}` : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath,
  assetPrefix: basePath,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
