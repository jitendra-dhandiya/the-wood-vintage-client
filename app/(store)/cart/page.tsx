'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Box, Container, Grid, Typography, Button, IconButton,
  TextField, Divider, Stack, Card, CardContent, Chip,
} from '@mui/material';
import { Add, Remove, DeleteOutline, ShoppingBag } from '@mui/icons-material';
import { useCart } from '../../../hooks/useCart';
import { cartApi } from '../../../services/api.service';
import { formatPrice } from '../../../utils/format';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_CHARGE } from '../../../constants';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { cart, subtotal, updateQuantity, removeFromCart, fetchCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [freeShipping, setFreeShipping] = useState(false);

  const baseShipping = subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_CHARGE : 0;
  const shippingCharge = freeShipping ? 0 : baseShipping;
  const total = subtotal - couponDiscount + shippingCharge;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await cartApi.applyCoupon(couponCode, subtotal);
      const d = (data as any).data;
      const amount = Number(d.discountAmount) || 0;
      setCouponDiscount(amount);
      setFreeShipping(Boolean(d.freeShipping));
      setAppliedCoupon(couponCode.trim().toUpperCase());
      // A free-delivery coupon takes nothing off the goods, so reporting the
      // discount would announce a saving of zero on a coupon that works.
      toast.success(
        d.freeShipping
          ? 'Free delivery applied'
          : `Coupon applied! You save ${formatPrice(amount)}`,
      );
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  if (!cart?.items.length) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: 'center' }}>
        <ShoppingBag sx={{ fontSize: 80, color: '#e0e0e0', mb: 3 }} />
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 1 }}>
          Your bag is empty
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Looks like you haven't added anything to your bag yet
        </Typography>
        <Button variant="contained" component={Link} href="/shop" sx={{ bgcolor: '#1a1a1a', py: 1.5, px: 5 }}>
          Start Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, pb: { xs: 10, md: 6 } }}>
      <Typography variant="h4" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 4 }}>
        Shopping Bag ({cart.items.length} item{cart.items.length !== 1 ? 's' : ''})
      </Typography>

      <Grid container spacing={4}>
        {/* Items */}
        <Grid item xs={12} md={8}>
          <Stack spacing={2}>
            {cart.items.map((item) => (
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
                          <Typography component={Link} href={`/product/${item.product?.slug}`}
                            sx={{ fontWeight: 700, textDecoration: 'none', color: 'inherit', '&:hover': { color: '#c9a84c' } }}>
                            {item.product?.name}
                          </Typography>
                          {item.variant && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {[item.variant.size, item.variant.color].filter(Boolean).join(' / ')}
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
                          <Typography fontWeight={700}>{formatPrice(item.price * item.quantity)}</Typography>
                          {item.quantity > 1 && (
                            <Typography variant="caption" color="text.secondary">{formatPrice(item.price)} each</Typography>
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
                {appliedCoupon ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label={`${appliedCoupon} applied`} color="success" size="small" onDelete={() => { setAppliedCoupon(''); setCouponDiscount(0); setFreeShipping(false); setCouponCode(''); }} />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      placeholder="Enter code"
                      size="small"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      sx={{ flex: 1 }}
                    />
                    <Button variant="outlined" onClick={applyCoupon} disabled={couponLoading} sx={{ borderColor: '#1a1a1a', color: '#1a1a1a', px: 2 }}>
                      Apply
                    </Button>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />

              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography fontWeight={500}>{formatPrice(subtotal)}</Typography>
                </Box>
                {couponDiscount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="success.main">Coupon Discount</Typography>
                    <Typography fontWeight={500} color="success.main">-{formatPrice(couponDiscount)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Shipping</Typography>
                  <Typography fontWeight={500} sx={{ color: shippingCharge === 0 ? 'success.main' : 'inherit' }}>
                    {shippingCharge === 0 ? 'FREE' : formatPrice(shippingCharge)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography fontWeight={800} variant="h6">Total</Typography>
                  <Typography fontWeight={800} variant="h6">{formatPrice(total)}</Typography>
                </Box>
              </Stack>

              <Button
                fullWidth variant="contained" size="large"
                component={Link}
                href={`/checkout?coupon=${encodeURIComponent(appliedCoupon || '')}&discount=${couponDiscount}`}
                sx={{ bgcolor: '#1a1a1a', py: 1.75, letterSpacing: '0.1em', fontWeight: 700 }}
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
