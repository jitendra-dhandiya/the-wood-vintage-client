'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const FALLBACK_COLORS = [
  '#0d0d1a', '#0a1a0d', '#1a0a0a', '#0d0a1a', '#1a1a0a', '#0a0d1a',
];

interface HomeCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  gender?: string;
  _count?: { products: number };
}

interface Props {
  initialCategories?: HomeCategory[];
}

export default function CategoryShowcase({ initialCategories = [] }: Props) {
  const categories = initialCategories;

  if (categories.length === 0) return null;

  return (
    <Box sx={{ py: { xs: 7, md: 11 }, bgcolor: '#fff' }}>
      <Container maxWidth="xl">

        {/* ── Header ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: { xs: 3, md: 5 }, gap: 2, flexWrap: 'wrap' }}>
            <Box>
              <Typography sx={{
                fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.28em',
                textTransform: 'uppercase', color: '#c9a84c', display: 'block', mb: 1,
              }}>
                Explore
              </Typography>
              <Typography variant="h2" sx={{
                fontFamily: 'var(--font-playfair)', fontWeight: 700,
                fontSize: { xs: '1.7rem', sm: '2.3rem', md: '3rem' },
                color: '#111', letterSpacing: '-0.02em', lineHeight: 1.05,
              }}>
                Shop by<br />Category
              </Typography>
            </Box>

            <Typography
              component={Link}
              href="/categories"
              sx={{
                fontSize: '0.72rem', fontWeight: 700, color: '#888',
                textDecoration: 'underline', textUnderlineOffset: 4,
                whiteSpace: 'nowrap', mb: 0.5, ml: 2,
                '&:hover': { color: '#c9a84c' }, transition: 'color 0.22s',
              }}
            >
              View all
            </Typography>
          </Box>

        </motion.div>

        {/* ── Grid ───────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: { xs: 1.5, md: 2 },
          }}
        >
          {categories.map((cat, i) => (
            <Box key={cat.id}>
              <Link href={`/category/${cat.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                <Box
                  sx={{
                    // Category photography is portrait (sources run 0.56–0.80).
                    // A 4/5 box on a ~173px-wide phone column had to crop those
                    // vertically to fill it, and since the crop is centred it
                    // took the model's head off — "Pants and Trousers" kept only
                    // 71% of its height. A taller box on mobile, where the
                    // column is narrowest, cuts far less.
                    aspectRatio: { xs: '3 / 4', md: '4 / 5' },
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    borderRadius: { xs: '10px', md: '14px' },
                    bgcolor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                    '&:hover .cat-img': { transform: 'scale(1.06)' },
                    '&:hover .cat-btn': { bgcolor: '#cc0000' },
                  }}
                >
                  {/* Background image */}
                  {cat.image && (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      className="cat-img"
                      style={{
                        objectFit: 'cover',
                        // Bias the crop upward: in a full-length fashion shot the
                        // face sits near the top, so a centred crop is exactly the
                        // one that removes it. Whatever has to go comes off the
                        // feet instead.
                        objectPosition: 'center 30%',
                        transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      }}
                      sizes="(max-width: 600px) 50vw, 25vw"
                    />
                  )}

                  {/* Dark overlay — heavier in center so text is readable */}
                  <Box sx={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.72) 100%)',
                  }} />

                  {/* Gender badge — top left */}
                  {cat.gender && (
                    <Box sx={{
                      position: 'absolute', top: { xs: 10, md: 14 }, left: { xs: 10, md: 14 },
                      bgcolor: 'white',
                      color: '#111',
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      px: 1.25, py: 0.5,
                      borderRadius: '3px',
                    }}>
                      {cat.gender === 'WOMEN' ? 'WOMENS' : cat.gender === 'MEN' ? 'MENS' : cat.gender}
                    </Box>
                  )}

                  {/* Centered content */}
                  <Box sx={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    px: { xs: 1.5, md: 2 },
                    textAlign: 'center',
                  }}>
                    {/* Category name */}
                    <Typography sx={{
                      color: '#FFE500',
                      fontWeight: 900,
                      fontSize: { xs: '0.95rem', sm: '1.2rem', md: '1.5rem' },
                      textTransform: 'uppercase',
                      lineHeight: 1.15,
                      letterSpacing: '-0.01em',
                      mb: { xs: 1.25, md: 2 },
                      textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                      maxWidth: '100%',
                      // The card clips its overflow, so a long single word
                      // ("SWEATSHIRTS") would otherwise be sliced at the edge
                      // rather than wrapped.
                      overflowWrap: 'anywhere',
                      hyphens: 'auto',
                    }}>
                      {cat.name}
                    </Typography>

                    {/* SHOP NOW button */}
                    <Box
                      className="cat-btn"
                      sx={{
                        bgcolor: '#E53935',
                        color: 'white',
                        fontSize: { xs: '0.58rem', md: '0.62rem' },
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        px: { xs: 2, md: 2.5 },
                        py: { xs: 0.75, md: 0.85 },
                        borderRadius: '3px',
                        transition: 'background-color 0.2s',
                        display: 'inline-block',
                      }}
                    >
                      Shop Now
                    </Box>
                  </Box>
                </Box>
              </Link>
            </Box>
          ))}

        </Box>
      </Container>
    </Box>
  );
}
