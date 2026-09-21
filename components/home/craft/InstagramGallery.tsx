'use client';
import Image from 'next/image';
import { Box, Container, Typography } from '@mui/material';
import { C, SERIF, Reveal } from './shared';

/** INSTAGRAM_GALLERY: square mosaic from config images; links to the brand profile. */
export default function InstagramGallery({ section }: { section: any }) {
  const cfg = section.config || {};
  const images: { src: string; alt: string }[] = cfg.images || [];
  if (!images.length) return null;
  return (
    <Box sx={{ bgcolor: C.cream, pt: { xs: 7, md: 10 }, pb: { xs: 0, md: 0 } }}>
      <Container maxWidth="xl">
        <Reveal>
          <Box sx={{ textAlign: 'center', mb: { xs: 3.5, md: 5 } }}>
            <Typography sx={{ color: C.copper, letterSpacing: '0.28em', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', mb: 1.5 }}>Instagram</Typography>
            <Typography component="h2" sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '2.1rem', md: '3rem' }, color: C.walnut, lineHeight: 1.05 }}>{section.title || 'Follow the workshop'}</Typography>
            <Box component="a" href={cfg.url || '#'} target="_blank" rel="noopener noreferrer" sx={{ display: 'inline-block', mt: 1.5, color: C.copper, fontWeight: 700, textDecoration: 'none', letterSpacing: '0.06em', '&:hover': { textDecoration: 'underline' } }}>
              @{cfg.handle || 'thewoodvintage'}
            </Box>
          </Box>
        </Reveal>
      </Container>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', lg: 'repeat(8, 1fr)' }, gap: 0 }}>
        {images.slice(0, 8).map((im, i) => (
          <Box key={im.src} component="a" href={cfg.url || '#'} target="_blank" rel="noopener noreferrer" aria-label="View on Instagram" sx={{
            position: 'relative', aspectRatio: '1 / 1', overflow: 'hidden', display: 'block', bgcolor: C.walnut,
            '&:hover img': { transform: 'scale(1.1)' }, '&:hover .ig-ov, &:focus-visible .ig-ov': { opacity: 1 },
          }}>
            <Image src={im.src} alt={im.alt} fill loading="lazy" sizes="(max-width: 600px) 50vw, (max-width: 1200px) 25vw, 12.5vw" style={{ objectFit: 'cover', transition: 'transform .9s cubic-bezier(0.22,1,0.36,1)' }} />
            <Box className="ig-ov" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(42,25,14,0.5)', opacity: 0, transition: 'opacity .35s', display: 'grid', placeItems: 'center', color: '#fff' }}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" /></svg>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
