'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { useCountry } from '../../../contexts/CountryContext';
import { withCountry } from '../../../lib/withCountry';
import { C, SERIF, Reveal, SectionHead } from './shared';

interface Artisan { id: string; name: string; bio?: string | null; photo?: string | null; region?: string | null }

/** ARTISAN_SPOTLIGHT: "From the workshop" 4-step process, then the makers. */
export default function WorkshopProcess({ section, artisans }: { section: any; artisans: Artisan[] }) {
  const { country } = useCountry();
  const steps: { n: string; title: string; text: string; image: string }[] = section.config?.steps || [];

  return (
    <Box sx={{ bgcolor: C.cream, py: { xs: 7, md: 11 } }}>
      <Container maxWidth="xl">
        <SectionHead eyebrow="Behind every piece" title={section.title || 'From the workshop'} subtitle={section.subtitle} />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: { xs: 2, md: 3 } }}>
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={0.1 * i} y={34}>
              <Box sx={{ mt: { md: i % 2 ? 6 : 0 } }}>
                <Box sx={{ position: 'relative', aspectRatio: '4 / 5', borderRadius: '3px', overflow: 'hidden', boxShadow: '0 22px 40px -26px rgba(42,25,14,0.6)' }}>
                  <Image src={s.image} alt={s.title} fill sizes="(max-width: 900px) 50vw, 24vw" style={{ objectFit: 'cover' }} />
                  <Typography aria-hidden sx={{ position: 'absolute', top: 6, left: 14, fontFamily: SERIF, fontSize: '3.6rem', color: 'rgba(255,252,245,0.95)', lineHeight: 1, textShadow: '0 2px 14px rgba(0,0,0,0.45)' }}>{s.n}</Typography>
                </Box>
                <Typography sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.35rem', md: '1.7rem' }, color: C.walnut, mt: 2, lineHeight: 1.1 }}>{s.title}</Typography>
                <Typography sx={{ color: '#6b5643', mt: 0.75, fontSize: { xs: '0.86rem', md: '0.95rem' }, lineHeight: 1.65 }}>{s.text}</Typography>
              </Box>
            </Reveal>
          ))}
        </Box>

        {artisans.length > 0 && (
          <Box sx={{ mt: { xs: 8, md: 12 } }}>
            <Reveal>
              <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
                <Typography sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.8rem', md: '2.3rem' }, color: C.walnut }}>{section.config?.artisansTitle || 'Meet the makers'}</Typography>
                <Box component={Link} href={withCountry('/artisans', country)} sx={{ color: C.copper, fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none' }}>All artisans &rarr;</Box>
              </Box>
            </Reveal>
            <Box className="h-scroll" sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1.5, scrollSnapType: 'x proximity', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
              {artisans.slice(0, 8).map((a) => (
                <Box key={a.id} component={Link} href={withCountry(`/artisans/${a.id}`, country)} sx={{
                  flex: '0 0 auto', width: { xs: 250, md: 290 }, scrollSnapAlign: 'start', textDecoration: 'none', p: 2.5, bgcolor: '#fff', border: '1px solid rgba(59,35,20,0.1)',
                  borderRadius: '3px', transition: 'transform .3s, box-shadow .3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 18px 30px -18px rgba(42,25,14,0.4)' },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.75, mb: 1.5 }}>
                    <Box sx={{ position: 'relative', width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', bgcolor: C.walnut, color: C.gold, display: 'grid', placeItems: 'center', fontFamily: SERIF, fontSize: '1.4rem', flexShrink: 0 }}>
                      {a.photo ? <Image src={a.photo} alt="" fill sizes="52px" style={{ objectFit: 'cover' }} /> : a.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, color: C.walnut, fontSize: '0.98rem', lineHeight: 1.2 }}>{a.name}</Typography>
                      {a.region && <Typography sx={{ color: C.copper, fontSize: '0.78rem', mt: 0.25 }}>{a.region}</Typography>}
                    </Box>
                  </Box>
                  {a.bio && <Typography sx={{ color: '#6b5643', fontSize: '0.88rem', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.bio}</Typography>}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
}
