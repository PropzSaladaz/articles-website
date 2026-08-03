const repoName = process.env.REPO_NAME || '';
const basePath = repoName ? `/${repoName}` : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  basePath,
  assetPrefix: basePath,
  env: {
    // Exposes REPO_NAME to client bundles under a NEXT_PUBLIC_ name, since
    // Next.js only inlines NEXT_PUBLIC_-prefixed vars into browser code —
    // plain REPO_NAME is only visible during the server-side/build render.
    NEXT_PUBLIC_REPO_NAME: repoName,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
