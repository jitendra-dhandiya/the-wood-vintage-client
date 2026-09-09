'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography, Skeleton } from '@mui/material';
import { motion } from 'framer-motion';
import { categoryApi } from '../../../services/api.service';
import type { Category } from '../../../types';

const DARK_GRADIENTS = [
  'linear-gradient(160deg, #1a0a2e 0%, #2d1b4e 100%)',
  'linear-gradient(160deg, #071f18 0%, #0d3b2e 100%)',
  'linear-gradient(160deg, #1f0e07 0%, #3b1a0d 100%)',
  'linear-gradient(160deg, #0a1630 0%, #1a2d4e 100%)',
  'linear-gradient(160deg, #1a1a07 0%, #2d2d0d 100%)',
  'linear-gradient(160deg, #1a0710 0%, #2d0d1a 100%)',
];

function CategorySkeleton() {
  return (
    <Box>
      <Skeleton variant="rectangular" sx={{ height: { xs: 180, md: 260 }, borderRadius: 0 }} />
      <Box sx={{ pt: 1.5, px: 0.5 }}>
        <Skeleton width="55%" height={20} />
        <Skeleton width="35%" height={16} sx={{ mt: 0.5 }} />
      </Box>
    </Box>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    categoryApi.getAll({ limit: 50, isActive: true })
      .then(({ data }) => setCategories((data as any).data || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ pb: { xs: 10, md: 8 } }}>

      {/* ── Hero banner ─────────────────────────────────────────── */}
      <Box sx={{
        bgcolor: '#111',
        color: 'white',
        py: { xs: 7, md: 10 },
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle grid texture */}
        <Box sx={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
          backgroundSize: '14px 14px',
        }} />
        {/* Gold circle accent */}
        <Box sx={{ position: 'absolute', right: { xs: -80, md: 80 }, top: '50%', transform: 'translateY(-50%)', opacity: 0.05 }}>
          <Box sx={{ width: 360, height: 360, border: '1px solid #c9a84c', borderRadius: '50%' }} />
          <Box sx={{ position: 'absolute', top: 36, left: 36, width: 288, height: 288, border: '1px solid #c9a84c', borderRadius: '50%' }} />
        </Box>

        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Typography sx={{
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.3em',
              textTransform: 'uppercase', color: '#c9a84c', display: 'block', mb: 1.5,
            }}>
              Explore
            </Typography>
            <Typography
              variant="h1"
              sx={{
                fontFamily: 'var(--font-playfair)',
                fontWeight: 700,
                fontSize: { xs: '2.2rem', sm: '3rem', md: '3.8rem' },
                lineHeight: 1.1,
                mb: 2,
              }}
            >
              All Categories
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.88rem', md: '1rem' }, maxWidth: 420, mx: 'auto' }}>
              Find exactly what you're looking for — browse every category we carry.
            </Typography>
          </motion.div>
        </Container>
      </Box>

      {/* ── Grid ──────────────────────────────────────────────────── */}
      <Container maxWidth="xl" sx={{ pt: { xs: 5, md: 8 } }}>

        {/* Count line */}
        {!loading && categories.length > 0 && (
          <Typography sx={{ fontSize: '0.8rem', color: '#999', mb: { xs: 3, md: 4 }, fontWeight: 500 }}>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </Typography>
        )}

        <Box sx={{
          display: 'grid',
          gap: { xs: 2, md: 2.5 },
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' },
        }}>
          {loading
            ? Array.from({ length: 10 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.5), duration: 0.45 }}
                >
                  <Link href={`/category/${cat.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                    <Box
                      sx={{
                        cursor: 'pointer',
                        '&:hover .cat-img': { transform: 'scale(1.07)' },
                        '&:hover .cat-name': { color: '#c9a84c' },
                      }}
                    >
                      {/* Image box */}
                      <Box sx={{
                        position: 'relative',
                        height: { xs: 190, sm: 230, md: 270 },
                        overflow: 'hidden',
                        mb: 1.5,
                      }}>
                        {cat.image ? (
                          <Image
                            src={cat.image}
                            alt={cat.name}
                            fill
                            className="cat-img"
                            style={{ objectFit: 'cover', transition: 'transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                            sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 20vw"
                          />
                        ) : (
                          <Box
                            className="cat-img"
                            sx={{
                              position: 'absolute', inset: 0,
                              background: DARK_GRADIENTS[i % DARK_GRADIENTS.length],
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                            }}
                          >
                            <Typography sx={{
                              fontFamily: 'var(--font-playfair)',
                              fontSize: '3.5rem',
                              color: 'rgba(201,168,76,0.25)',
                              fontWeight: 700,
                              lineHeight: 1,
                            }}>
                              {cat.name.charAt(0)}
                            </Typography>
                          </Box>
                        )}

                        {/* Subtle bottom gradient */}
                        <Box sx={{
                          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)',
                          pointerEvents: 'none',
                        }} />

                        {/* Product count badge */}
                        {cat._count?.products != null && (
                          <Box sx={{
                            position: 'absolute', bottom: 10, right: 10,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(4px)',
                            px: 1.2, py: 0.35,
                            border: '1px solid rgba(255,255,255,0.15)',
                          }}>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em' }}>
                              {cat._count.products} items
                            </Typography>
                          </Box>
                        )}
                      </Box>

                      {/* Text */}
                      <Typography
                        className="cat-name"
                        sx={{
                          fontWeight: 700,
                          fontSize: { xs: '0.88rem', md: '0.95rem' },
                          color: '#111',
                          letterSpacing: '0.01em',
                          transition: 'color 0.22s',
                          lineHeight: 1.3,
                        }}
                      >
                        {cat.name}
                      </Typography>
                    </Box>
                  </Link>
                </motion.div>
              ))}
        </Box>

        {/* Empty state */}
        {!loading && categories.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 14 }}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', mb: 1.5 }}>No categories yet</Typography>
            <Typography sx={{ color: '#888', mb: 4, fontSize: '0.9rem' }}>
              Check back soon — new categories are on their way.
            </Typography>
            <Box
              component={Link}
              href="/shop"
              sx={{
                display: 'inline-block', px: 4, py: 1.5,
                border: '2px solid #111', color: '#111',
                fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.1em',
                textDecoration: 'none', textTransform: 'uppercase',
                '&:hover': { bgcolor: '#111', color: 'white' }, transition: 'all 0.22s',
              }}
            >
              Browse All Products
            </Box>
          </Box>
        )}

      </Container>
    </Box>
  );
}
