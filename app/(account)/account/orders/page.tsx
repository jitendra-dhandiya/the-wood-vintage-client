'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box, Typography, Card, CardContent, Chip, Button,
  Skeleton, Stack, Divider, Avatar,
} from '@mui/material';
import { orderApi } from '../../../../services/api.service';
import { formatPrice, formatDate } from '../../../../utils/format';
import { ORDER_STATUSES } from '../../../../constants';
import type { Order } from '../../../../types';

const statusColors: Record<string, any> = {
  PENDING: 'warning', CONFIRMED: 'info', PROCESSING: 'info',
  SHIPPED: 'primary', OUT_FOR_DELIVERY: 'primary', DELIVERED: 'success',
  CANCELLED: 'error', RETURNED: 'default', REFUNDED: 'default',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    orderApi.getMyOrders().then(({ data }) => {
      setOrders(data.data || []);
      setTotal(data.meta?.total || 0);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Box>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
          <CardContent>
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rectangular" height={60} sx={{ mt: 1, borderRadius: 1 }} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  if (!orders.length) return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 1 }}>
        No orders yet
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        When you place an order, it will appear here.
      </Typography>
      <Button variant="contained" component={Link} href="/shop" sx={{ bgcolor: '#1a1a1a' }}>
        Start Shopping
      </Button>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 3 }}>
        My Orders ({total})
      </Typography>

      <Stack spacing={2}>
        {orders.map((order) => (
          <Card key={order.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              {/* Header */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.25 }}>
                    Order #{order.orderNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Placed on {formatDate(order.createdAt)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Chip
                    label={ORDER_STATUSES[order.status]?.label || order.status}
                    color={statusColors[order.status] || 'default'}
                    size="small"
                    sx={{ fontWeight: 700, mb: 0.5, display: 'block' }}
                  />
                  <Typography variant="body2" fontWeight={700}>{formatPrice(order.total)}</Typography>
                </Box>
              </Box>

              {/* Items preview */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2 }}>
                {(order as any).items?.slice(0, 3).map((item: any) => (
                  <Box key={item.id} sx={{ textAlign: 'center' }}>
                    <Avatar
                      src={item.product?.images?.[0]?.url || item.image}
                      variant="rounded"
                      sx={{ width: 56, height: 70, mb: 0.5, bgcolor: '#f5f5f5' }}
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      ×{item.quantity}
                    </Typography>
                  </Box>
                ))}
                {(order as any)._count?.items > 3 && (
                  <Box sx={{ display: 'flex', alignItems: 'center', px: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      +{(order as any)._count.items - 3} more
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" component={Link} href={`/account/orders/${order.id}`}
                  variant="outlined" sx={{ borderColor: '#1a1a1a', color: '#1a1a1a', fontSize: '0.75rem' }}>
                  View Details
                </Button>
                {order.trackingNumber && (
                  <Button size="small" variant="outlined" sx={{ fontSize: '0.75rem' }}>
                    Track Package
                  </Button>
                )}
                {order.status === 'DELIVERED' && (
                  <Button size="small" sx={{ fontSize: '0.75rem' }}>
                    Write Review
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
