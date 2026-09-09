'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box, Typography, Paper, Stepper, Step, StepLabel, StepContent,
  Chip, CircularProgress, Alert, Divider, Grid, useTheme, useMediaQuery,
} from '@mui/material';
import {
  LocalShipping, CheckCircle, Inventory, LocationOn, AccessTime,
} from '@mui/icons-material';
import { shippingApi } from '../../../../services/api.service';

interface TrackingEvent {
  status: string;
  location: string | null;
  remark: string | null;
  eventTime: string;
}

interface TrackingData {
  waybill: string;
  status: string;
  estimatedDelivery: string | null;
  trackingEvents: TrackingEvent[];
  order: {
    orderNumber: string;
    total: number;
    items: { name: string; quantity: number; image: string | null }[];
  } | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CREATED:           { label: 'Shipment Created',     color: '#2196f3', icon: <Inventory /> },
  DISPATCHED:        { label: 'Dispatched',           color: '#ff9800', icon: <LocalShipping /> },
  'IN TRANSIT':      { label: 'In Transit',           color: '#2196f3', icon: <LocalShipping /> },
  'OUT FOR DELIVERY':{ label: 'Out for Delivery',     color: '#ff9800', icon: <LocalShipping /> },
  DELIVERED:         { label: 'Delivered',            color: '#4caf50', icon: <CheckCircle /> },
  RTO:               { label: 'Return to Origin',     color: '#f44336', icon: <LocalShipping /> },
  CANCELLED:         { label: 'Cancelled',            color: '#9e9e9e', icon: <LocalShipping /> },
};

export default function TrackingPage() {
  const params    = useParams<{ waybill: string }>();
  const waybill   = params?.waybill || '';
  const theme     = useTheme();
  const isMobile  = useMediaQuery(theme.breakpoints.down('sm'));

  const [data, setData]       = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!waybill) return;
    shippingApi.getTracking(waybill)
      .then((res: any) => setData(res.data.data))
      .catch(() => setError('Shipment not found. Please check your waybill number.'))
      .finally(() => setLoading(false));
  }, [waybill]);

  const statusCfg = data ? (STATUS_CONFIG[data.status] || { label: data.status, color: '#9e9e9e', icon: <LocalShipping /> }) : null;

  return (
    <Box sx={{ minHeight: '60vh', py: { xs: 3, md: 6 }, px: 2, maxWidth: 800, mx: 'auto' }}>
      {/* Title */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight={700} gutterBottom>
          Track Your Order
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Waybill: <strong style={{ fontFamily: 'monospace' }}>{waybill}</strong>
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ textAlign: 'center' }}>{error}</Alert>
      )}

      {data && statusCfg && (
        <Box>
          {/* Status Card */}
          <Paper
            sx={{
              p: 3, mb: 3, borderRadius: 3,
              background: `linear-gradient(135deg, ${statusCfg.color}15, ${statusCfg.color}05)`,
              border: `1px solid ${statusCfg.color}30`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box
                sx={{
                  width: 56, height: 56, borderRadius: '50%',
                  bgcolor: statusCfg.color, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: '#fff',
                  flexShrink: 0,
                }}
              >
                {statusCfg.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={700}>{statusCfg.label}</Typography>
                {data.estimatedDelivery && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <AccessTime fontSize="small" color="action" />
                    <Typography variant="body2" color="text.secondary">
                      Expected by{' '}
                      {new Date(data.estimatedDelivery).toLocaleDateString('en-IN', {
                        weekday: 'long', day: 'numeric', month: 'long',
                      })}
                    </Typography>
                  </Box>
                )}
              </Box>
              {data.order && (
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">Order</Typography>
                  <Typography variant="body2" fontWeight={600}>{data.order.orderNumber}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    ₹{Number(data.order.total).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Ordered Items (top 5) */}
          {data.order?.items?.length ? (
            <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>Items in this shipment</Typography>
              <Divider sx={{ mb: 1.5 }} />
              {data.order.items.map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 0.75 }}>
                  {item.image && (
                    <Box
                      component="img"
                      src={item.image}
                      alt={item.name}
                      sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'cover', flexShrink: 0 }}
                    />
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary">Qty: {item.quantity}</Typography>
                  </Box>
                </Box>
              ))}
            </Paper>
          ) : null}

          {/* Tracking Timeline */}
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Tracking History
            </Typography>
            <Divider sx={{ mb: 2 }} />

            {data.trackingEvents.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No tracking events yet. Check back later.
              </Typography>
            ) : (
              <Box sx={{ position: 'relative', pl: 3 }}>
                {/* Vertical line */}
                <Box sx={{
                  position: 'absolute', left: 8, top: 12, bottom: 12,
                  width: 2, bgcolor: 'divider',
                }} />

                {data.trackingEvents.map((ev, i) => (
                  <Box key={i} sx={{ mb: 2.5, position: 'relative' }}>
                    {/* Dot */}
                    <Box sx={{
                      position: 'absolute', left: -23, top: 4,
                      width: 10, height: 10, borderRadius: '50%',
                      bgcolor: i === 0 ? statusCfg.color : 'grey.400',
                      border: '2px solid white',
                      boxShadow: '0 0 0 1px currentColor',
                    }} />

                    <Box sx={{ pl: 1 }}>
                      <Typography variant="body2" fontWeight={i === 0 ? 700 : 400}>
                        {ev.status}
                      </Typography>
                      {ev.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                          <LocationOn sx={{ fontSize: 14, color: 'text.disabled' }} />
                          <Typography variant="caption" color="text.secondary">{ev.location}</Typography>
                        </Box>
                      )}
                      {ev.remark && ev.remark !== ev.status && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }}>
                          {ev.remark}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.disabled">
                        {new Date(ev.eventTime).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Box>
      )}
    </Box>
  );
}
