'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Button, Typography } from '@mui/material';
import { useCombos } from './useCombos';
import { comboBadge } from './ComboCard';
import { useCart } from '../../hooks/useCart';
import { useCountry } from '../../contexts/CountryContext';
import { withCountry } from '../../lib/withCountry';
import { formatPrice } from '../../utils/format';

/**
 * "Complete the set / Save with a combo" on a product page: the combos (in this
 * visitor's market) that contain this product. Renders nothing when there are none.
 */
export default function ComboProductBlock({ productId }: { productId: string }) {
  const { country } = useCountry();
  const { combos } = useCombos({ productId, limit: 3 });
  const { addComboToCart, isLoading } = useCart();
  if (!combos.length) return null;

  return (
    <Box sx={{ mt: 4, border: '1px solid #E6DAC6', borderRadius: 2, bgcolor: '#FFFCF5', overflow: 'hidden' }} data-combo-block>
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid #EFE6D6' }}>
        <Typography sx={{ fontWeight: 800, color: '#3B2314', letterSpacing: '0.02em' }}>Complete the set, save with a combo</Typography>
        <Typography variant="caption" color="text.secondary">This piece is part of {combos.length === 1 ? 'a combo' : `${combos.length} combos`}</Typography>
      </Box>
      {combos.map((c, idx) => (
        <Box key={c.id} sx={{ p: 2.5, borderTop: idx ? '1px solid #EFE6D6' : 'none' }}>
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Box sx={{ minWidth: 0, flex: '1 1 200px' }}>
              <Typography component={Link} href={withCountry(`/combo/${c.slug}`, country)} sx={{ fontWeight: 700, color: '#3B2314', textDecoration: 'none', '&:hover': { color: '#A0693A' } }}>
                {c.name}
              </Typography>
              <Typography variant="caption" sx={{ display: 'inline-block', ml: 1, px: 0.9, py: 0.15, borderRadius: 0.75, bgcolor: '#3B2314', color: '#fff', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.6rem' }}>
                {comboBadge(c)}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography component="span" sx={{ fontWeight: 800, color: '#3B2314' }}>{formatPrice(c.price, c.currencySymbol)}</Typography>
              <Typography component="span" sx={{ ml: 1, textDecoration: 'line-through', color: '#8b7b6b', fontSize: '0.85rem' }}>{formatPrice(c.separateTotal, c.currencySymbol)}</Typography>
              <Typography sx={{ color: '#2e7d32', fontWeight: 700, fontSize: '0.8rem' }}>You save {formatPrice(c.savings, c.currencySymbol)}</Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
            {c.items.map((it) => (
              <Box key={`${it.productId}-${it.variantId ?? ''}`} title={it.name} sx={{ position: 'relative', width: 52, height: 52, borderRadius: 1, overflow: 'hidden', bgcolor: '#f3ece0', outline: it.productId === productId ? '2px solid #A0693A' : '1px solid #EFE6D6' }}>
                {it.image && <Image src={it.image} alt={it.name} fill sizes="52px" style={{ objectFit: 'cover' }} />}
                {it.quantity > 1 && (
                  <Box sx={{ position: 'absolute', right: 0, bottom: 0, bgcolor: 'rgba(59,35,20,.85)', color: '#fff', fontSize: '0.6rem', px: 0.5, fontWeight: 700 }}>×{it.quantity}</Box>
                )}
              </Box>
            ))}
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="outlined" component={Link} href={withCountry(`/combo/${c.slug}`, country)} sx={{ borderColor: '#3B2314', color: '#3B2314', fontWeight: 700 }}>View set</Button>
            <Button size="small" variant="contained" disabled={!c.inStock || isLoading} onClick={() => addComboToCart(c.id, 1)} sx={{ bgcolor: '#3B2314', fontWeight: 700, '&:hover': { bgcolor: '#2A190E' } }}>
              {c.inStock ? 'Add set to bag' : 'Out of stock'}
            </Button>
          </Box>
          {!c.inStock && (
            <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: '#b3261e' }}>
              Unavailable: {c.outOfStock.join(', ')} {c.outOfStock.length > 1 ? 'are' : 'is'} out of stock
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
}
