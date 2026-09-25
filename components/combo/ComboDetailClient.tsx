'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Breadcrumbs, Button, Chip, Container, Divider, Grid, IconButton, Typography } from '@mui/material';
import { Add, Remove, NavigateNext, ShoppingBagOutlined, CheckCircleOutline } from '@mui/icons-material';
import ComboMedia from './ComboMedia';
import ComboCard, { comboBadge, comboStockMessage } from './ComboCard';
import { useCart } from '../../hooks/useCart';
import { useCombos } from './useCombos';
import { comboApi } from '../../services/api.service';
import { useCountry } from '../../contexts/CountryContext';
import { withCountry } from '../../lib/withCountry';
import { formatPrice } from '../../utils/format';
import type { Combo } from '../../types';
import { variantLabel } from '../../lib/variantLabel';

/** The combo page. SSR supplies `initial` (SEO); a live refetch keeps stock and price honest. */
export default function ComboDetailClient({ initial }: { initial: Combo }) {
  const { country } = useCountry();
  const { addComboToCart, isLoading } = useCart();
  const [combo, setCombo] = useState<Combo>(initial);
  const [qty, setQty] = useState(1);
  const sym = combo.currencySymbol;

  useEffect(() => {
    let live = true;
    comboApi.getBySlug(initial.slug, country)
      .then(({ data }) => { if (live && (data as any).data) setCombo((data as any).data); })
      .catch(() => {});
    return () => { live = false; };
  }, [initial.slug, country]);

  const max = Math.max(1, Math.min(combo.maxQuantity || 1, 10));
  const stockMsg = comboStockMessage(combo);
  const { combos: others } = useCombos({ limit: 4 });
  const more = others.filter((c) => c.id !== combo.id).slice(0, 3);

  return (
    <Box sx={{ pb: { xs: 6, md: 10 } }}>
      <Container maxWidth="xl" sx={{ pt: 3 }}>
        {/* position + zIndex: the sticky image column below would otherwise sit over this row and eat the clicks. */}
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3, fontSize: '0.8rem', position: 'relative', zIndex: 2 }}>
          <Link href={withCountry('/', country)} style={{ color: '#888', textDecoration: 'none' }}>Home</Link>
          <Link href={withCountry('/combos', country)} style={{ color: '#888', textDecoration: 'none' }}>Combo offers</Link>
          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>{combo.name}</Typography>
        </Breadcrumbs>

        <Grid container spacing={{ xs: 2, md: 6 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ position: { md: 'sticky' }, top: 88 }}>
              <Box sx={{ position: 'relative', aspectRatio: '4 / 3', borderRadius: 2, overflow: 'hidden', bgcolor: '#f3ece0' }}>
                <ComboMedia combo={combo} sizes="(max-width: 900px) 100vw, 50vw" priority />
                <Box sx={{ position: 'absolute', top: 14, left: 14, bgcolor: '#3B2314', color: '#fff', px: 1.5, py: 0.6, borderRadius: 1, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {comboBadge(combo)}
                </Box>
              </Box>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="overline" sx={{ color: '#A0693A', letterSpacing: '0.24em', fontWeight: 700, fontSize: '0.7rem' }}>Combo offer</Typography>
            <Typography component="h1" sx={{ fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontWeight: 600, fontSize: { xs: '2.3rem', md: '3.2rem' }, lineHeight: 1.05, color: '#3B2314', mb: 2 }}>
              {combo.name}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '2rem', color: '#3B2314' }}>{formatPrice(combo.price, sym)}</Typography>
              <Typography sx={{ textDecoration: 'line-through', color: '#8b7b6b', fontSize: '1.15rem' }}>{formatPrice(combo.separateTotal, sym)}</Typography>
              <Chip size="small" label={`Save ${formatPrice(combo.savings, sym)}${combo.savingsPercent ? ` (${combo.savingsPercent}%)` : ''}`} sx={{ bgcolor: '#e6f4ea', color: '#1b5e20', fontWeight: 700 }} />
            </Box>
            <Typography variant="caption" color="text.secondary">Inclusive of taxes. Bought separately these cost {formatPrice(combo.separateTotal, sym)}.</Typography>
            {combo.endsAt && (
              <Typography variant="body2" sx={{ mt: 1, color: '#A0693A', fontWeight: 600 }}>
                Offer ends {new Date(combo.endsAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Typography>
            )}

            {combo.description && (
              <Typography sx={{ mt: 2.5, color: '#4a3a2e', lineHeight: 1.75 }}>{combo.description}</Typography>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>What's in the set</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {combo.items.map((it) => (
                <Box key={`${it.productId}-${it.variantId ?? ''}`} component={Link} href={withCountry(`/product/${it.slug}`, country)}
                  sx={{ display: 'flex', gap: 1.5, alignItems: 'center', textDecoration: 'none', color: 'inherit', p: 1, border: '1px solid #EFE6D6', borderRadius: 1.5, '&:hover': { borderColor: '#A0693A' } }}>
                  <Box sx={{ position: 'relative', width: 64, height: 64, borderRadius: 1, overflow: 'hidden', bgcolor: '#f3ece0', flexShrink: 0 }}>
                    {it.image && <Image src={it.image} alt={it.name} fill sizes="64px" style={{ objectFit: 'cover' }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', lineHeight: 1.3 }}>{it.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {variantLabel(it)}{it.size || it.color ? ' · ' : ''}Qty {it.quantity}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#8b7b6b', whiteSpace: 'nowrap' }}>{formatPrice(it.unitPrice * it.quantity, sym)}</Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 3, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <IconButton aria-label="Fewer" size="small" disabled={qty <= 1} onClick={() => setQty((q) => Math.max(1, q - 1))}><Remove fontSize="small" /></IconButton>
                <Typography sx={{ px: 2, fontWeight: 700, minWidth: 36, textAlign: 'center' }}>{qty}</Typography>
                <IconButton aria-label="More" size="small" disabled={qty >= max || !combo.inStock} onClick={() => setQty((q) => Math.min(max, q + 1))}><Add fontSize="small" /></IconButton>
              </Box>
              <Button
                variant="contained" size="large" disabled={!combo.inStock || isLoading}
                startIcon={<ShoppingBagOutlined />} onClick={() => addComboToCart(combo.id, qty)}
                sx={{ bgcolor: '#3B2314', px: 4, py: 1.5, fontWeight: 700, letterSpacing: '0.08em', flex: { xs: 1, sm: 'none' }, '&:hover': { bgcolor: '#2A190E' } }}
              >
                {combo.inStock ? 'Add combo to bag' : 'Unavailable'}
              </Button>
            </Box>
            {stockMsg && <Typography variant="body2" sx={{ mt: 1.5, color: '#b3261e' }}>{stockMsg}</Typography>}
            {combo.inStock && combo.maxQuantity <= 3 && (
              <Typography variant="body2" sx={{ mt: 1.5, color: '#A0693A', fontWeight: 600 }}>Only {combo.maxQuantity} set{combo.maxQuantity === 1 ? '' : 's'} left</Typography>
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: '#FFFCF5', border: '1px solid #EFE6D6', borderRadius: 1.5, display: 'flex', gap: 1.25 }}>
              <CheckCircleOutline sx={{ color: '#A0693A', mt: 0.25 }} fontSize="small" />
              <Typography variant="body2" sx={{ color: '#5a4636', lineHeight: 1.6 }}>
                The set is sold together at this price. In your bag it stays one bundle: you can change how many sets you want or remove the whole set. To buy only some of the pieces, add them from their own pages.
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {more.length > 0 && (
          <Box sx={{ mt: { xs: 6, md: 9 } }}>
            <Typography sx={{ fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontWeight: 600, fontSize: { xs: '1.8rem', md: '2.3rem' }, color: '#3B2314', mb: 3 }}>More combos</Typography>
            <Grid container spacing={{ xs: 2, md: 3 }}>
              {more.map((c) => (<Grid key={c.id} item xs={12} sm={6} md={4}><ComboCard combo={c} /></Grid>))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}
