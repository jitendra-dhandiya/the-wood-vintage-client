'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';
import { productApi } from '../../../services/api.service';
import { useCountry } from '../../../contexts/CountryContext';
import { withCountry } from '../../../lib/withCountry';
import { C, SERIF, SectionHead } from './shared';

interface Look { label: string; note: string; collection: string; image: string }
const inr = (n: any) => `₹${Math.round(Number(n)).toLocaleString('en-IN')}`;

/** SHOP_BY_LOOK: curated rooms; picks a look and lists its products from a collection. */
export default function ShopTheLook({ section }: { section: any }) {
  const { country } = useCountry();
  const looks: Look[] = section.config?.looks || [];
  const [active, setActive] = useState(0);
  const [cache, setCache] = useState<Record<string, any[]>>({});
  const look = looks[active];

  useEffect(() => {
    if (!look || cache[look.collection]) return;
    let live = true;
    productApi.getAll({ collectionSlug: look.collection, limit: 4, country: country || undefined })
      .then(({ data }) => { if (live) setCache((c) => ({ ...c, [look.collection]: (data as any).data || [] })); })
      .catch(() => { if (live) setCache((c) => ({ ...c, [look.collection]: [] })); });
    return () => { live = false; };
  }, [look, cache, country]);

  if (!looks.length) return null;
  const products = (cache[look.collection] || []).slice(0, 4);

  return (
    <Box sx={{ bgcolor: C.cream, py: { xs: 7, md: 11 } }}>
      <Container maxWidth="xl">
        <SectionHead eyebrow="Curated for you" title={section.title || 'Shop the look'} subtitle={section.subtitle} />

        <Box role="tablist" aria-label="Rooms" sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1, mb: 3, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
          {looks.map((l, i) => (
            <Box key={l.label} component="button" role="tab" aria-selected={i === active} onClick={() => setActive(i)} sx={{
              flex: '0 0 auto', cursor: 'pointer', border: `1px solid ${i === active ? C.walnut : 'rgba(59,35,20,0.25)'}`, bgcolor: i === active ? C.walnut : 'transparent',
              color: i === active ? '#fff' : C.walnut, fontFamily: 'inherit', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.04em', px: 2.5, py: 1.1, borderRadius: 99, transition: 'all .25s',
              '&:hover': { borderColor: C.walnut }, '&:focus-visible': { outline: `3px solid ${C.gold}`, outlineOffset: 2 },
            }}>{l.label}</Box>
          ))}
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.15fr 1fr' }, gap: { xs: 2.5, md: 4 }, alignItems: 'stretch' }}>
          <Box sx={{ position: 'relative', aspectRatio: { xs: '4 / 3', md: 'auto' }, minHeight: { md: 560 }, borderRadius: '3px', overflow: 'hidden', bgcolor: C.walnut }}>
            {looks.map((l, i) => (
              <Image key={l.image} src={l.image} alt={l.label} fill sizes="(max-width: 900px) 100vw, 55vw"
                style={{ objectFit: 'cover', opacity: i === active ? 1 : 0, transition: 'opacity .7s ease' }} />
            ))}
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(24,13,6,0.8), rgba(24,13,6,0) 55%)' }} />
            <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: { xs: 2.5, md: 4 }, color: '#fff' }}>
              <Typography sx={{ fontFamily: SERIF, fontWeight: 600, fontSize: { xs: '1.9rem', md: '2.8rem' }, lineHeight: 1.05 }}>{look.label}</Typography>
              <Typography sx={{ color: 'rgba(255,252,245,0.85)', mt: 1, maxWidth: 460, lineHeight: 1.6 }}>{look.note}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography sx={{ color: C.copper, letterSpacing: '0.24em', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', mb: 1.5 }}>In this look</Typography>
            <Box sx={{ display: 'grid', gap: 1.5, minHeight: { md: 440 }, alignContent: 'start' }}>
              {products.length === 0 && [0, 1, 2, 3].map((k) => (
                <Box key={k} sx={{ height: 96, bgcolor: 'rgba(59,35,20,0.06)', borderRadius: '3px' }} />
              ))}
              {products.map((p: any) => {
                const img = p.images?.find((x: any) => x.isPrimary)?.url || p.images?.[0]?.url || p.image;
                const price = p.salePrice ?? p.basePrice;
                return (
                  <Box key={p.id} component={Link} href={withCountry(`/product/${p.slug}`, country)} sx={{
                    display: 'flex', gap: 2, alignItems: 'center', p: 1.25, bgcolor: '#fff', border: '1px solid rgba(59,35,20,0.09)', borderRadius: '3px', textDecoration: 'none',
                    transition: 'transform .3s, box-shadow .3s', '&:hover': { transform: 'translateX(6px)', boxShadow: '0 12px 26px -16px rgba(42,25,14,0.45)' },
                  }}>
                    <Box sx={{ position: 'relative', width: 84, height: 84, flexShrink: 0, borderRadius: '2px', overflow: 'hidden', bgcolor: C.sand }}>
                      {img && <Image src={img} alt="" fill sizes="84px" style={{ objectFit: 'cover' }} />}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography sx={{ color: C.walnut, fontWeight: 700, fontSize: '0.98rem', lineHeight: 1.3 }}>{p.name}</Typography>
                      {price != null && <Typography sx={{ color: C.copper, fontWeight: 700, mt: 0.5 }}>{inr(price)}</Typography>}
                    </Box>
                    <Box aria-hidden sx={{ color: C.copper, pr: 1 }}>&rarr;</Box>
                  </Box>
                );
              })}
            </Box>
            <Box component={Link} href={withCountry(`/collections/${look.collection}`, country)} sx={{
              alignSelf: 'flex-start', mt: 3, display: 'inline-flex', bgcolor: C.walnut, color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: '0.78rem', letterSpacing: '0.16em', textTransform: 'uppercase', px: 3.5, py: 1.6,
              '&:hover': { bgcolor: C.copper },
            }}>Shop the full look &rarr;</Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
