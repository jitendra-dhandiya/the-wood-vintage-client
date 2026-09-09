'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Typography, Container } from '@mui/material';
import { motion } from 'framer-motion';
import type { Category } from '../../types';

interface Props {
  categories: Category[];
  gender: 'MEN' | 'WOMEN';
  title?: string;
}

const GENDER_LABEL = { MEN: 'MENS', WOMEN: 'WOMENS' };

export default function CollectionBanners({ categories, gender, title = 'Shop by Collection' }: Props) {
  if (!categories.length) return null;

  return (
    <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: '#fafafa' }}>
      {/* Section title */}
      <Container maxWidth="xl">
        <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800, fontSize: { xs: '1.4rem', md: '1.9rem' },
              color: '#111', letterSpacing: '-0.02em', mb: { xs: 3, md: 4 },
            }}
          >
            {title}
          </Typography>
        </motion.div>
      </Container>

      {/* Horizontal scroll strip — intentionally full-bleed */}
      <Box
        className="h-scroll"
        sx={{
          display: 'flex',
          gap: { xs: 1.5, md: 2 },
          overflowX: 'auto',
          scrollSnapType: 'x proximity',
          px: { xs: 2, sm: 4, md: 6 },
          pb: 1,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {categories.slice(0, 8).map((cat, i) => (
          <Box
            key={cat.id}
            sx={{ flexShrink: 0, scrollSnapAlign: 'start' }}
          >
            <Link href={`/category/${cat.slug}`} style={{ textDecoration: 'none' }}>
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: 210, sm: 250, md: 290 },
                  height: { xs: 280, sm: 333, md: 387 },

                  overflow: 'hidden',
                  cursor: 'pointer',
                  '&:hover .coll-img': { transform: 'scale(1.06)' },
                  '&:hover .coll-cta': {
                    bgcolor: '#c9a84c',
                    borderColor: '#c9a84c',
                    color: '#111',
                  },
                }}
              >
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="coll-img"
                    style={{ objectFit: 'cover', transition: 'transform 0.65s ease' }}
                    sizes="300px"
                  />
                ) : (
                  <Box sx={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, hsl(${i * 50},20%,40%) 0%, hsl(${i * 50 + 30},15%,55%) 100%)` }} />
                )}

                {/* Gradient overlay */}
                <Box sx={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.05) 100%)',
                }} />

                {/* Content */}
                <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: { xs: 2, md: 2.5 } }}>
                  {/* Gender chip */}
                  <Box sx={{
                    display: 'inline-flex',
                    bgcolor: 'rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    px: 1.25, py: 0.3,
                    mb: 1.25,
                  }}>
                    <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'white', letterSpacing: '0.12em' }}>
                      {GENDER_LABEL[gender]}
                    </Typography>
                  </Box>

                  {/* Category name */}
                  <Typography sx={{
                    fontSize: { xs: '1.05rem', md: '1.2rem' },
                    fontWeight: 900,
                    color: '#c9a84c',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    lineHeight: 1.15,
                    mb: 2,
                  }}>
                    {cat.name}
                  </Typography>

                  {/* CTA */}
                  <Box
                    className="coll-cta"
                    sx={{
                      display: 'inline-block',
                      border: '1.5px solid rgba(255,255,255,0.75)',
                      color: 'white',
                      px: 2, py: 0.6,
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      letterSpacing: '0.12em',
                      transition: 'all 0.28s ease',
                    }}
                  >
                    SHOP NOW
                  </Box>
                </Box>
              </Box>
            </Link>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
