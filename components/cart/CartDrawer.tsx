'use client';
import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Drawer, Box, Typography, IconButton, Button, Divider,
  Stack, Badge, CircularProgress,
} from '@mui/material';
import { Close, Add, Remove, DeleteOutline, ShoppingBag } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../store';
import { closeCart } from '../../store/slices/cartSlice';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../utils/format';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_CHARGE } from '../../constants';

export default function CartDrawer() {
  const dispatch = useAppDispatch();
  const { isOpen } = useAppSelector((s) => s.cart);
  const { cart, subtotal, isLoading, updateQuantity, removeFromCart } = useCart();

  const shippingCharge = subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_CHARGE : 0;
  const total = subtotal + shippingCharge;

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={() => dispatch(closeCart())}
      PaperProps={{ sx: { width: { xs: '100vw', sm: 420 }, display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '0.05em' }}>
          Shopping Bag
          {cart?.items.length ? (
            <Typography component="span" sx={{ ml: 1, fontSize: '0.85rem', color: 'text.secondary', fontWeight: 400 }}>
              ({cart.items.length} item{cart.items.length !== 1 ? 's' : ''})
            </Typography>
          ) : null}
        </Typography>
        <IconButton onClick={() => dispatch(closeCart())}>
          <Close />
        </IconButton>
      </Box>

      {/* Items */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
            <CircularProgress size={32} sx={{ color: '#1a1a1a' }} />
          </Box>
        ) : !cart?.items.length ? (
          <Box sx={{ textAlign: 'center', pt: 8 }}>
            <ShoppingBag sx={{ fontSize: 64, color: '#e0e0e0', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>Your bag is empty</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Add items to get started
            </Typography>
            <Button
              variant="contained"
              component={Link}
              href="/shop"
              onClick={() => dispatch(closeCart())}
              sx={{ bgcolor: '#1a1a1a' }}
            >
              Continue Shopping
            </Button>
          </Box>
        ) : (
          <Stack spacing={2}>
            {cart.items.map((item) => (
              <Box key={item.id} sx={{ display: 'flex', gap: 2, pb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                {/* Product image */}
                <Box sx={{ position: 'relative', width: 80, height: 107, flexShrink: 0, bgcolor: '#f5f5f5', borderRadius: 1, overflow: 'hidden' }}>
                  {item.product?.images?.[0]?.url && (
                    <Image
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      // Fixed 80x107 box. Without sizes, next/image assumes
                      // 100vw and fetches a ~1920w image for an 80px thumbnail.
                      sizes="80px"
                    />
                  )}
                </Box>

                {/* Details */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.3 }} noWrap>
                    {item.product?.name}
                  </Typography>
                  {item.variant && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                      {[item.variant.size, item.variant.color].filter(Boolean).join(' / ')}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
                    {formatPrice(item.price)}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                    {/* Quantity */}
                    <Box sx={{ display: 'flex', alignItems: 'center', border: '1px solid', borderColor: 'divider', borderRadius: 0.5 }}>
                      <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity - 1)} sx={{ p: 0.25 }}>
                        <Remove fontSize="inherit" />
                      </IconButton>
                      <Typography sx={{ px: 1.5, fontSize: '0.85rem', fontWeight: 600 }}>{item.quantity}</Typography>
                      <IconButton size="small" onClick={() => updateQuantity(item.id, item.quantity + 1)} sx={{ p: 0.25 }}>
                        <Add fontSize="inherit" />
                      </IconButton>
                    </Box>
                    <IconButton size="small" onClick={() => removeFromCart(item.id)} sx={{ color: '#999' }}>
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Footer */}
      {cart?.items.length ? (
        <Box sx={{ p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          {/* Shipping message */}
          {shippingCharge > 0 && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fafafa', borderRadius: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Add {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} more for FREE shipping
              </Typography>
            </Box>
          )}

          <Stack spacing={0.75} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2" fontWeight={500}>{formatPrice(subtotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Shipping</Typography>
              <Typography variant="body2" fontWeight={500} sx={{ color: shippingCharge === 0 ? 'success.main' : 'inherit' }}>
                {shippingCharge === 0 ? 'FREE' : formatPrice(shippingCharge)}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography fontWeight={700}>Total</Typography>
              <Typography fontWeight={700} sx={{ fontSize: '1.1rem' }}>{formatPrice(total)}</Typography>
            </Box>
          </Stack>

          <Button
            fullWidth
            variant="contained"
            component={Link}
            href="/checkout"
            onClick={() => dispatch(closeCart())}
            sx={{ bgcolor: '#1a1a1a', py: 1.5, fontSize: '0.8rem', letterSpacing: '0.1em' }}
          >
            Proceed to Checkout
          </Button>
          <Button
            fullWidth
            variant="outlined"
            component={Link}
            href="/cart"
            onClick={() => dispatch(closeCart())}
            sx={{ mt: 1, py: 1.25, fontSize: '0.75rem', letterSpacing: '0.08em' }}
          >
            View Cart
          </Button>
        </Box>
      ) : null}
    </Drawer>
  );
}
