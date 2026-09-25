'use client';
import { useEffect, useLayoutEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Box, Container, Grid, Typography, Button, IconButton,
  TextField, Divider, Stack, Card, CardContent, Chip,
} from '@mui/material';
import { Add, Remove, DeleteOutline, ShoppingBag } from '@mui/icons-material';
import { useCart } from '../../../../hooks/useCart';
import { useCoupon, useCouponOffers } from '../../../../hooks/useCoupon';
import CouponBox from '../../../../components/cart/CouponBox';
import CartComboLine from '../../../../components/combo/CartComboLine';
import { formatPrice } from '../../../../utils/format';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_CHARGE } from '../../../../constants';
import { useCountry } from '../../../../contexts/CountryContext';
import { withCountry } from '../../../../lib/withCountry';
import toast from 'react-hot-toast';
import EmptyState from '../../../../components/common/EmptyState';
import { CartSkeleton } from '../../../../components/common/Skeletons';
import { variantLabel } from '../../../../lib/variantLabel';

export default function CartPage() {
  const { cart, subtotal, updateQuantity, removeFromCart, fetchCart } = useCart();
  const { currencySymbol, country } = useCountry();
  // Coupon: code kept client-side, every figure from the server (decision 0035).
  const coupon = useCoupon('STANDARD');
  const offers = useCouponOffers();
  const couponDiscount = coupon.discount;
  const freeShipping = coupon.freeShipping;

  // Until the first fetch settles, `cart` is null and the page would flash
  // "Your bag is empty" at someone whose bag is not.
  // `mounted` keeps the first client render identical to the server's (the
  // store may already hold the cart by the time this page hydrates).
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  useLayoutEffect(() => setMounted(true), []);
  useEffect(() => {
    if (cart) { setReady(true); return; }
    fetchCart().finally(() => setReady(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // With a coupon on, the server's preview is the source of truth for every
  // line (same engine as the order); without one, the local estimate as before.
  const p = coupon.preview;
  const baseShipping = subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_CHARGE : 0;
  const shippingCharge = p ? p.shippingCharge : freeShipping ? 0 : baseShipping;
  const shownSubtotal = p ? p.subtotal : subtotal;
  const total = p ? p.total : subtotal - couponDiscount + shippingCharge;

  if (!mounted || (!cart && !ready)) return <CartSkeleton />;

  const combos = cart?.combos ?? [];
  const lineCount = (cart?.items.length ?? 0) + combos.length;
  const comboProblem = combos.find((c) => c.problem);

  if (!lineCount) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, md: 8 } }}>
        <EmptyState
          icon={<ShoppingBag />}
          title="Your bag is empty"
          body="Looks like you haven't added anything to your bag yet. Handcrafted pieces are waiting."
          actionLabel="Start Shopping"
          actionHref={withCountry('/shop', country)}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, pb: { xs: 10, md: 6 } }}>
      <Typography variant="h4" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 4 }}>
        Shopping Bag ({lineCount} item{lineCount !== 1 ? 's' : ''})
      </Typography>

      <Grid container spacing={4}>
        {/* Items */}
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            {combos.map((line) => (
              <Card key={line.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: '#FFFCF5' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <CartComboLine line={line} />
                </CardContent>
              </Card>
            ))}
            {cart!.items.map((item) => (
              <Card key={item.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ position: 'relative', width: 100, height: 130, flexShrink: 0, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'hidden' }}>
                      {/* Fixed 100x130 box — sizes must be explicit, or
                          next/image defaults to 100vw and over-fetches. */}
                      {item.product?.images?.[0]?.url && (
                        <Image src={item.product.images[0].url} alt={item.product.name} fill style={{ objectFit: 'cover' }} sizes="100px" />
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                          <Typography component={Link} href={withCountry(`/product/${item.product?.slug}`, country)}
                            sx={{ fontWeight: 700, textDecoration: 'none', color: 'inherit', '&:hover': { color: '#A0693A' } }}>
                            {item.product?.name}
                          </Typography>
                          {item.variant && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {variantLabel(item.variant)}
                            </Typography>
                          )}
                          {item.product?.brand && (
                            <Typography variant="caption" color="text.secondary">by {item.product.brand}</Typography>
                          )}
                        </Box>
                        <IconButton size="small" onClick={() => removeFromCart(item.id)} sx={{ color: '#999', ml: 1 }}>
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }}>
                          <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity - 1)} sx={{ p: 0.5 }}>
                            <Remove fontSize="inherit" />
                          </IconButton>
                          <Typography sx={{ px: 2, fontSize: '0.9rem', fontWeight: 700, minWidth: 32, textAlign: 'center' }}>
                            {item.quantity}
                          </Typography>
                          <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)} sx={{ p: 0.5 }}>
                            <Add fontSize="inherit" />
                          </IconButton>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography fontWeight={700}>{formatPrice(item.price * item.quantity, currencySymbol)}</Typography>
                          {item.quantity > 1 && (
                            <Typography variant="caption" color="text.secondary">{formatPrice(item.price, currencySymbol)} each</Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Grid>

        {/* Summary */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, position: 'sticky', top: 88 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>Order Summary</Typography>

              {/* Coupon */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>Have a coupon?</Typography>
                <CouponBox
                  code={coupon.code} preview={coupon.preview} applying={coupon.applying}
                  checking={coupon.checking} error={coupon.error} appliedTick={coupon.appliedTick}
                  offers={offers} onApply={coupon.apply} onRemove={coupon.remove}
                  onInputChange={coupon.clearError} currencySymbol={currencySymbol}
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography fontWeight={500}>{formatPrice(shownSubtotal, currencySymbol)}</Typography>
                </Box>
                {couponDiscount > 0 && (
                  <Box key={coupon.appliedTick} className={coupon.appliedTick ? 'coupon-flash' : undefined} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="success.main">Coupon ({coupon.code})</Typography>
                    <Typography fontWeight={500} color="success.main">-{formatPrice(couponDiscount, currencySymbol)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Shipping</Typography>
                  <Typography fontWeight={500} sx={{ color: shippingCharge === 0 ? 'success.main' : 'inherit' }}>
                    {shippingCharge === 0 ? 'FREE' : formatPrice(shippingCharge, currencySymbol)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography fontWeight={800} variant="h6">Total</Typography>
                  <Typography fontWeight={800} variant="h6">{formatPrice(total, currencySymbol)}</Typography>
                </Box>
              </Stack>

              {comboProblem && (
                <Typography variant="caption" sx={{ display: 'block', color: '#b3261e', mb: 1, textAlign: 'center' }}>
                  {comboProblem.combo.name}: {comboProblem.problem}. Fix it to check out.
                </Typography>
              )}
              <Button
                fullWidth variant="contained" size="large"
                component={comboProblem ? 'button' : Link}
                disabled={!!comboProblem}
                href={comboProblem ? undefined : withCountry('/checkout', country)}
                sx={{ bgcolor: '#3B2314', py: 1.75, letterSpacing: '0.1em', fontWeight: 700 }}
              >
                Proceed to Checkout
              </Button>

              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}>
                Taxes calculated at checkout
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
