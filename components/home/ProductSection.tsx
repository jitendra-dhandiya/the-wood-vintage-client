'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { Box, Typography, IconButton, Container, Grid } from '@mui/material';
import { ArrowForward, ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import ProductCard, { ProductCardSkeleton } from '../product/ProductCard';
import type { Product } from '../../types';

interface ProductSectionProps {
  title: string;
  subtitle?: string;
  products: Product[];
  viewAllLink?: string;
  loading?: boolean;
  bgColor?: string;
  layout?: 'grid' | 'carousel';
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ── How many cards are visible + the peek amount ──────────────
const CARD_W = {
  xs: '62vw',
  sm: '38vw',
  md: '25vw',
  lg: '21vw',
  xl: '18vw',
};

// Gutter values that match MUI Container's internal padding
// xs: 16px (theme.spacing(2))  sm+: 24px (theme.spacing(3))
const GUTTER = { xs: 2, sm: 3 } as const;

export default function ProductSection({
  title,
  subtitle,
  products,
  viewAllLink,
  loading = false,
  bgColor = '#ffffff',
  layout = 'carousel',
}: ProductSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const slide = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector('[data-card]') as HTMLElement | null;
    const amount = card ? card.offsetWidth + 16 : 260;
    scrollRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  // ── Grid layout ──────────────────────────────────────────────
  if (layout === 'grid') {
    return (
      <Box sx={{ bgcolor: bgColor, py: { xs: 6, md: 10 } }}>
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: { xs: 3, md: 4 }, flexWrap: 'wrap', gap: 1.5 }}>
            <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ minWidth: 0 }}>
              <Box>
                {subtitle && (
                  <Typography variant="overline" sx={{ color: '#c9a84c', letterSpacing: '0.2em', fontWeight: 600, display: 'block', fontSize: '0.62rem', mb: 0.4 }}>
                    {subtitle}
                  </Typography>
                )}
                <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.75rem' }, color: '#111', letterSpacing: '-0.015em' }}>
                  {title}
                </Typography>
              </Box>
            </motion.div>
            {viewAllLink && (
              <Typography component={Link} href={viewAllLink} sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111', textDecoration: 'underline', textUnderlineOffset: 3, '&:hover': { color: '#c9a84c' } }}>
                View all
              </Typography>
            )}
          </Box>
          <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Grid key={i} item xs={6} sm={4} md={3}><ProductCardSkeleton /></Grid>
                  ))
                : products.map((product) => (
                    <Grid key={product.id} item xs={6} sm={4} md={3}>
                      <motion.div variants={itemVariants}><ProductCard product={product} /></motion.div>
                    </Grid>
                  ))}
            </Grid>
          </motion.div>
        </Container>
      </Box>
    );
  }

  // ── Carousel layout ──────────────────────────────────────────
  //
  // Layout trick:
  //   1. Outer wrapper acts exactly like Container maxWidth="xl":
  //      maxWidth 1536px + mx auto + px GUTTER
  //      → title left-edge = product left-edge on every screen size.
  //
  //   2. Scroll row has mr: -GUTTER (negative right margin matching the wrapper
  //      padding) so the scroll track extends to the right viewport edge,
  //      allowing cards to bleed/peek past the right margin.
  //
  //   3. pr: GUTTER on the scroll row keeps a peek gap on the right so the
  //      user can see that more cards exist.
  //
  const items = loading ? Array.from({ length: 6 }) : products;

  return (
    <Box sx={{ bgcolor: bgColor, py: { xs: 6, md: 9 } }}>
      {/* ── Centered content wrapper (mirrors Container xl) ── */}
      <Box sx={{ maxWidth: 1536, mx: 'auto', px: GUTTER }}>

        {/* Header */}
        {/* Section titles are admin-editable, and the View all + arrows cluster is
            flexShrink: 0. Without wrapping, a long title pushes this row past a
            phone's width and clips the whole page, not just the header. */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: { xs: 3, md: 4 }, flexWrap: 'wrap', gap: 1.5 }}>
          <motion.div initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} style={{ minWidth: 0 }}>
            <Box>
              {subtitle && (
                <Typography variant="overline" sx={{ color: '#c9a84c', letterSpacing: '0.2em', fontWeight: 600, display: 'block', fontSize: '0.62rem', mb: 0.4 }}>
                  {subtitle}
                </Typography>
              )}
              <Typography variant="h4" sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.75rem' }, color: '#111', letterSpacing: '-0.015em', lineHeight: 1.15 }}>
                {title}
              </Typography>
            </Box>
          </motion.div>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, ml: 2, flexShrink: 0 }}>
            {viewAllLink && (
              <Typography
                component={Link}
                href={viewAllLink}
                sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111', textDecoration: 'underline', textUnderlineOffset: 3, mr: 1, whiteSpace: 'nowrap', '&:hover': { color: '#c9a84c' }, transition: 'color 0.2s' }}
              >
                View all
              </Typography>
            )}
            <IconButton size="small" onClick={() => slide('left')}
              sx={{ width: 34, height: 34, border: '1.5px solid #ddd', '&:hover': { borderColor: '#111', bgcolor: '#111', color: 'white' }, transition: 'all 0.2s' }}>
              <ArrowBack sx={{ fontSize: 14 }} />
            </IconButton>
            <IconButton size="small" onClick={() => slide('right')}
              sx={{ width: 34, height: 34, border: '1.5px solid #ddd', '&:hover': { borderColor: '#111', bgcolor: '#111', color: 'white' }, transition: 'all 0.2s' }}>
              <ArrowForward sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        </Box>

        {/* Scroll track */}
        <Box
          ref={scrollRef}
          sx={{
            display: 'flex',
            gap: { xs: '12px', md: '16px' },
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollSnapType: 'x proximity',
            scrollbarWidth: 'none',
            '&::-webkit-scrollbar': { display: 'none' },
            touchAction: 'pan-x pan-y', /* pan-x alone blocks vertical scroll starting on cards */
            overscrollBehaviorX: 'contain',
            // Bleed to the right viewport edge
            mr: { xs: -2, sm: -3 },
            // Right gap so the next card peeks in
            pr: GUTTER,
            pb: 1,
          }}
        >
          {items.map((product: any, i) => (
            <Box
              key={product?.id ?? i}
              data-card
              sx={{ flexShrink: 0, scrollSnapAlign: 'start', width: CARD_W }}
            >
              {loading ? <ProductCardSkeleton /> : <ProductCard product={product} />}
            </Box>
          ))}
        </Box>

      </Box>
    </Box>
  );
}
