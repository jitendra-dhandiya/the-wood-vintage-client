'use client';
import { Box, Container, Typography } from '@mui/material';
import { C, SERIF, Reveal } from './shared';

const ICONS: Record<string, React.ReactElement> = {
  hand: <path d="M7 11V5.5a1.5 1.5 0 013 0V10m0-5.5a1.5 1.5 0 013 0V10m0-4a1.5 1.5 0 013 0v6.5m0-3a1.5 1.5 0 013 0V15c0 4-3 7-7 7h-1.5c-2.5 0-4-1-5.5-3l-3-4.5a1.5 1.5 0 012.3-1.8L7 15" />,
  leaf: <path d="M5 19c0-9 5-14 15-14 0 9-4 15-12 15M5 19c2-4 5-7 9-9" />,
  ruler: <path d="M3 17L17 3l4 4L7 21l-4-4zM8 12l2 2m1-5l2 2m1-5l2 2" />,
  truck: <path d="M2 6h11v10H2zM13 9h4l4 3v4h-8M6.5 19a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6zm11 0a1.8 1.8 0 100-3.6 1.8 1.8 0 000 3.6z" />,
};

/** PROMO_STRIP: trust row (hand-finished, sustainable, made to order, delivery). */
export default function TrustRow({ section }: { section: any }) {
  const items: { icon: string; label: string; desc: string }[] = section.config?.items || [];
  if (!items.length) return null;
  return (
    <Box sx={{ bgcolor: C.sand, py: { xs: 5, md: 7 }, borderTop: '1px solid rgba(59,35,20,0.08)' }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 3.5, md: 4 } }}>
          {items.map((it, i) => (
            <Reveal key={it.label} delay={0.07 * i} y={16}>
              <Box sx={{ textAlign: 'center' }}>
                <Box sx={{ width: 58, height: 58, mx: 'auto', mb: 1.75, borderRadius: '50%', border: `1px solid ${C.copper}`, color: C.copper, display: 'grid', placeItems: 'center' }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICONS[it.icon] || ICONS.hand}</svg>
                </Box>
                <Typography sx={{ fontFamily: SERIF, fontWeight: 700, fontSize: { xs: '1.25rem', md: '1.45rem' }, color: C.walnut, lineHeight: 1.1 }}>{it.label}</Typography>
                <Typography sx={{ color: '#6b5643', fontSize: '0.86rem', lineHeight: 1.6, mt: 0.75, maxWidth: 240, mx: 'auto' }}>{it.desc}</Typography>
              </Box>
            </Reveal>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
