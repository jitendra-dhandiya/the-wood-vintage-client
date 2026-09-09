import imageLoader from './imageLoader';

/**
 * Direct access to the derivative pipeline for cases next/image cannot express.
 *
 * next/image has no art-direction support — it cannot swap the source file at a
 * breakpoint, only rescale one image. A hero needs a genuinely different crop
 * on a phone (portrait) than on a desktop (~2.5:1), which is a job for a native
 * <picture> with media-qualified <source> elements. Building those requires the
 * URLs directly, so this reuses the same loader next/image uses; there is no
 * second definition of how a derivative URL is formed.
 */

/** Widths offered to the browser. Every value exists in the backend ladder. */
export const HERO_WIDTHS = [640, 828, 1080, 1200, 1440, 1920, 2048, 2560] as const;
export const MOBILE_WIDTHS = [480, 640, 750, 828, 1080] as const;

/** URL for a single width. */
export const buildImageUrl = (src: string, width: number, quality = 78): string =>
  imageLoader({ src, width, quality });

/**
 * A srcset string. The browser picks using `sizes`, so it downloads exactly one
 * of these and never the largest by default.
 */
export const buildSrcSet = (
  src: string,
  widths: readonly number[] = HERO_WIDTHS,
  quality = 78
): string => widths.map(w => `${buildImageUrl(src, w, quality)} ${w}w`).join(', ');
