'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface Props {
  banners: any[];
  title?: string;
}

// Map boring admin section names → better creative display names
const DISPLAY_TITLES: Record<string, { heading: string; overline: string; sub: string }> = {
  default: { heading: 'Exclusive Offers', overline: 'Limited Time', sub: 'Hand-picked deals you cannot miss' },
};

function getSectionMeta(rawTitle?: string) {
  if (!rawTitle) return DISPLAY_TITLES.default;
  const lower = rawTitle.toLowerCase();
  if (lower.includes('sale') || lower.includes('off')) {
    return { heading: 'Season Sale', overline: 'Limited Time', sub: 'Shop before it ends' };
  }
  if (lower.includes('promo') || lower.includes('banner')) {
    return DISPLAY_TITLES.default;
  }
  // Admin gave a real custom title — respect it
  return { heading: rawTitle, overline: 'Special', sub: '' };
}

export default function PromoBanners({ banners, title }: Props) {
  if (!banners?.length) return null;

  const meta = getSectionMeta(title);
  const isSingle = banners.length === 1;

  return (
    <Box sx={{ bgcolor: '#f7f4ef', py: { xs: 7, md: 11 }, overflow: 'hidden' }}>
      <Container maxWidth="xl">

        {/* ── Section header ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: { xs: 4, md: 6 } }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                {/* Gold accent bar */}
                <Box sx={{ width: 28, height: 2, bgcolor: '#c9a84c', flexShrink: 0 }} />
                <Typography sx={{
                  fontSize: '0.63rem', fontWeight: 700, letterSpacing: '0.28em',
                  textTransform: 'uppercase', color: '#c9a84c',
                }}>
                  {meta.overline}
                </Typography>
              </Box>
              <Typography
                variant="h2"
                sx={{
                  fontFamily: 'var(--font-playfair)',
                  fontWeight: 700,
                  fontSize: { xs: '1.7rem', sm: '2.3rem', md: '3rem' },
                  color: '#111',
                  letterSpacing: '-0.022em',
                  lineHeight: 1.08,
                  mb: meta.sub ? 1.2 : 0,
                }}
              >
                {meta.heading}
              </Typography>
              {meta.sub && (
                <Typography sx={{ color: '#777', fontSize: { xs: '0.82rem', md: '0.9rem' }, fontWeight: 400 }}>
                  {meta.sub}
                </Typography>
              )}
            </Box>

            {/* Decorative dots pattern */}
            <Box sx={{ display: { xs: 'none', md: 'grid' }, gridTemplateColumns: 'repeat(5,8px)', gap: '6px', opacity: 0.18, mr: 2 }}>
              {Array.from({ length: 25 }).map((_, i) => (
                <Box key={i} sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#c9a84c' }} />
              ))}
            </Box>
          </Box>
        </motion.div>

        {/* ── Banner cards ──────────────────────────────────────────── */}
        {isSingle ? (
          <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <PromoBannerCard banner={banners[0]} tall />
          </motion.div>
        ) : (
          <Box
            className="h-scroll"
            sx={{
              display: 'flex',
              gap: { xs: 1.5, md: 2 },
              overflowX: { xs: 'auto', md: 'visible' },
              flexWrap: { xs: 'nowrap', md: 'wrap' },
              scrollSnapType: 'x proximity',
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
              mx: { xs: -2, sm: -3, md: 0 },
              px: { xs: 2, sm: 3, md: 0 },
            }}
          >
            {banners.map((banner, i) => (
              <motion.div
                key={banner.id ?? i}
                initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                style={{
                  flexShrink: 0,
                  scrollSnapAlign: 'start',
                  flex: banners.length === 2 ? '0 0 calc(50% - 8px)' : '1 1 calc(33% - 12px)',
                  minWidth: 280,
                }}
              >
                <PromoBannerCard banner={banner} />
              </motion.div>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}

// ── Banner card ───────────────────────────────────────────────────
function PromoBannerCard({ banner, tall }: { banner: any; tall?: boolean }) {
  const height = tall
    ? { xs: 280, sm: 380, md: 480 }
    : { xs: 220, sm: 280, md: 340 };

  const card = (
    <Box
      sx={{
        position: 'relative',
        height,
        overflow: 'hidden',
        cursor: banner.link ? 'pointer' : 'default',
        '&:hover .promo-img': { transform: 'scale(1.04)' },
        '&:hover .promo-cta': { bgcolor: '#c9a84c', borderColor: '#c9a84c', color: '#111 !important' },
        '&::after': {
          // Bottom gold accent line
          content: '""',
          position: 'absolute',
          bottom: 0, left: 0,
          width: '100%', height: '3px',
          background: 'linear-gradient(to right, #c9a84c 0%, transparent 100%)',
          opacity: 0.7,
          zIndex: 3,
        },
      }}
    >
      {/* Background */}
      {banner.image ? (
        <Image
          src={banner.image}
          alt={banner.title || 'Promotion'}
          fill
          className="promo-img"
          style={{ objectFit: 'cover', transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        // Rich fallback — dark editorial gradient
        <Box sx={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(125deg, #111111 0%, #1c1008 40%, #2a1a00 70%, #111111 100%)',
        }}>
          {/* Decorative circle */}
          <Box sx={{ position: 'absolute', right: '-10%', top: '50%', transform: 'translateY(-50%)', opacity: 0.04 }}>
            <Box sx={{ width: 400, height: 400, border: '1px solid #c9a84c', borderRadius: '50%' }} />
            <Box sx={{ position: 'absolute', top: 40, left: 40, width: 320, height: 320, border: '1px solid #c9a84c', borderRadius: '50%' }} />
          </Box>
        </Box>
      )}

      {/* Directional gradient overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.12) 100%)',
      }} />

      {/* Content */}
      <Box sx={{
        position: 'absolute', inset: 0, zIndex: 2,
        display: 'flex', alignItems: 'center',
        p: tall ? { xs: 3.5, md: 6 } : { xs: 3, md: 4.5 },
      }}>
        <Box sx={{ color: 'white', maxWidth: { xs: '80%', md: 520 } }}>

          {/* Overline */}
          {banner.subtitle && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 20, height: 1.5, bgcolor: '#c9a84c', flexShrink: 0 }} />
              <Typography sx={{
                fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.25em',
                textTransform: 'uppercase', color: '#c9a84c',
              }}>
                {banner.subtitle}
              </Typography>
            </Box>
          )}

          {/* Main title */}
          {banner.title && (
            <Typography
              variant={tall ? 'h2' : 'h3'}
              sx={{
                fontFamily: 'var(--font-playfair)',
                fontWeight: 700,
                fontSize: tall
                  ? { xs: '1.6rem', sm: '2.2rem', md: '3rem' }
                  : { xs: '1.3rem', sm: '1.7rem', md: '2.1rem' },
                lineHeight: 1.1,
                mb: 3,
                color: 'white',
                textShadow: '0 2px 16px rgba(0,0,0,0.4)',
              }}
            >
              {banner.title}
            </Typography>
          )}

          {/* CTA button */}
          {banner.ctaText && (
            <Box
              className="promo-cta"
              sx={{
                display: 'inline-block',
                border: '2px solid rgba(255,255,255,0.85)',
                color: 'white',
                px: tall ? { xs: 3, md: 4.5 } : { xs: 2.5, md: 3.5 },
                py: tall ? { xs: 1.1, md: 1.4 } : { xs: 0.9, md: 1.2 },
                fontSize: { xs: '0.68rem', md: '0.75rem' },
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                transition: 'all 0.28s ease',
              }}
            >
              {banner.ctaText}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  if (banner.link) {
    return <Link href={banner.link} style={{ textDecoration: 'none', display: 'block' }}>{card}</Link>;
  }
  return card;
}
