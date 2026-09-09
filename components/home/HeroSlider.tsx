'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation, Pagination, EffectFade } from 'swiper/modules';
import { buildImageUrl, buildSrcSet, MOBILE_WIDTHS } from '../../lib/imageUrl';
import Link from 'next/link';
import { Box, Typography, Button, Container } from '@mui/material';
import { motion } from 'framer-motion';
import type { Banner } from '../../types';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { resolveBannerLink } from '../../lib/bannerLink';

// Hero artwork is authored at 1440x560 (2.57:1) and the backend crops every
// desktop master to exactly that ratio.
//
// The height used to be fixed pixels per breakpoint (xs 260, sm 400, md 500).
// A phone viewport is far taller relative to its width than 2.57:1, so
// object-fit:cover had to slice the sides off to fill that box — at 375px wide
// only 56% of the banner width survived, cutting straight through headlines
// baked into the artwork ("BEST SELLERS" lost its last letter) and chopping the
// models at both edges. Tablets were nearly as bad at 58%.
//
// Deriving the height from the artwork's own ratio means cover has nothing left
// to crop, so the whole banner is always visible.
const HERO_ASPECT = '1440 / 560';
// A dedicated mobile crop is portrait by design, so it gets a portrait box
// instead — that is the point of uploading one.
const HERO_ASPECT_MOBILE_ART = '4 / 5';
// The <picture> mobile source switches at 768px; the box must switch with it.
const MOBILE_BP = '@media (max-width: 768px)';
// Above this the 2.57:1 ratio would make the hero 747px tall and push the rest
// of the page below the fold, so desktop keeps its established fixed height.
const DESKTOP_BP = '@media (min-width: 1200px)';
const HERO_H_DESKTOP = 580;
// No artwork to respect in the empty state, so it keeps plain fixed heights.
const PLACEHOLDER_H = { xs: 320, sm: 400, md: 500, lg: HERO_H_DESKTOP };

interface HeroSliderProps {
  banners: Banner[];
}

