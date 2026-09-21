'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { useCountry } from '../../../contexts/CountryContext';
import { withCountry } from '../../../lib/withCountry';
import { C, SERIF, Reveal, SectionHead } from './shared';

interface Room { id: string; name: string; slug: string; image?: string | null; description?: string | null }

// [col span, row span] on a 12-col grid with 165px rows. Two blocks of 3 rows: 5+4+3 / 4+3+5 columns.
const SPANS: [number, number][] = [[5, 3], [4, 2], [3, 3], [4, 1], [4, 3], [3, 2], [5, 3], [3, 1]];

/** SHOP_BY_ROOM: asymmetric room collage with hover reveal. */
export default function RoomsCollage({ rooms, title, subtitle }: { rooms: Room[]; title?: string; subtitle?: string }) {
  const { country } = useCountry();
  const items = rooms.slice(0, 8);
  if (!items.length) return null;

  return (
    <Box sx={{ bgcolor: C.sand, py: { xs: 7, md: 11 } }}>
      <Container maxWidth="xl">
        <SectionHead eyebrow="Room by room" title={title || 'Shop by Room'} subtitle={subtitle} />
        <Box sx={{
          display: 'grid', gap: { xs: 1.25, md: 2 },
          gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(12, 1fr)' },
          gridAutoRows: { xs: '120px', md: '165px' },
          gridAutoFlow: 'dense',
        }}>
          {items.map((r, i) => {
            const [cs, rs] = SPANS[i] || [4, 2];
            const mobSpan = i === 0 || i === items.length - 1 ? 2 : 1;
            const tall = rs >= 2;
            return (
              <Box key={r.id} sx={{ gridColumn: { xs: `span ${mobSpan}`, md: `span ${cs}` }, gridRow: { xs: 'span 2', md: `span ${rs}` }, minHeight: 0 }}>
                <Reveal delay={0.05 * (i % 4)} y={26} className="wv-fill">
                  <Box component={Link} href={withCountry(`/shop?roomSlug=${r.slug}`, country)} sx={{
                    position: 'relative', display: 'block', height: '100%', overflow: 'hidden', borderRadius: '3px', bgcolor: C.walnut, textDecoration: 'none', color: '#fff',
                    '&:hover .room-img, &:focus-visible .room-img': { transform: 'scale(1.08)' },
                    '&:hover .room-more, &:focus-visible .room-more': { opacity: 1, transform: 'none' },
                    '&:hover .room-shade, &:focus-visible .room-shade': { opacity: 1 },
                    '&:focus-visible': { outline: `3px solid ${C.gold}`, outlineOffset: 3 },
                  }}>
                    {r.image && <Image className="room-img" src={r.image} alt="" fill sizes={cs >= 5 ? '(max-width: 900px) 100vw, 42vw' : '(max-width: 900px) 50vw, 33vw'} style={{ objectFit: 'cover', transition: 'transform 1.2s cubic-bezier(0.22,1,0.36,1)' }} />}
                    <Box className="room-shade" sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(24,13,6,0.85) 0%, rgba(24,13,6,0.1) 60%, rgba(24,13,6,0) 100%)', opacity: 0.9, transition: 'opacity .5s' }} />
                    <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: { xs: 1.5, md: 2.5 } }}>
                      <Typography sx={{ fontFamily: SERIF, fontWeight: 600, lineHeight: 1.05, fontSize: { xs: '1.35rem', md: tall ? '2.1rem' : '1.55rem' } }}>{r.name}</Typography>
                      <Box className="room-more" sx={{ mt: 0.75, display: { xs: 'none', md: tall ? 'block' : 'none' }, '@media (hover:hover)': { opacity: 0, transform: 'translateY(10px)', transition: 'all .5s ease' } }}>
                        {r.description && <Typography sx={{ fontSize: '0.86rem', color: 'rgba(255,252,245,0.85)', lineHeight: 1.55, maxWidth: 360, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.description}</Typography>}
                        <Typography sx={{ color: C.gold, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Shop the room &rarr;</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Reveal>
              </Box>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
