'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button,
  Avatar, Divider, Skeleton, Stack, IconButton,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import Link from 'next/link';
import { orderApi } from '../../../../../services/api.service';
import { formatDate, formatPrice } from '../../../../../utils/format';
import { ORDER_STATUSES } from '../../../../../constants';
import { toast } from 'react-hot-toast';
import { orderAddress } from '@/lib/orderAddress';

const STATUS_COLORS: Record<string, any> = {
  PENDING: 'warning', CONFIRMED: 'info', PROCESSING: 'info',
  SHIPPED: 'primary', OUT_FOR_DELIVERY: 'primary', DELIVERED: 'success',
  CANCELLED: 'error', RETURNED: 'default', REFUNDED: 'default',
};

const STATUS_STEPS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    orderApi.getById(id)
      .then(({ data }) => setOrder(data.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Cancel this order?')) return;
    setCancelling(true);
    try {
      await orderApi.cancelOrder(id);
      setOrder((o: any) => ({ ...o, status: 'CANCELLED' }));
      toast.success('Order cancelled');
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Cancel failed');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return (
    <Box>
      <Skeleton height={40} width={200} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
    </Box>
  );

  if (!order) return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h5">Order not found</Typography>
      <Button component={Link} href="/account/orders" sx={{ mt: 2 }}>Back to Orders</Button>
    </Box>
  );

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancellable = ['PENDING', 'CONFIRMED'].includes(order.status);
  const addr = orderAddress(order);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton size="small" onClick={() => router.push('/account/orders')}><ArrowBack /></IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight={700}>Order #{order.orderNumber}</Typography>
          <Typography variant="caption" color="text.secondary">{formatDate(order.createdAt)}</Typography>
        </Box>
        <Chip label={(ORDER_STATUSES as Record<string, { label: string }>)[order.status]?.label || order.status}
          color={STATUS_COLORS[order.status] || 'default'} sx={{ fontWeight: 700 }} />
      </Box>

      {/* Order progress */}
      {currentStep >= 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2.5 }}>Order Progress</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {STATUS_STEPS.map((step, i) => (
                <Box key={step} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                  {i > 0 && (
                    <Box sx={{
                      position: 'absolute', top: 12, right: '50%', left: '-50%',
                      height: 2, bgcolor: i <= currentStep ? '#1a1a1a' : '#eee',
                    }} />
                  )}
                  <Box sx={{
                    width: 24, height: 24, borderRadius: '50%', zIndex: 1,
                    bgcolor: i <= currentStep ? '#1a1a1a' : '#eee',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    mb: 0.75,
                  }}>
                    {i <= currentStep && (
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#fff' }} />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', textAlign: 'center', color: i <= currentStep ? 'text.primary' : 'text.disabled' }}>
                    {step.replace(/_/g, ' ')}
                  </Typography>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2.5}>
        {/* Items */}
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2.5 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Items Ordered</Typography>
              <Stack spacing={2}>
                {order.items?.map((item: any) => (
                  <Box key={item.id} sx={{ display: 'flex', gap: 2 }}>
                    <Avatar src={item.product?.images?.[0]?.url || item.image} variant="rounded"
                      sx={{ width: 60, height: 75, bgcolor: '#f5f5f5' }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600}>{item.name || item.product?.name}</Typography>
                      {(() => {
                        // Snapshotted on the line at checkout; the variant is a
                        // fallback for orders placed before that was recorded.
                        const parts = [item.size || item.variant?.size, item.color || item.variant?.color]
                          .filter(Boolean);
                        return parts.length ? (
                          <Typography variant="caption" color="text.secondary">{parts.join(' · ')}</Typography>
                        ) : null;
                      })()}
                      <Typography variant="caption" color="text.secondary" display="block">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700}>{formatPrice(item.price * item.quantity)}</Typography>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />
              <Stack spacing={0.75}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body2">{formatPrice(order.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Shipping</Typography>
                  <Typography variant="body2">{order.shippingCost === 0 ? 'Free' : formatPrice(order.shippingCost)}</Typography>
                </Box>
                {order.discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Discount</Typography>
                    <Typography variant="body2" color="success.main">-{formatPrice(order.discount)}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={800}>Total</Typography>
                  <Typography variant="body2" fontWeight={800}>{formatPrice(order.total)}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {isCancellable && (
            <Button variant="outlined" color="error" onClick={handleCancel} disabled={cancelling} size="small">
              {cancelling ? 'Cancelling...' : 'Cancel Order'}
            </Button>
          )}
        </Grid>

        {/* Shipping & Payment */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Delivery Address</Typography>
              {addr && (
                <Box>
                  <Typography variant="body2" fontWeight={600}>{addr.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{addr.line1}</Typography>
                  {addr.line2 && (
                    <Typography variant="body2" color="text.secondary">{addr.line2}</Typography>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    {addr.city}, {addr.state} — {addr.pincode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{addr.phone}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Payment</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">Method</Typography>
                <Typography variant="caption" fontWeight={600}>{order.paymentMethod}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="caption" color="text.secondary">Status</Typography>
                <Chip label={order.paymentStatus} size="small"
                  color={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                  sx={{ height: 18, fontSize: '0.6rem' }} />
              </Box>
            </CardContent>
          </Card>

          {order.trackingNumber && (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: '#c9a84c', borderRadius: 2, bgcolor: '#fffbf0' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
                  Tracking Number
                </Typography>
                <Typography variant="body2" fontWeight={700} fontFamily="monospace">{order.trackingNumber}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
