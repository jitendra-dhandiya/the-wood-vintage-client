'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Button, Typography } from '@mui/material';
import { ShoppingBagOutlined } from '@mui/icons-material';
import ComboMedia from './ComboMedia';
import { useCart } from '../../hooks/useCart';
import { useCountry } from '../../contexts/CountryContext';
import { withCountry } from '../../lib/withCountry';
import { formatPrice } from '../../utils/format';
import type { Combo } from '../../types';

/** "Save 22%" unless the admin wrote their own ribbon text. */
export const comboBadge = (c: Combo) => c.badgeText || (c.savingsPercent ? `Save ${c.savingsPercent}%` : 'Combo');

/** Why the combo can't be added right now, in words a shopper can act on. */
export const comboStockMessage = (c: Combo) =>
  c.inStock ? null : `Currently unavailable: ${c.outOfStock.length ? c.outOfStock.join(', ') : 'an item'} ${c.outOfStock.length > 1 ? 'are' : 'is'} out of stock`;

export default function ComboCard({ combo, priority = false }: { combo: Combo; priority?: boolean }) {
  const { country } = useCountry();
  const { addComboToCart, isLoading } = useCart();
  const href = withCountry(`/combo/${combo.slug}`, country);
  const stockMsg = comboStockMessage(combo);
  const sym = combo.currencySymbol;

  return (
    <Box
      data-combo-card
      sx={{
        display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff',
        border: '1px solid #E6DAC6', borderRadius: 2, overflow: 'hidden',
        transition: 'box-shadow .25s ease, transform .25s ease',
        '&:hover': { boxShadow: '0 10px 30px rgba(59,35,20,.12)', transform: 'translateY(-2px)' },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none', '&:hover': { transform: 'none' } },
      }}
    >
      <Box component={Link} href={href} aria-label={combo.name} sx={{ position: 'relative', display: 'block', aspectRatio: '4 / 3', bgcolor: '#f3ece0' }}>
        <ComboMedia combo={combo} sizes="(max-width: 600px) 80vw, (max-width: 1200px) 33vw, 420px" priority={priority} />
        <Box sx={{
          position: 'absolute', top: 12, left: 12, bgcolor: '#3B2314', color: '#fff', px: 1.25, py: 0.5,
          borderRadius: 1, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>
          {comboBadge(combo)}
        </Box>
        {!combo.inStock && (
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,252,245,.6)' }} />
        )}
      </Box>

      <Box sx={{ p: { xs: 2, md: 2.5 }, display: 'flex', flexDirection: 'column', gap: 1.25, flex: 1 }}>
        <Typography component={Link} href={href} sx={{
          fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontWeight: 600,
          fontSize: '1.5rem', lineHeight: 1.1, color: '#3B2314', textDecoration: 'none', '&:hover': { color: '#A0693A' },
        }}>
          {combo.name}
        </Typography>

        {/* What's inside: small thumbnails + names */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {combo.items.map((it) => (
            <Box key={`${it.productId}-${it.variantId ?? ''}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Box sx={{ position: 'relative', width: 30, height: 30, borderRadius: 0.75, overflow: 'hidden', flexShrink: 0, bgcolor: '#f3ece0' }}>
                {it.image && <Image src={it.image} alt="" fill sizes="30px" style={{ objectFit: 'cover' }} />}
              </Box>
              <Typography variant="body2" noWrap sx={{ color: '#5a4636', fontSize: '0.82rem' }}>
                {it.quantity > 1 ? `${it.quantity} × ` : ''}{it.name}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 'auto', pt: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#3B2314' }}>{formatPrice(combo.price, sym)}</Typography>
            <Typography sx={{ textDecoration: 'line-through', color: '#8b7b6b', fontSize: '0.95rem' }}>{formatPrice(combo.separateTotal, sym)}</Typography>
          </Box>
          <Typography sx={{ color: '#2e7d32', fontWeight: 700, fontSize: '0.85rem', mb: 1.5 }}>
            You save {formatPrice(combo.savings, sym)}
          </Typography>
          <Button
            fullWidth variant="contained" disabled={!combo.inStock || isLoading}
            startIcon={<ShoppingBagOutlined />}
            onClick={() => addComboToCart(combo.id, 1)}
            sx={{ bgcolor: '#3B2314', py: 1.2, fontWeight: 700, letterSpacing: '0.06em', '&:hover': { bgcolor: '#2A190E' } }}
          >
            {combo.inStock ? 'Add combo to bag' : 'Unavailable'}
          </Button>
          {stockMsg && <Typography variant="caption" sx={{ display: 'block', mt: 0.75, color: '#b3261e' }}>{stockMsg}</Typography>}
        </Box>
      </Box>
    </Box>
  );
}
