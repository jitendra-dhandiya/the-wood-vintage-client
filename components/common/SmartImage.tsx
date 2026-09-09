'use client';

import { useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import { Box, type SxProps, type Theme } from '@mui/material';

/**
 * next/image wrapper that adds the perceived-performance layer:
 *
 *   - Reserves space from an explicit aspect ratio, so nothing reflows as
 *     images arrive (cumulative layout shift).
 *   - Shows a shimmer, or a real blurred preview when the caller has a
 *     `blurDataURL` from the backend's /img/meta endpoint.
 *   - Fades the full image in, so a slow connection degrades gracefully
 *     instead of popping.
 *   - Renders a neutral placeholder if the image 404s, rather than a broken
 *     icon on a product tile.
 *
 * Byte savings come from the loader (lib/imageLoader.ts); this component is
 * about how the wait *feels*. `sizes` is required — omitting it is the single
 * most common way to accidentally ship a 1920w image into a ic80px box.
 */

export interface SmartImageProps extends Omit<ImageProps, 'onLoad' | 'onError' | 'placeholder'> {
  /** Required: drives which srcset entry the browser downloads. */
  sizes: string;
  /** e.g. '3 / 4' for portrait product shots. Ignored when `fill` is false. */
  aspectRatio?: string;
  /** Inline base64 preview from GET /img/meta/<path>. */
  blurDataURL?: string;
  /** Styles applied to the positioning wrapper. */
  sx?: SxProps<Theme>;
  /** Rendered in place of the image when the source fails to load. */
  fallback?: React.ReactNode;
  /** Disable the fade-in (e.g. for above-the-fold LCP images). */
  disableFade?: boolean;
}

const SHIMMER_SX: SxProps<Theme> = {
  position: 'absolute',
  inset: 0,
  background: 'linear-gradient(90deg, #f2f2f2 0%, #e8e8e8 50%, #f2f2f2 100%)',
  backgroundSize: '200% 100%',
  animation: 'smartImageShimmer 1.4s ease-in-out infinite',
  '@keyframes smartImageShimmer': {
    '0%': { backgroundPosition: '200% 0' },
    '100%': { backgroundPosition: '-200% 0' },
  },
  // Respect users who have asked the OS to reduce motion.
  '@media (prefers-reduced-motion: reduce)': {
    animation: 'none',
    background: '#f2f2f2',
  },
};

export default function SmartImage({
  aspectRatio,
  blurDataURL,
  sx,
  fallback,
  disableFade = false,
  fill,
  style,
  priority,
  ...imageProps
}: SmartImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // A priority image is above the fold and should appear the instant it decodes.
  const fade = !disableFade && !priority;

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#f8f8f8',
        ...(fill && aspectRatio ? { aspectRatio } : null),
        ...sx,
      }}
    >
      {/* Placeholder layer — a real blurred preview when we have one, a
          shimmer otherwise. Removed from the tree once the image is painted. */}
      {!loaded && !errored && (
        blurDataURL ? (
          <Box
            aria-hidden
            component="img"
            src={blurDataURL}
            alt=""
            sx={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              // The source is ~20px wide; scaling up hides the JPEG-ish edges.
              filter: 'blur(12px)',
              transform: 'scale(1.1)',
            }}
          />
        ) : (
          <Box aria-hidden sx={SHIMMER_SX} />
        )
      )}

      {errored ? (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'text.disabled',
            bgcolor: '#f5f5f5',
            fontSize: '0.75rem',
          }}
        >
          {fallback ?? 'Image unavailable'}
        </Box>
      ) : (
        <Image
          {...imageProps}
          fill={fill}
          priority={priority}
          style={{
            objectFit: 'cover',
            ...style,
            ...(fade
              ? {
                  opacity: loaded ? 1 : 0,
                  transition: 'opacity 400ms ease',
                }
              : null),
          }}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
    </Box>
  );
}
