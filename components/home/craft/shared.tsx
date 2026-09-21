'use client';
import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import RevealBase from '../../common/Reveal';

/** Palette shared by the craft-led homepage sections (matches the MUI theme). */
export const C = {
  walnut: '#3B2314',
  deep: '#2A190E',
  copper: '#A0693A',
  copperDark: '#7E5029',
  gold: '#D9A66E',
  cream: '#FFFCF5',
  sand: '#F6EEDF',
  ink: '#2A190E',
};

export const SERIF = '"Cormorant Garamond", "Playfair Display", Georgia, serif';

/** Fade-and-rise on scroll (CSS + IntersectionObserver; honours reduced motion). */
export function Reveal({ children, delay = 0, y = 24, className }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return <RevealBase delay={delay} y={y} className={className}>{children}</RevealBase>;
}

interface HeadProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  light?: boolean;
}

/** Section heading: copper eyebrow, Cormorant title, hairline ornament. */
export function SectionHead({ eyebrow, title, subtitle, align = 'left', light }: HeadProps) {
  const center = align === 'center';
  return (
    <Reveal>
      <Box sx={{ mb: { xs: 3.5, md: 6 }, textAlign: align, maxWidth: center ? 720 : 640, mx: center ? 'auto' : 0 }}>
        {eyebrow && (
          <Typography sx={{ color: light ? C.gold : C.copper, letterSpacing: '0.28em', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', mb: 1.5 }}>
            {eyebrow}
          </Typography>
        )}
        <Typography component="h2" sx={{
          fontFamily: SERIF, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.01em',
          fontSize: { xs: '2.1rem', sm: '2.7rem', md: '3.4rem' }, color: light ? '#fff' : C.walnut,
        }}>
          {title}
        </Typography>
        <Box sx={{ width: 56, height: 2, bgcolor: light ? C.gold : C.copper, mt: 2, mx: center ? 'auto' : 0 }} />
        {subtitle && (
          <Typography sx={{ color: light ? 'rgba(255,252,245,0.8)' : '#6b5643', mt: 2, fontSize: { xs: '0.98rem', md: '1.08rem' }, lineHeight: 1.7 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Reveal>
  );
}
