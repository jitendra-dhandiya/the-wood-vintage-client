'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { useCountry } from '../../../contexts/CountryContext';
import { withCountry } from '../../../lib/withCountry';
import { C, SERIF, SectionHead } from './shared';

interface Mat { id: string; name: string; slug: string; image?: string | null; description?: string | null }

/**
 * SHOP_BY_MATERIAL: wood storytelling. Desktop: tall swatch panels that open on
 * hover / focus (Sheesham first). Mobile: stacked cards. Copy comes from the
 * section config (`woods`), imagery and descriptions from the materials API.
 */
export default function WoodStory({ materials, section }: { materials: Mat[]; section: any }) {
  const { country } = useCountry();
  const woods: { slug: string; tagline: string; best: string }[] = section.config?.woods || [];
  const items = woods.map((w) => ({ w, m: materials.find((m) => m.slug === w.slug) })).filter((x) => x.m) as { w: typeof woods[number]; m: Mat }[];
  const [active, setActive] = useState(0);
  if (!items.length) return null;

  return (
    <Box sx={{ bgcolor: C.deep, py: { xs: 7, md: 11 } }}>
      <Container maxWidth="xl">
        <SectionHead light eyebrow="Materials" title={section.title || 'Know your wood'} subtitle={section.subtitle} />
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1.5, md: 1.25 }, height: { md: 520 } }}>
          {items.map(({ w, m }, i) => {
            const open = active === i;
            return (
              <Box key={m.id} component={Link} href={withCountry(`/shop?materialSlug=${m.slug}`, country)}
                onMouseEnter={() => setActive(i)} onFocus={() => setActive(i)}
                sx={{
                  position: 'relative', overflow: 'hidden', borderRadius: '3px', textDecoration: 'none', color: '#fff', bgcolor: C.walnut,
                  minHeight: { xs: 280, md: 0 }, flex: { xs: '0 0 auto', md: open ? '3.4 1 0' : '1 1 0' },
                  transition: 'flex 0.7s cubic-bezier(0.22,1,0.36,1)',
                  '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                  '&:focus-visible': { outline: `3px solid ${C.gold}`, outlineOffset: 2 },
                }}>
                {m.image && <Image src={m.image} alt={`${m.name} wood grain`} fill sizes="(max-width: 900px) 100vw, 45vw" style={{ objectFit: 'cover' }} />}
                <Box sx={{ position: 'absolute', inset: 0, background: { xs: 'linear-gradient(to top, rgba(22,12,5,0.95) 0%, rgba(22,12,5,0.78) 60%, rgba(22,12,5,0.5) 100%)', md: 'linear-gradient(to top, rgba(22,12,5,0.92) 0%, rgba(22,12,5,0.35) 60%, rgba(22,12,5,0.1) 100%)' } }} />
                {/* Collapsed label (desktop): vertical name */}
                <Typography aria-hidden sx={{
                  display: { xs: 'none', md: 'block' }, position: 'absolute', left: 22, bottom: 26, fontFamily: SERIF, fontSize: '1.8rem', fontWeight: 600,
                  writingMode: 'vertical-rl', transform: 'rotate(180deg)', opacity: open ? 0 : 1, transition: 'opacity .3s',
                }}>{m.name}</Typography>
                <Box sx={{
                  position: 'absolute', left: 0, right: 0, bottom: 0, p: { xs: 2.5, md: 4 },
                  opacity: { xs: 1, md: open ? 1 : 0 }, transform: { md: open ? 'none' : 'translateY(14px)' }, transition: 'all .55s ease .1s',
                }}>
                  <Typography sx={{ color: C.gold, fontSize: '0.7rem', letterSpacing: '0.26em', fontWeight: 700, textTransform: 'uppercase', mb: 1 }}>{w.tagline}</Typography>
                  <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '2.4rem', md: '3.4rem' }, fontWeight: 600, lineHeight: 1 }}>{m.name}</Typography>
                  {m.description && (
                    <Typography sx={{ color: 'rgba(255,252,245,0.85)', mt: 1.5, lineHeight: 1.7, fontSize: '0.98rem', maxWidth: 520,
                      display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {m.description}
                    </Typography>
                  )}
                  <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                    <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,252,245,0.7)' }}>Best for: <b style={{ color: '#fff', fontWeight: 600 }}>{w.best}</b></Typography>
                    <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold }}>Shop {m.name} &rarr;</Typography>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
