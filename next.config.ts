import type { NextConfig } from 'next';
import withBundleAnalyzerInit from '@next/bundle-analyzer';

// Real bundle numbers on demand: `ANALYZE=true npm run build`. There was no
// way to measure "does admin code leak into the storefront bundle" other
// than inference before this -- see phase-5-performance-spec.md.
const withBundleAnalyzer = withBundleAnalyzerInit({ enabled: process.env.ANALYZE === 'true' });

const nextConfig: NextConfig = {
  // Lets verification runs build/serve into a separate dir without touching a running dev server's .next.
  distDir: process.env.NEXT_DIST_DIR || '.next',
  // Behind nginx, Next otherwise builds request URLs from its own bind address (https://localhost:3000), so
  // middleware redirects leaked that origin and rewrites (e.g. the region page) were treated as external
  // proxies and failed. TRUST_HOST_HEADER=true (production only, set at build + runtime) makes Next use the
  // Host header instead. nginx always sets Host; never enable this where the app is directly reachable.
  experimental: (process.env.TRUST_HOST_HEADER === 'true' ? { trustHostHeader: true } : undefined) as NextConfig['experimental'], // not in Next's public types
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

export default withBundleAnalyzer(nextConfig);
