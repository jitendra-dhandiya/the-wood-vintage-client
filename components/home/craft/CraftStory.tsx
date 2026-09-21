'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { useCountry } from '../../../contexts/CountryContext';
import { withCountry } from '../../../lib/withCountry';
import CountUp from '../../common/CountUp';
import { C, SERIF, Reveal } from './shared';

interface Props { section: any }

/** BRAND_SECTION: the craft-story strip (photo collage + promise points + numbers). */
export default function CraftStory({ section }: Props) {
  const { country } = useCountry();
  const cfg = section.config || {};
  const points: { title: string; text: string }[] = cfg.points || [];
  const stats: { value: string; label: string }[] = cfg.stats || [];
  const [main, detail] = cfg.images || [];

  return (
    <Box sx={{ bgcolor: C.cream, py: { xs: 7, md: 12 }, position: 'relative', overflow: 'hidden' }}>
      <Container maxWidth="xl">
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' }, gap: { xs: 5, md: 9 }, alignItems: 'center' }}>
          {/* Photo collage */}
          <Reveal>
            <Box sx={{ position: 'relative', pb: { xs: 8, md: 10 }, pr: { xs: 6, md: 10 } }}>
              {main && (
                <Box sx={{ position: 'relative', aspectRatio: '7 / 5', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 30px 60px -30px rgba(42,25,14,0.55)' }}>
                  <Image src={main.src} alt={main.alt} fill sizes="(max-width: 900px) 90vw, 46vw" style={{ objectFit: 'cover' }} />
                </Box>
              )}
              {detail && (
                <Box sx={{
                  position: 'absolute', right: 0, bottom: 0, width: { xs: '44%', md: '40%' }, aspectRatio: '4 / 5',
                  border: `8px solid ${C.cream}`, borderRadius: '4px', overflow: 'hidden', boxShadow: '0 24px 50px -24px rgba(42,25,14,0.6)',
                }}>
                  <Image src={detail.src} alt={detail.alt} fill sizes="(max-width: 900px) 40vw, 20vw" style={{ objectFit: 'cover' }} />
                </Box>
              )}
              <Box sx={{
                position: 'absolute', left: { xs: 12, md: -18 }, bottom: { xs: 12, md: 36 }, bgcolor: C.walnut, color: '#fff',
                px: 2.5, py: 1.75, borderRadius: '2px', maxWidth: 210, boxShadow: '0 14px 30px -14px rgba(0,0,0,0.5)',
              }}>
                <Typography sx={{ fontFamily: SERIF, fontSize: '1.35rem', lineHeight: 1.15, fontStyle: 'italic' }}>
                  Saharanpur, Jodhpur &amp; Channapatna
                </Typography>
                <Typography sx={{ color: C.gold, fontSize: '0.68rem', letterSpacing: '0.2em', mt: 0.75, textTransform: 'uppercase', fontWeight: 700 }}>
                  Our craft clusters
                </Typography>
              </Box>
            </Box>
          </Reveal>

          {/* Copy */}
          <Box>
            <Reveal>
              {cfg.eyebrow && (
                <Typography sx={{ color: C.copper, letterSpacing: '0.28em', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', mb: 1.5 }}>
                  {cfg.eyebrow}
                </Typography>
              )}
              <Typography component="h2" sx={{ fontFamily: SERIF, fontWeight: 600, color: C.walnut, lineHeight: 1.04, fontSize: { xs: '2.3rem', sm: '3rem', md: '3.7rem' }, letterSpacing: '-0.015em' }}>
                {section.title}
              </Typography>
              <Box sx={{ width: 56, height: 2, bgcolor: C.copper, my: 2.5 }} />
              {cfg.body && <Typography sx={{ color: '#5f4a38', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.85, maxWidth: 560 }}>{cfg.body}</Typography>}
            </Reveal>

            <Box sx={{ mt: 4, display: 'grid', gap: 2.5 }}>
              {points.map((p, i) => (
                <Reveal key={p.title} delay={0.08 * (i + 1)} y={16}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'baseline' }}>
                    <Typography sx={{ fontFamily: SERIF, color: C.copper, fontSize: '1.5rem', fontWeight: 600, minWidth: 34 }}>{`0${i + 1}`}</Typography>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: C.walnut, fontSize: '1.02rem' }}>{p.title}</Typography>
                      <Typography sx={{ color: '#6b5643', fontSize: '0.95rem', lineHeight: 1.65 }}>{p.text}</Typography>
                    </Box>
                  </Box>
                </Reveal>
              ))}
            </Box>

            {stats.length > 0 && (
              <Box sx={{ mt: 5, pt: 3.5, borderTop: '1px solid rgba(59,35,20,0.15)', display: 'flex', gap: { xs: 3, md: 6 }, flexWrap: 'wrap' }}>
                {stats.map((s) => (
                  <Box key={s.label}>
                    <Typography sx={{ fontFamily: SERIF, fontSize: { xs: '2.4rem', md: '3rem' }, fontWeight: 600, color: C.copper, lineHeight: 1 }}><CountUp value={s.value} /></Typography>
                    <Typography sx={{ color: '#6b5643', fontSize: '0.78rem', letterSpacing: '0.12em', textTransform: 'uppercase', mt: 0.75, fontWeight: 600 }}>{s.label}</Typography>
                  </Box>
                ))}
              </Box>
            )}

            {cfg.cta && (
              <Box component={Link} href={withCountry(cfg.cta.link, country)} sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1, mt: 4.5, color: C.walnut, fontWeight: 700, fontSize: '0.8rem',
                letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: `2px solid ${C.copper}`, pb: 0.5,
                '&:hover': { color: C.copper },
              }}>
                {cfg.cta.text} <span aria-hidden>&rarr;</span>
              </Box>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
