import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  images: {
    // Resizing is delegated to the backend's /img endpoint, which serves
    // AVIF/WebP derivatives from the full-quality original and caches them on
    // disk. See lib/imageLoader.ts for why the built-in optimizer is not used.
    loader: 'custom',
    loaderFile: './lib/imageLoader.ts',

    // Still applies to any <Image> the loader passes through untouched
    // (external hosts, /public assets).
    remotePatterns: [
      { protocol: 'http', hostname: '**' },
      { protocol: 'https', hostname: '**' },
    ],

    // Drives the widths Next requests in srcset. Every value must exist in the
    // backend's RESPONSIVE_WIDTHS ladder, or the request is snapped up to the
    // next bucket and the browser downloads more than it needs.
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200, 1440, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Derivative URLs are content-addressed by the backend (cache key includes
    // source mtime), so a stale response is not possible.
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
  async redirects() {
    return [];
  },
};

export default nextConfig;
