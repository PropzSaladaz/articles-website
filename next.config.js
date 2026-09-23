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

// Dev only: the Giscus iframe (giscus.app) fetches /giscus/*.css cross-origin.
// Production gets the same header from public/_headers (scripts/prepare-content.mjs);
// `headers` isn't supported with `output: 'export'`, hence the guard.
if (process.env.NODE_ENV !== 'production') {
  nextConfig.headers = async () => [
    {
      source: '/giscus/:path*',
      headers: [{ key: 'Access-Control-Allow-Origin', value: '*' }],
    },
  ];
}

module.exports = nextConfig;
