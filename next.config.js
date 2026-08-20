/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
