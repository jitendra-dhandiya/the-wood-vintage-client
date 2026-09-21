'use client';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import Reveal from '../common/Reveal';
import ComboCard from './ComboCard';
import { useCombos } from './useCombos';
import { useCountry } from '../../contexts/CountryContext';
import { withCountry } from '../../lib/withCountry';

/**
 * Homepage section COMBO_OFFERS (decision 0037): the combos the admin flagged
 * "show on home", already filtered to the visitor's market by the server. With
 * nothing to show the section renders nothing at all.
 */
export default function ComboOffersSection({ title, subtitle, limit = 3 }: { title?: string | null; subtitle?: string | null; limit?: number }) {
  const { country } = useCountry();
  const { combos } = useCombos({ home: true, limit });
  if (!combos.length) return null;

  return (
    <Box component="section" sx={{ bgcolor: '#FFFCF5', py: { xs: 6, md: 9 } }}>
      <Box sx={{ maxWidth: 1536, mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: { xs: 3, md: 4 }, flexWrap: 'wrap', gap: 1.5 }}>
          <Reveal y={16} style={{ minWidth: 0 }}>
            <Box>
              <Typography variant="overline" sx={{ color: '#A0693A', letterSpacing: '0.26em', fontWeight: 700, display: 'block', fontSize: '0.7rem', mb: 1 }}>
                {subtitle || 'Combo offers'}
              </Typography>
              <Typography variant="h2" sx={{ fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontWeight: 600, fontSize: { xs: '2.1rem', md: '3rem' }, color: '#3B2314', letterSpacing: '-0.01em', lineHeight: 1.05 }}>
                {title || 'Complete the set, save more'}
              </Typography>
            </Box>
          </Reveal>
          <Typography component={Link} href={withCountry('/combos', country)} sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#111', textDecoration: 'underline', textUnderlineOffset: 3, '&:hover': { color: '#A0693A' } }}>
            View all combos
          </Typography>
        </Box>

        {/* Phones: one card and a peek of the next, swipeable. Larger screens: a grid. */}
        <Box sx={{
          display: { xs: 'flex', md: 'grid' }, gridTemplateColumns: { md: 'repeat(3, 1fr)' }, gap: { xs: 2, md: 3 },
          overflowX: { xs: 'auto', md: 'visible' }, scrollSnapType: { xs: 'x mandatory', md: 'none' },
          mx: { xs: -2, sm: -3, md: 0 }, px: { xs: 2, sm: 3, md: 0 }, pb: { xs: 1, md: 0 },
          scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' },
        }}>
          {combos.map((c, i) => (
            <Box key={c.id} sx={{ flex: { xs: '0 0 84%', sm: '0 0 46%', md: 'auto' }, scrollSnapAlign: 'start', minWidth: 0 }}>
              <Reveal y={18} index={i % 3} style={{ height: '100%' }}><ComboCard combo={c} /></Reveal>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
