'use client';
import { useState } from 'react';
import { Box, Container, Typography } from '@mui/material';
import { C, SERIF, Reveal } from './shared';
import { buildImageUrl } from '../../../lib/imageUrl';

/** NEWSLETTER: walnut-textured sign-up band. The footer's duplicate is hidden on the homepage. */
export default function NewsletterBand({ section }: { section: any }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  const tex = section.config?.texture as string | undefined;
  return (
    <Box sx={{
      position: 'relative', py: { xs: 8, md: 12 }, color: '#fff', bgcolor: C.deep, overflow: 'hidden',
      backgroundImage: tex ? `linear-gradient(rgba(42,25,14,0.3), rgba(42,25,14,0.5)), url(${buildImageUrl(tex, 1440)})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      <Container maxWidth="sm">
        <Reveal>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ color: C.gold, letterSpacing: '0.28em', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', mb: 1.5 }}>Newsletter</Typography>
            <Typography component="h2" sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '2.3rem', md: '3.3rem' }, lineHeight: 1.05 }}>{section.title || 'Join The Wood Vintage'}</Typography>
            <Typography sx={{ color: 'rgba(255,252,245,0.85)', mt: 2, mb: 4, lineHeight: 1.7 }}>{section.subtitle}</Typography>
            {done ? (
              <Typography role="status" sx={{ color: C.gold, fontFamily: SERIF, fontSize: '1.6rem' }}>Thank you. Stories from the workshop are on their way.</Typography>
            ) : (
              <Box component="form" onSubmit={(e: React.FormEvent) => { e.preventDefault(); if (email.includes('@')) setDone(true); }} sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', maxWidth: 480, mx: 'auto' }}>
                <Box component="input" type="email" required value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="Your email address" aria-label="Email address" sx={{
                  flex: '1 1 220px', minWidth: 0, px: 2, py: 1.6, bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', fontSize: '1rem', fontFamily: 'inherit', borderRadius: 0,
                  '&::placeholder': { color: 'rgba(255,252,245,0.75)' }, '&:focus': { outline: `2px solid ${C.gold}`, outlineOffset: 2 },
                }} />
                <Box component="button" type="submit" sx={{ px: 3.5, py: 1.6, bgcolor: C.copper, color: '#fff', border: 0, fontWeight: 700, letterSpacing: '0.14em', fontSize: '0.78rem', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', '&:hover': { bgcolor: C.copperDark }, '&:focus-visible': { outline: `2px solid ${C.gold}`, outlineOffset: 2 } }}>Subscribe</Box>
              </Box>
            )}
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}
