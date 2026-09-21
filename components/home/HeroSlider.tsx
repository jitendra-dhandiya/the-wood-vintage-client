'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import type { Banner } from '../../types';
import { resolveBannerLink } from '../../lib/bannerLink';
import { useCountry } from '../../contexts/CountryContext';
import { withCountry } from '../../lib/withCountry';
import { buildImageUrl } from '../../lib/imageUrl';
import { C, SERIF } from './craft/shared';

const DELAY = 6500;
const HERO_H = { md: 640, lg: 680 };

interface Props {
  banners: Banner[];
  /** Section config: `texture` is a walnut wood-grain background for the copy panel. */
  config?: { texture?: string } | null;
}

/**
 * Split hero: a walnut copy panel beside full-height craft photography that
 * crossfades between 2-3 slides. Autoplay pauses on hover/focus and is off
 * entirely (with no Ken Burns drift) under prefers-reduced-motion. The image
 * column has a fixed box, so slides changing never shifts layout.
 */
export default function HeroSlider({ banners, config }: Props) {
  const { country } = useCountry();
  // State (not a render-time media read) so SSR and the first client render match.
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduce(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = banners.length;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((i: number) => setIdx(((i % n) + n) % n), [n]);

  useEffect(() => {
    if (reduce || paused || n < 2) return;
    timer.current = setTimeout(() => setIdx((i) => (i + 1) % n), DELAY);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [idx, reduce, paused, n]);

  if (!n) {
    return <Box sx={{ minHeight: { xs: 360, md: 520 }, bgcolor: C.walnut }} />;
  }
  const b = banners[idx];
  const target = resolveBannerLink(b.link);
  const href = target ? (target.external ? target.href : withCountry(target.href, country)) : null;
  const tex = config?.texture ? buildImageUrl(config.texture, 1440) : null;

  return (
    <Box
      component="section" aria-roledescription="carousel" aria-label="Featured craft"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
      sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, height: { md: HERO_H.md, lg: HERO_H.lg }, bgcolor: C.deep }}
    >
      {/* Photography */}
      <Box sx={{ order: { xs: 1, md: 2 }, position: 'relative', overflow: 'hidden', aspectRatio: { xs: '5 / 4', md: 'auto' }, bgcolor: C.walnut }}>
        {banners.map((bn, i) => (
          <Box key={bn.id} aria-hidden={i !== idx} sx={{ position: 'absolute', inset: 0, opacity: i === idx ? 1 : 0, transition: 'opacity 1.2s ease', zIndex: i === idx ? 1 : 0 }}>
            <Box className="hero-ken" sx={{
              position: 'absolute', inset: 0,
              animation: i === idx ? `wvKen ${DELAY + 2500}ms ease-out forwards` : 'none',
              '@keyframes wvKen': { from: { transform: 'scale(1)' }, to: { transform: 'scale(1.07)' } },
            }}>
              <Image src={bn.image} alt={bn.title} fill priority={i === 0} loading={i === 0 ? 'eager' : 'lazy'} sizes="(max-width: 900px) 100vw, 58vw" style={{ objectFit: 'cover', objectPosition: 'center 30%' }} />
            </Box>
          </Box>
        ))}
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: { md: 'linear-gradient(90deg, rgba(42,25,14,0.55) 0%, rgba(42,25,14,0) 22%)', xs: 'linear-gradient(to top, rgba(42,25,14,0.5), rgba(42,25,14,0) 40%)' } }} />
        {n > 1 && (
          <Box sx={{ position: 'absolute', zIndex: 3, right: { xs: 12, md: 28 }, bottom: { xs: 12, md: 28 }, display: 'flex', gap: 1 }}>
            {[{ l: 'Previous slide', d: -1, t: '←' }, { l: 'Next slide', d: 1, t: '→' }].map((a) => (
              <Box key={a.l} component="button" aria-label={a.l} onClick={() => go(idx + a.d)} sx={{
                width: 44, height: 44, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.7)', bgcolor: 'rgba(42,25,14,0.35)', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', backdropFilter: 'blur(4px)',
                '&:hover': { bgcolor: C.copper, borderColor: C.copper }, '&:focus-visible': { outline: `3px solid ${C.gold}`, outlineOffset: 2 },
              }}>{a.t}</Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Copy panel */}
      <Box sx={{
        order: { xs: 2, md: 1 }, position: 'relative', display: 'flex', alignItems: 'center', color: '#fff', overflow: 'hidden',
        backgroundColor: C.deep,
        backgroundImage: tex ? `linear-gradient(180deg, rgba(42,25,14,0.55), rgba(42,25,14,0.8)), url(${tex})` : undefined,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <Container maxWidth={false} sx={{ maxWidth: 640, ml: { md: 'auto' }, mr: { md: 0 }, py: { xs: 5, md: 0 }, pl: { md: 6, lg: 8 }, pr: { md: 5, lg: 7 } }}>
          <Box aria-live={paused ? 'polite' : 'off'} sx={{ minHeight: { xs: 250, md: 0 } }}>
            <Typography sx={{ color: C.gold, letterSpacing: '0.32em', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', mb: 2.25 }}>
              Handcrafted in India
            </Typography>
            <Typography key={b.id} component="h1" className="hero-rise" style={{ '--hero-delay': '0.05s' } as React.CSSProperties} sx={{
              fontFamily: SERIF, fontWeight: 600, lineHeight: 1.02, letterSpacing: '-0.015em', fontSize: { xs: '2.6rem', sm: '3.2rem', md: '3.6rem', lg: '4.6rem' },
            }}>
              {b.title}
            </Typography>
            {b.subtitle && (
              <Typography key={`s${b.id}`} className="hero-rise" style={{ '--hero-delay': '0.18s' } as React.CSSProperties} sx={{ color: 'rgba(255,252,245,0.88)', mt: 2.5, fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.7, maxWidth: 460 }}>{b.subtitle}</Typography>
            )}
            <Box key={`c${b.id}`} className="hero-rise" style={{ '--hero-delay': '0.3s' } as React.CSSProperties} sx={{ mt: 4, display: 'flex', gap: 2.5, alignItems: 'center', flexWrap: 'wrap' }}>
              {href && b.ctaText && (
                <Box component={Link} href={href} sx={{
                  display: 'inline-flex', bgcolor: C.copper, color: '#fff', px: 4.25, py: 1.75, fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none',
                  transition: 'background-color .25s, transform .25s', '&:hover': { bgcolor: C.copperDark, transform: 'translateY(-2px)' }, '&:focus-visible': { outline: `3px solid ${C.gold}`, outlineOffset: 3 },
                }}>{b.ctaText}</Box>
              )}
              <Box component={Link} href={withCountry('/about', country)} sx={{ color: '#fff', fontWeight: 600, fontSize: '0.86rem', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.55)', pb: 0.25, '&:hover': { borderColor: C.gold, color: C.gold } }}>
                Meet the artisans
              </Box>
            </Box>
          </Box>

          {n > 1 && (
            <Box sx={{ mt: { xs: 3.5, md: 6 }, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontFamily: SERIF, fontSize: '1.15rem', color: C.gold, minWidth: 54 }}>{`0${idx + 1}`}<Box component="span" sx={{ opacity: 0.55 }}>{` / 0${n}`}</Box></Typography>
              <Box role="tablist" aria-label="Choose slide" sx={{ display: 'flex', gap: 1, flex: 1, maxWidth: 260 }}>
                {banners.map((bn, i) => (
                  <Box key={bn.id} component="button" role="tab" aria-selected={i === idx} aria-label={`Slide ${i + 1}: ${bn.title}`} onClick={() => go(i)} sx={{
                    flex: 1, height: 22, p: 0, border: 0, bgcolor: 'transparent', cursor: 'pointer', position: 'relative',
                    '&::before': { content: '""', position: 'absolute', left: 0, right: 0, top: 10, height: 2, bgcolor: 'rgba(255,255,255,0.28)' },
                    '&::after': { content: '""', position: 'absolute', left: 0, top: 10, height: 2, bgcolor: C.gold, width: i < idx || (i === idx && (reduce || paused || n < 2)) ? '100%' : 0,
                      ...(i === idx && !paused ? { animation: `wvBar ${DELAY}ms linear forwards`, '@keyframes wvBar': { from: { width: 0 }, to: { width: '100%' } } } : {}) },
                    '&:focus-visible': { outline: `2px solid ${C.gold}`, outlineOffset: 2 },
                  }} />
                ))}
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </Box>
  );
}
