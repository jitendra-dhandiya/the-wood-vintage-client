'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useCountry } from '../../contexts/CountryContext';
import { withCountry } from '../../lib/withCountry';

interface ArtisanItem {
  id: string;
  name: string;
  bio?: string | null;
  photo?: string | null;
  region?: string | null;
}

interface Props {
  artisans: ArtisanItem[];
  title: string;
  subtitle?: string;
}

/**
 * Phase 4 §2 homepage section — ARTISAN_SPOTLIGHT.
 *
 * A horizontal-scroll strip of maker cards, each linking to that artisan's
 * bio page (`/artisans/[id]`, §4). Renders nothing when the admin has added
 * the section but no active artisans exist yet — a real state today (the
 * artisans table is unseeded), not an error.
 */
export default function ArtisanSpotlight({ artisans, title, subtitle }: Props) {
  const { country } = useCountry();
  if (!artisans.length) return null;

  return (
    <Box sx={{ py: { xs: 7, md: 11 }, bgcolor: '#faf8f3' }}>
      <Container maxWidth="xl">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <Box sx={{ mb: { xs: 3, md: 5 } }}>
            <Typography variant="h2" sx={{
              fontFamily: 'var(--font-playfair)', fontWeight: 700,
              fontSize: { xs: '1.7rem', sm: '2.3rem', md: '2.75rem' },
              color: '#111', letterSpacing: '-0.02em', lineHeight: 1.1, mb: subtitle ? 1 : 0,
            }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ color: '#777', fontSize: { xs: '0.9rem', md: '1rem' } }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </motion.div>

        <Box
          className="h-scroll"
          sx={{
            display: 'flex', gap: { xs: 2, md: 2.5 }, overflowX: 'auto',
            scrollSnapType: 'x proximity', pb: 1,
            scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
          }}
        >
          {artisans.slice(0, 12).map((artisan) => (
            <Link
              key={artisan.id}
              href={withCountry(`/artisans/${artisan.id}`, country)}
              style={{ textDecoration: 'none', flexShrink: 0, scrollSnapAlign: 'start' }}
            >
              <Box sx={{
                width: { xs: 220, md: 260 }, p: 3, bgcolor: '#fff', borderRadius: 2,
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                border: '1px solid', borderColor: 'divider',
                transition: 'box-shadow 0.2s, transform 0.2s',
                '&:hover': { boxShadow: 3, transform: 'translateY(-3px)' },
              }}>
                <Box sx={{
                  position: 'relative', width: 84, height: 84, borderRadius: '50%',
                  overflow: 'hidden', flexShrink: 0, bgcolor: '#e8e4da', mb: 2,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {artisan.photo ? (
                    <Image src={artisan.photo} alt={artisan.name} fill style={{ objectFit: 'cover' }} sizes="84px" />
                  ) : (
                    <Typography sx={{ fontSize: '1.8rem', fontWeight: 700, color: '#b3a377' }}>
                      {artisan.name.charAt(0)}
                    </Typography>
                  )}
                </Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#3B2314' }}>
                  {artisan.name}
                </Typography>
                {artisan.region && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    {artisan.region}
                  </Typography>
                )}
                {artisan.bio && (
                  <Typography
                    variant="body2" color="text.secondary"
                    sx={{
                      mt: 1, lineHeight: 1.6,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}
                  >
                    {artisan.bio}
                  </Typography>
                )}
              </Box>
            </Link>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
