/**
 * Custom next/image loader.
 *
 * Registered via `images.loaderFile` in next.config.ts, so it applies to EVERY
 * <Image> in the app automatically — no per-component changes required.
 *
 * Why a custom loader rather than the built-in optimizer:
 *
 *   1. The built-in optimizer could not serve our images at all. It only
 *      fetches hosts listed in `images.remotePatterns`, which allowed http
 *      solely for `localhost`; the API is served over http from a bare IP, so
 *      every product image was rejected with a 400.
 *
 *   2. Even once allowed, it would re-encode images the backend has already
 *      encoded — burning CPU and memory on the Next.js server to duplicate work
 *      the API did at upload time.
 *
 * Instead we point at the backend's /img endpoint, which resizes from the
 * full-quality original, caches the result on disk, and negotiates AVIF/WebP
 * from the browser's Accept header.
 */

interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

/**
 * Absolute base of the backend, derived from the configured API URL by dropping
 * the `/api/v1` suffix. Kept local to this module so the loader stays usable
 * from both server and client bundles.
 */
const backendOrigin = (): string => {
  const api = process.env.NEXT_PUBLIC_API_URL || '';
  return api.replace(/\/api\/v\d+\/?$/, '').replace(/\/$/, '');
};

/** Matches any URL that points at the backend's uploaded-file tree. */
const UPLOADS_PATTERN = /^(?:https?:\/\/[^/]+)?\/uploads\/(.+)$/i;

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  if (!src) return '';

  // Data URIs and blobs are already inline — never rewrite them.
  if (src.startsWith('data:') || src.startsWith('blob:')) return src;

  const match = src.match(UPLOADS_PATTERN);

  if (match) {
    const relativePath = match[1];

    // Prefer the origin embedded in the stored URL. Image URLs are absolute in
    // the database (built from BASE_URL at upload time), so honouring them keeps
    // old records working even if the API host later changes.
    let origin = backendOrigin();
    const absolute = src.match(/^(https?:\/\/[^/]+)/i);
    if (absolute) origin = absolute[1];

    const params = new URLSearchParams({ w: String(width) });
    if (quality) params.set('q', String(quality));

    return `${origin}/img/${relativePath}?${params.toString()}`;
  }

  // Anything else — assets in /public, external CDNs, placeholder services —
  // is returned untouched so it still renders.
  return src;
}
