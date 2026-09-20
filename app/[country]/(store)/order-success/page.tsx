'use client';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { CheckCircle, LocalShipping, Replay } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCountry } from '../../../../contexts/CountryContext';
import { withCountry } from '../../../../lib/withCountry';
import { trackEvent } from '../../../../lib/analytics';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const { country } = useCountry();

  // Phase 7 (Analytics) ORDER_PLACED -- where the checkout flow actually
  // lands after a successful order (COD/Cashfree `router.push` here on
  // confirmed payment; Razorpay's handler pushes here too). Only fires when
  // a real order number is present, and only once, guarding against a
  // dev-mode double-invoke or a re-render re-running the effect.
  const tracked = useRef(false);
  useEffect(() => {
    if (!orderNumber || tracked.current) return;
    tracked.current = true;
    trackEvent('ORDER_PLACED');
  }, [orderNumber]);

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', duration: 0.6 }}>
        <CheckCircle sx={{ fontSize: 80, color: '#2e7d32', mb: 3 }} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Typography variant="h3" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 1.5 }}>
          Order Placed!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          Thank you for shopping with us.
        </Typography>
        {orderNumber && (
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#3B2314', mb: 4 }}>
            Order Number: <span style={{ color: '#A0693A' }}>{orderNumber}</span>
          </Typography>
        )}

        <Box sx={{ bgcolor: '#F6EEDF', borderRadius: 2, p: 3, mb: 4, textAlign: 'left' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>What happens next?</Typography>
          {[
            { icon: <CheckCircle sx={{ color: '#2e7d32', fontSize: 20 }} />, text: 'Order confirmed & being processed' },
            { icon: <LocalShipping sx={{ color: '#1976d2', fontSize: 20 }} />, text: 'Shipped within 1-3 business days' },
            { icon: <Replay sx={{ color: '#A0693A', fontSize: 20 }} />, text: 'Track your order in My Account' },
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5, alignItems: 'center' }}>
              {item.icon}
              <Typography variant="body2">{item.text}</Typography>
            </Box>
          ))}
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          {orderNumber && (
            <Button component={Link} href="/account/orders" variant="contained" sx={{ bgcolor: '#3B2314', py: 1.5, px: 4 }}>
              Track Order
            </Button>
          )}
          <Button component={Link} href={withCountry('/shop', country)} variant="outlined" sx={{ borderColor: '#3B2314', py: 1.5, px: 4 }}>
            Continue Shopping
          </Button>
        </Stack>
      </motion.div>
    </Container>
  );
}
