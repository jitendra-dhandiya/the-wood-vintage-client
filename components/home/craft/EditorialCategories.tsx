'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { useCountry } from '../../../contexts/CountryContext';
import { withCountry } from '../../../lib/withCountry';
import { C, SERIF, Reveal, SectionHead } from './shared';

interface Cat { id: string; name: string; slug: string; image?: string | null }

// Asymmetric collage: [col span, row span] per tile on a 12-col grid, two 300px rows.
const SPANS: [number, number][] = [[5, 2], [4, 1], [3, 2], [4, 1]];
const TAGS: Record<string, string> = {
  furniture: 'Beds, tables, chairs & storage',
  'home-decor': 'Carved mirrors, panels & lamps',
  'kitchen-dining': 'Boards, spice boxes & serving ware',
  gifting: 'Heirloom toys & keepsakes',
};

/** FEATURED_CATEGORIES: editorial collage instead of identical tiles. */
export default function EditorialCategories({ categories, title, subtitle }: { categories: Cat[]; title?: string; subtitle?: string }) {
  const { country } = useCountry();
  const items = categories.slice(0, 4);
  if (!items.length) return null;

  return (
    <Box sx={{ bgcolor: C.sand, py: { xs: 7, md: 11 } }}>
      <Container maxWidth="xl">
        <SectionHead eyebrow="Explore" title={title || 'Shop by Craft'} subtitle={subtitle} />
        <Box sx={{
          display: 'grid', gap: { xs: 1.5, md: 2 },
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(12, 1fr)' },
          gridAutoRows: { xs: '190px', md: '300px' },
        }}>
          {items.map((cat, i) => {
            const [cs, rs] = SPANS[i] || [4, 1];
            return (
              <Box key={cat.id} sx={{
                gridColumn: { xs: i === 0 || (i === items.length - 1 && items.length % 2 === 0) ? 'span 2' : 'span 1', md: `span ${cs}` },
                gridRow: { xs: i === 0 ? 'span 2' : 'span 1', md: `span ${rs}` },
                minHeight: 0,
              }}>
                <Reveal delay={0.06 * i} y={30} className="wv-fill">
                  <Box component={Link} href={withCountry(`/category/${cat.slug}`, country)} sx={{
                    position: 'relative', display: 'block', height: '100%', overflow: 'hidden', borderRadius: '3px', textDecoration: 'none', bgcolor: C.walnut,
                    '&:hover .cat-img': { transform: 'scale(1.07)' },
                    '&:hover .cat-arrow': { transform: 'translateX(6px)', bgcolor: C.copper, color: '#fff' },
                    '&:hover .cat-tag': { opacity: 1, transform: 'none' },
                    '&:focus-visible': { outline: `3px solid ${C.gold}`, outlineOffset: 3 },
                  }}>
                    {cat.image && (
                      <Image className="cat-img" src={cat.image} alt="" fill sizes={i === 0 ? '(max-width: 900px) 100vw, 42vw' : '(max-width: 900px) 50vw, 33vw'}
                        style={{ objectFit: 'cover', transition: 'transform 1.1s cubic-bezier(0.22,1,0.36,1)' }} />
                    )}
                    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(28,15,7,0.82) 0%, rgba(28,15,7,0.12) 55%, rgba(28,15,7,0) 100%)' }} />
                    <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: { xs: 2, md: 3.25 }, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2 }}>
                      <Box>
                        <Typography sx={{ fontFamily: SERIF, color: '#fff', fontWeight: 600, lineHeight: 1.02, fontSize: { xs: i === 0 ? '2.1rem' : '1.55rem', md: i === 0 || i === 2 ? '2.9rem' : '2.1rem' } }}>
                          {cat.name}
                        </Typography>
                        <Typography className="cat-tag" sx={{
                          color: 'rgba(255,252,245,0.85)', fontSize: '0.86rem', mt: 0.75, display: { xs: i === 0 ? 'block' : 'none', md: 'block' },
                          '@media (hover:hover)': { opacity: 0, transform: 'translateY(8px)', transition: 'all .45s ease' },
                        }}>
                          {TAGS[cat.slug] || 'Handcrafted by artisans'}
                        </Typography>
                      </Box>
                      <Box className="cat-arrow" aria-hidden sx={{
                        flexShrink: 0, width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.6)', color: '#fff',
                        display: 'grid', placeItems: 'center', fontSize: '1.1rem', transition: 'all .4s ease',
                      }}>&rarr;</Box>
                    </Box>
                  </Box>
                </Reveal>
              </Box>
            );
          })}
        </Box>
      </Container>
      <style>{`.wv-fill{height:100%}`}</style>
    </Box>
  );
}
