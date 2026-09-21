'use client';
import Link from 'next/link';
import { Box, IconButton, Typography } from '@mui/material';
import { Add, Remove, DeleteOutline, ErrorOutline } from '@mui/icons-material';
import ComboMedia from './ComboMedia';
import { useCart } from '../../hooks/useCart';
import { useCountry } from '../../contexts/CountryContext';
import { withCountry } from '../../lib/withCountry';
import { formatPrice } from '../../utils/format';
import type { CartCombo } from '../../types';

/**
 * A combo bundle in the cart (decision 0037). It is ONE atomic line: the items
 * inside are listed but not individually editable — only the number of sets or
 * removing the whole set. That is what keeps the combo price honest.
 */
export default function CartComboLine({ line, compact = false, onNavigate }: { line: CartCombo; compact?: boolean; onNavigate?: () => void }) {
  const { country } = useCountry();
  const { updateComboQuantity, removeCombo } = useCart();
  const c = line.combo;
  const sym = c.currencySymbol;
  const imgW = compact ? 80 : 100;
  const imgH = compact ? 107 : 130;
  const href = withCountry(`/combo/${c.slug}`, country);

  return (
    <Box data-cart-combo sx={{ display: 'flex', gap: 2, ...(compact ? { pb: 2, borderBottom: '1px solid', borderColor: 'divider' } : {}) }}>
      <Box component={Link} href={href} onClick={onNavigate} sx={{ position: 'relative', width: imgW, height: imgH, flexShrink: 0, bgcolor: '#f3ece0', borderRadius: 1, overflow: 'hidden', display: 'block' }}>
        <ComboMedia combo={c} sizes={`${imgW}px`} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography component="span" sx={{ display: 'inline-block', bgcolor: '#3B2314', color: '#fff', px: 0.9, py: 0.1, borderRadius: 0.75, fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.5 }}>
              Combo
            </Typography>
            <Typography component={Link} href={href} onClick={onNavigate} sx={{ display: 'block', fontWeight: 700, textDecoration: 'none', color: 'inherit', lineHeight: 1.25, '&:hover': { color: '#A0693A' }, fontSize: compact ? '0.9rem' : '1rem' }}>
              {c.name}
            </Typography>
          </Box>
          <IconButton size="small" aria-label={`Remove ${c.name}`} onClick={() => removeCombo(line.id)} sx={{ color: '#999' }}>
            <DeleteOutline fontSize="small" />
          </IconButton>
        </Box>

        <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2, color: 'text.secondary', fontSize: '0.78rem', lineHeight: 1.5 }}>
          {c.items.map((it) => (
            <li key={`${it.productId}-${it.variantId ?? ''}`}>
              {it.quantity} × {it.name}{it.size || it.color ? ` (${[it.size, it.color].filter(Boolean).join(' / ')})` : ''}
            </li>
          ))}
        </Box>

        {line.problem && (
          <Box sx={{ mt: 1, display: 'flex', gap: 0.75, alignItems: 'flex-start', color: '#b3261e' }}>
            <ErrorOutline sx={{ fontSize: 16, mt: '2px' }} />
            <Typography variant="caption" sx={{ lineHeight: 1.4 }}>{line.problem}. Remove this combo or change its quantity to continue.</Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.25, gap: 1, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }} aria-label="Number of sets">
            <IconButton size="small" aria-label="Fewer sets" onClick={() => updateComboQuantity(line.id, line.quantity - 1)} sx={{ p: 0.5 }}><Remove fontSize="inherit" /></IconButton>
            <Typography sx={{ px: 1.75, fontSize: '0.9rem', fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{line.quantity}</Typography>
            <IconButton size="small" aria-label="More sets" onClick={() => updateComboQuantity(line.id, line.quantity + 1)} sx={{ p: 0.5 }}><Add fontSize="inherit" /></IconButton>
          </Box>
          {line.lineTotal != null && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography fontWeight={700}>{formatPrice(line.lineTotal, sym)}</Typography>
              {line.savings != null && line.savings > 0 && (
                <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 700 }}>You save {formatPrice(line.savings, sym)}</Typography>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}
