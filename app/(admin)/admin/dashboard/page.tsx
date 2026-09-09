'use client';
import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Skeleton,
  Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Avatar,
} from '@mui/material';
import { TrendingUp, ShoppingCart, People, Inventory2 } from '@mui/icons-material';
import { analyticsApi } from '../../../../services/api.service';
import { formatPrice, formatDate } from '../../../../utils/format';

const StatCard = ({ title, value, icon, color, loading }: any) => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
    <CardContent sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {title}
          </Typography>
          {loading ? <Skeleton width={100} height={40} /> : (
            <Typography variant="h4" sx={{ fontWeight: 800, mt: 0.5, fontFamily: 'var(--font-playfair)' }}>
              {value}
            </Typography>
          )}
        </Box>
        <Box sx={{ bgcolor: `${color}15`, p: 1.5, borderRadius: 2, color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const ORDER_STATUS_COLORS: Record<string, any> = {
  PENDING: 'warning', CONFIRMED: 'info', DELIVERED: 'success', CANCELLED: 'error',
};

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.getDashboard().then(({ data: res }) => {
      setData(res.data);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 3 }}>
        Dashboard
      </Typography>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Revenue"
            value={loading ? '' : formatPrice(data?.revenue?.total || 0)}
            icon={<TrendingUp />} color="#2e7d32" loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Orders"
            value={loading ? '' : data?.orders?.total || 0}
            icon={<ShoppingCart />} color="#1565c0" loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Customers"
            value={loading ? '' : data?.customers || 0}
            icon={<People />} color="#7b1fa2" loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Products"
            value={loading ? '' : data?.products || 0}
            icon={<Inventory2 />} color="#c9a84c" loading={loading}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent orders */}
        <Grid item xs={12} lg={7}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Recent Orders</Typography>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>ORDER</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>CUSTOMER</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>STATUS</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }} align="right">AMOUNT</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data?.recentOrders?.slice(0, 7).map((order: any) => (
                      <TableRow key={order.id} hover>
                        <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>#{order.orderNumber}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>
                          {order.user?.firstName} {order.user?.lastName}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            size="small"
                            color={ORDER_STATUS_COLORS[order.status] || 'default'}
                            sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20 }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          {formatPrice(order.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top products */}
        <Grid item xs={12} lg={5}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Top Products</Typography>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />)
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {data?.topProducts?.slice(0, 6).map((product: any, i: number) => (
                    <Box key={product.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#888', minWidth: 18 }}>
                        {i + 1}
                      </Typography>
                      <Avatar
                        src={product.images?.[0]?.url}
                        variant="rounded"
                        sx={{ width: 40, height: 48, bgcolor: '#f5f5f5' }}
                      />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{product.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.totalSold} sold
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>{formatPrice(product.salePrice || product.basePrice)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
