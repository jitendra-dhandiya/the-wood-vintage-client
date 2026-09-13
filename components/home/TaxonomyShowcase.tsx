'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useCountry } from '../../contexts/CountryContext';
import { withCountry } from '../../lib/withCountry';

const FALLBACK_COLORS = [
  '#2b241a', '#1f2a1f', '#241a1a', '#1a1f2a', '#2a251a', '#1a2420',
];

interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  description?: string | null;
}

interface Props {
  items: TaxonomyItem[];
  /** Which `/shop` query param each card should link with — `roomSlug` or `materialSlug`. */
  linkParam: 'roomSlug' | 'materialSlug';
  title: string;
  subtitle?: string;
}

/**
 * Phase 4 §2 homepage section — SHOP_BY_ROOM / SHOP_BY_MATERIAL.
 *
 * Same linked-grid visual language as `CategoryShowcase` (the closest analog
 * per the spec), simplified: no gender chip, no admin-set product count, just
 * a photo, a name, and a link into `/shop` pre-filtered on that facet.
 */
export default function TaxonomyShowcase({ items, linkParam, title, subtitle }: Props) {
  const { country } = useCountry();
  if (!items.length) return null;

  return (
    <Box sx={{ py: { xs: 7, md: 11 }, bgcolor: '#fff' }}>
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

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: `repeat(${Math.min(items.length, 5)}, 1fr)` },
          gap: { xs: 1.5, md: 2 },
        }}>
          {items.slice(0, 10).map((item, i) => (
            <Box key={item.id}>
              <Link href={withCountry(`/shop?${linkParam}=${item.slug}`, country)} style={{ textDecoration: 'none', display: 'block' }}>
                <Box sx={{
                  aspectRatio: '4 / 5',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  borderRadius: { xs: '10px', md: '14px' },
                  bgcolor: FALLBACK_COLORS[i % FALLBACK_COLORS.length],
                  '&:hover .tax-img': { transform: 'scale(1.06)' },
                }}>
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="tax-img"
                      style={{ objectFit: 'cover', transition: 'transform 0.65s ease' }}
                      sizes="(max-width: 600px) 50vw, 20vw"
                    />
                  )}
                  <Box sx={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.05) 100%)',
                  }} />
                  <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: { xs: 1.5, md: 2 } }}>
                    <Typography sx={{
                      color: '#fff', fontWeight: 800, fontSize: { xs: '0.85rem', md: '1rem' },
                      letterSpacing: '0.01em', lineHeight: 1.2,
                      textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    }}>
                      {item.name}
                    </Typography>
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
