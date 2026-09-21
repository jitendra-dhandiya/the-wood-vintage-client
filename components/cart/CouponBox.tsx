'use client';
import { useState } from 'react';
import { Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { ErrorOutline, LocalOfferOutlined } from '@mui/icons-material';
import { formatPrice } from '../../utils/format';
import type { CouponPreview, Offer } from '../../hooks/useCoupon';

interface Props {
  code: string | null;
  preview: CouponPreview | null;
  applying: boolean;
  checking: boolean;
  error: string | null;
  appliedTick: number;
  offers: Offer[];
  onApply: (code: string) => Promise<boolean>;
  onRemove: () => void;
  onInputChange?: () => void;
  currencySymbol: string;
}

/**
 * Apply / remove a coupon. Shared by the cart page and checkout so both behave
 * identically: an input with a loading state, specific inline errors (the
 * server's own wording), a success chip with a one-shot animation, and a
 * "available offers" hint for public codes such as WELCOME10.
 */
export default function CouponBox({
  code, preview, applying, checking, error, appliedTick, offers,
  onApply, onRemove, onInputChange, currencySymbol,
}: Props) {
  const [input, setInput] = useState('');

  const submit = async () => {
    if (applying) return;
    const ok = await onApply(input);
    if (ok) setInput('');
  };

  if (code) {
    const saving = preview?.freeShipping
      ? 'Free delivery on this order'
      : preview ? `You save ${formatPrice(preview.discount, currencySymbol)}` : 'Checking…';
    return (
      // key = tick, so a fresh apply replays the entrance animation.
      <Box key={appliedTick} className={appliedTick ? 'coupon-in' : undefined}
        sx={{ bgcolor: '#f1f8f1', border: '1px solid #cfe6cf', borderRadius: 1.5, px: 1.5, py: 1.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box component="svg" className={appliedTick ? 'coupon-tick' : undefined} viewBox="0 0 24 24" width={22} height={22}
            sx={{ flexShrink: 0 }} aria-hidden>
            <circle cx="12" cy="12" r="11" fill="#2e7d32" />
            <path d="M6.5 12.5l3.6 3.6 7.4-7.6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
              style={appliedTick ? undefined : { strokeDasharray: 'none', strokeDashoffset: 0 }} />
          </Box>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#1b5e20', fontFamily: 'monospace', letterSpacing: 0.5 }}>
              {code}
            </Typography>
            <Typography variant="caption" sx={{ color: '#2e5d31', display: 'block' }} aria-live="polite">
              {checking && !preview ? 'Checking…' : saving}
            </Typography>
          </Box>
          <Button size="small" onClick={onRemove} aria-label={`Remove coupon ${code}`}
            sx={{ minWidth: 'auto', color: 'text.secondary', textTransform: 'none' }}>
            Remove
          </Button>
        </Box>
        {preview?.needsLogin && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            This code is for one use per customer. We’ll confirm it when you sign in to place your order.
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box>
      <Box component="form" onSubmit={(e: any) => { e.preventDefault(); submit(); }} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          size="small" fullWidth placeholder="Coupon code" value={input}
          onChange={(e) => { setInput(e.target.value.toUpperCase()); onInputChange?.(); }}
          error={!!error}
          inputProps={{ 'aria-label': 'Coupon code', 'aria-invalid': !!error, style: { textTransform: 'uppercase' }, autoCapitalize: 'characters', autoComplete: 'off' }}
        />
        <Button type="submit" variant="outlined" disabled={applying || !input.trim()}
          sx={{ borderColor: '#3B2314', color: '#3B2314', px: 2, minWidth: 84, whiteSpace: 'nowrap' }}>
          {applying ? <CircularProgress size={18} sx={{ color: '#3B2314' }} /> : 'Apply'}
        </Button>
      </Box>

      {error && (
        <Box role="alert" sx={{ display: 'flex', gap: 0.75, alignItems: 'flex-start', mt: 1, color: 'error.main' }}>
          <ErrorOutline sx={{ fontSize: 18, mt: '1px' }} />
          <Typography variant="caption" sx={{ lineHeight: 1.45 }}>{error}</Typography>
        </Box>
      )}

      {offers.length > 0 && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: '0.65rem' }}>
            Available offers
          </Typography>
          {offers.map((o) => (
            <Box key={o.code} sx={{
              display: 'flex', alignItems: 'center', gap: 1, mt: 0.75, p: 1,
              border: '1px dashed', borderColor: 'rgba(59,35,20,0.35)', borderRadius: 1.5, bgcolor: 'rgba(160,105,58,0.06)',
            }}>
              <LocalOfferOutlined sx={{ fontSize: 18, color: '#A0693A' }} />
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: 'monospace', letterSpacing: 0.5 }}>{o.code}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.35 }}>{o.summary}</Typography>
              </Box>
              <Button size="small" disabled={applying} onClick={() => onApply(o.code)}
                sx={{ textTransform: 'none', fontWeight: 700, color: '#3B2314', minWidth: 'auto' }}>
                Apply
              </Button>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