export default function HeroSlider({ banners }: HeroSliderProps) {
  if (!banners.length) {
    return (
      <Box sx={{
        height: PLACEHOLDER_H,
        position: 'relative', overflow: 'hidden',
        display: 'flex', alignItems: 'center',
        background: 'linear-gradient(135deg, #0d0d0d 0%, #1e1a14 60%, #2c2410 100%)',
      }}>
        <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, y: 36 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.85 }}>
            <Typography variant="overline" sx={{ color: '#c9a84c', letterSpacing: '0.32em', display: 'block', mb: 2, fontSize: '0.7rem', fontWeight: 600 }}>
              NEW COLLECTION
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontFamily: 'var(--font-playfair)', color: 'white',
                fontSize: { xs: '2.4rem', sm: '3.4rem', md: '5rem' },
                lineHeight: 1.08, mb: 3, fontWeight: 700,
                maxWidth: 540,
              }}
            >
              Dress to<br />Impress
            </Typography>
            <Button
              component={Link} href="/shop"
              variant="contained"
              sx={{
                bgcolor: '#c9a84c', color: '#111',
                fontWeight: 800, fontSize: '0.78rem', letterSpacing: '0.14em',
                py: 1.6, px: 5,
                borderRadius: 0,
                '&:hover': { bgcolor: '#a8872a' },
                boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
              }}
            >
              Shop Now
            </Button>
          </motion.div>
        </Container>

        {/* Decorative gold accent lines */}
        <Box sx={{ position: 'absolute', right: { xs: -60, md: 80 }, top: '50%', transform: 'translateY(-50%)', opacity: 0.06 }}>
          <Box sx={{ width: 320, height: 320, border: '1px solid #c9a84c', borderRadius: '50%' }} />
          <Box sx={{ position: 'absolute', top: 30, left: 30, width: 260, height: 260, border: '1px solid #c9a84c', borderRadius: '50%' }} />
        </Box>
      </Box>
    );
  }

  // Swiper gives every slide one shared height, so this is a per-slider
  // decision rather than a per-banner one.
  const hasMobileArt = banners.some((b) => b.mobileImage);

  return (
    <Box
      sx={{
        width: '100%',
        aspectRatio: HERO_ASPECT,
        height: 'auto',
        ...(hasMobileArt && { [MOBILE_BP]: { aspectRatio: HERO_ASPECT_MOBILE_ART } }),
        [DESKTOP_BP]: { aspectRatio: 'auto', height: HERO_H_DESKTOP },
        position: 'relative', overflow: 'hidden',
        '& .swiper, & .swiper-wrapper, & .swiper-slide': { height: '100%' },
        '& .swiper-pagination': { bottom: { xs: 14, md: 22 } },
        '& .swiper-pagination-bullet': {
          bgcolor: 'rgba(255,255,255,0.5)',
          width: 6, height: 6,
          transition: 'all 0.3s',
        },
        '& .swiper-pagination-bullet-active': {
          bgcolor: 'white',
          width: 22,
          borderRadius: 4,
        },
        '& .swiper-button-next, & .swiper-button-prev': {
          color: 'white',
          width: 40, height: 40,
          '&::after': { fontSize: '14px', fontWeight: 700 },
          '&:hover': { opacity: 0.75 },
          // Touch users swipe, and on the short mobile hero the arrows sit on
          // top of the artwork they are meant to help you see.
          [MOBILE_BP]: { display: 'none' },
        },
      }}
    >
      <Swiper
        modules={[Autoplay, Navigation, Pagination, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{ delay: 5500, disableOnInteraction: false }}
        navigation
        pagination={{ clickable: true }}
        loop={banners.length > 1}
        touchStartPreventDefault={false}
        style={{ width: '100%', height: '100%' }}
      >
        {banners.map((banner, idx) => (
          <SwiperSlide key={banner.id}>
            <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
              {/**
                * Native <picture> rather than next/image, because next/image
                * cannot art-direct: it rescales one file, it cannot swap the
                * file at a breakpoint. A hero is ~2.5:1, so on a phone the
                * desktop crop is either a letterboxed sliver or loses the
                * subject. When a portrait crop has been uploaded the browser
                * takes that instead — and downloads only the matching source,
                * never both.
                *
                * The srcsets still come from the derivative pipeline, so each
                * breakpoint gets a viewport-sized AVIF/WebP.
                */}
              <picture>
                {banner.mobileImage && (
                  <source
                    media="(max-width: 768px)"
                    srcSet={buildSrcSet(banner.mobileImage, MOBILE_WIDTHS)}
                    sizes="100vw"
                  />
                )}
                <img
                  src={buildImageUrl(banner.image, 1920)}
                  srcSet={buildSrcSet(banner.image)}
                  sizes="100vw"
                  alt={banner.title}
                  // The first slide is the LCP element on the homepage: load it
                  // eagerly and tell the browser it outranks everything else.
                  // Later slides are off-screen and must not compete with it.
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  fetchPriority={idx === 0 ? 'high' : 'low'}
                  decoding={idx === 0 ? 'sync' : 'async'}
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center center',
                  }}
                />
              </picture>
              {/* The artwork itself is the link.
                  A hero exists to be clicked, and a shopper's instinct is to
                  tap the picture, not hunt for a small button — which was the
                  only clickable thing here, and only when a button label had
                  been filled in too.

                  Rendered as a sibling that covers the slide rather than a
                  wrapper around it, so the swiper's own controls — arrows and
                  pagination — stay outside the link and keep working.

                  An absolute URL leaves the site, so it opens in a new tab and
                  carries rel=noopener; a path stays in the SPA router. */}
              {(() => {
                const target = resolveBannerLink(banner.link);
                if (!target) return null;
                return target.external ? (
                  <Box
                    component="a"
                    href={target.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={banner.title || 'View offer'}
                    sx={{ position: 'absolute', inset: 0, zIndex: 1 }}
                  />
                ) : (
                  <Box
                    component={Link}
                    href={target.href}
                    aria-label={banner.title || 'View offer'}
                    sx={{ position: 'absolute', inset: 0, zIndex: 1 }}
                  />
                );
              })()}

              {/* No overlay, by design.
                  The artwork carries the message, and a button drawn on top of
                  someone's photograph competes with it — so the scrim that
                  existed only to keep that button readable is gone too. The
                  whole image is the link instead, which is what a shopper
                  reaches for anyway.

                  `title` is still the alt text and the banner's label in admin;
                  `ctaText` still drives the button on PROMOTIONAL banners. */}
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}
