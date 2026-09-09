'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box, Typography, Card, CardContent, Button, Skeleton, Alert, Chip,
  Stack, Divider,
} from '@mui/material';
import {
  Replay, Refresh, Instagram, Videocam, AccessTime, OpenInNew,
} from '@mui/icons-material';
import { returnApi, orderApi } from '../../../../services/api.service';
import { formatDate, formatPrice } from '../../../../utils/format';

const INSTAGRAM_HANDLE = '@uniquedressup.inn';
const INSTAGRAM_URL = 'https://www.instagram.com/uniquedressup.inn';
/** The published policy's window, measured from delivery. */
const RETURN_WINDOW_HOURS = 36;

interface ReturnRequest {
  id: string;
  reason: string;
  description?: string | null;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'PICKED_UP' | 'REFUNDED';
  adminNote?: string | null;
  refundAmount?: number | string | null;
  createdAt: string;
  order?: { id: string; orderNumber: string; total: number | string } | null;
}

const STATUS_STYLE: Record<string, { label: string; bg: string; fg: string }> = {
  REQUESTED: { label: 'Requested',   bg: '#fff8e1', fg: '#8a6d00' },
  APPROVED:  { label: 'Approved',    bg: '#e3f2fd', fg: '#0d47a1' },
  REJECTED:  { label: 'Not approved', bg: '#fdecea', fg: '#b71c1c' },
  PICKED_UP: { label: 'Picked up',   bg: '#ede7f6', fg: '#4527a0' },
  REFUNDED:  { label: 'Store credit issued', bg: '#e8f5e9', fg: '#1b5e20' },
};

/** Hours left in the window, or null when the order has no delivery date yet. */
function hoursLeft(deliveryDate?: string | null): number | null {
  if (!deliveryDate) return null;
  const deadline = new Date(deliveryDate).getTime() + RETURN_WINDOW_HOURS * 3600_000;
  return (deadline - Date.now()) / 3600_000;
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, o] = await Promise.all([
        returnApi.getMyReturns(),
        // Used only to show which deliveries are still inside the window.
        orderApi.getMyOrders(1, 20).catch(() => ({ data: { data: [] } })),
      ]);
      setReturns(((r.data as any).data || []) as ReturnRequest[]);
      setOrders(((o.data as any).data || []) as any[]);
    } catch (e: any) {
      setError(
        e?.response?.status === 401
          ? 'Please sign in to see your returns.'
          : 'We could not load your returns just now.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const eligible = orders
    .filter(o => o.status === 'DELIVERED')
    .map(o => ({ ...o, left: hoursLeft(o.deliveryDate) }))
    .filter(o => o.left !== null && o.left > 0);

  const HowTo = (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1.5 }}>
          <Instagram sx={{ color: '#c9a84c' }} />
          <Typography variant="subtitle1" fontWeight={800}>
            How to raise a return or exchange
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Returns are handled personally over Instagram — message us at{' '}
          <Box component="a" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"
            sx={{ fontWeight: 700, color: 'text.primary' }}>
            {INSTAGRAM_HANDLE}
          </Box>{' '}
          and we will take it from there.
        </Typography>

        <Stack spacing={1.25} sx={{ mb: 2.5 }}>
          {[
            { icon: <AccessTime sx={{ fontSize: 18 }} />, text: `Message us within ${RETURN_WINDOW_HOURS} hours of delivery.` },
            { icon: <Videocam sx={{ fontSize: 18 }} />, text: 'Include your unedited unboxing video — it is required for every claim.' },
            { icon: <Replay sx={{ fontSize: 18 }} />, text: 'Share your order number and a photo of the issue.' },
          ].map((s, i) => (
            <Stack key={i} direction="row" spacing={1.25} alignItems="flex-start">
              <Box sx={{ color: 'text.secondary', mt: '2px' }}>{s.icon}</Box>
              <Typography variant="body2" color="text.secondary">{s.text}</Typography>
            </Stack>
          ))}
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="contained" component="a" href={INSTAGRAM_URL}
            target="_blank" rel="noopener noreferrer"
            startIcon={<Instagram />} endIcon={<OpenInNew sx={{ fontSize: 15 }} />}
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}
          >
            Message us on Instagram
          </Button>
          <Button variant="outlined" component={Link} href="/return-policy" sx={{ borderColor: 'divider', color: 'text.primary' }}>
            Read the full policy
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, mb: 3 }}>
          Returns & Exchanges
        </Typography>
        <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2, mb: 3 }} />
        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, mb: 3 }}>
        Returns & Exchanges
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}
          action={<Button size="small" startIcon={<Refresh />} onClick={load}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {HowTo}

      {/* Deliveries still inside the window — the thing a customer actually
          needs to know before deciding whether it is worth messaging. */}
      {eligible.length > 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>
              Still within the {RETURN_WINDOW_HOURS}-hour window
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              After this passes we can no longer accept a claim on the order.
            </Typography>
            <Stack spacing={1.25}>
              {eligible.map(o => (
                <Stack key={o.id} direction="row" alignItems="center" spacing={1.5}
                  sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
                  <Typography variant="body2" fontWeight={700}
                    component={Link} href={`/account/orders/${o.id}`}
                    sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                    {o.orderNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    delivered {formatDate(o.deliveryDate)}
                  </Typography>
                  <Box sx={{ flexGrow: 1 }} />
                  <Chip size="small" label={`${Math.ceil(o.left)}h left`}
                    sx={{ fontWeight: 700, bgcolor: o.left < 12 ? '#fdecea' : '#fff8e1',
                          color: o.left < 12 ? '#b71c1c' : '#8a6d00' }} />
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1.5 }}>
        Your requests
      </Typography>

      {returns.length === 0 ? (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: { xs: 5, md: 7 } }}>
            <Replay sx={{ fontSize: 48, color: '#e0e0e0', mb: 1.5 }} />
            <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>
              No returns yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
              Once you message us on Instagram, we will record it here so you can follow its progress.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          {returns.map((r, i) => {
            const s = STATUS_STYLE[r.status] ?? STATUS_STYLE.REQUESTED;
            return (
              <Box key={r.id}>
                {i > 0 && <Divider />}
                <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1, flexWrap: 'wrap', rowGap: 0.5 }}>
                    {r.order && (
                      <Typography variant="subtitle2" fontWeight={800}
                        component={Link} href={`/account/orders/${r.order.id}`}
                        sx={{ color: 'text.primary', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                        {r.order.orderNumber}
                      </Typography>
                    )}
                    <Chip size="small" label={s.label} sx={{ fontWeight: 700, bgcolor: s.bg, color: s.fg }} />
                    <Box sx={{ flexGrow: 1 }} />
                    <Typography variant="caption" color="text.disabled">
                      {formatDate(r.createdAt)}
                    </Typography>
                  </Stack>

                  <Typography variant="body2" sx={{ mb: r.description ? 0.5 : 0 }}>
                    <strong>Reason:</strong> {r.reason}
                  </Typography>
                  {r.description && (
                    <Typography variant="body2" color="text.secondary">{r.description}</Typography>
                  )}

                  {r.refundAmount != null && (
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 700, color: '#1b5e20' }}>
                      Store credit: {formatPrice(Number(r.refundAmount))}
                    </Typography>
                  )}

                  {r.adminNote && (
                    <Alert severity="info" sx={{ mt: 1.5, py: 0.25 }}>{r.adminNote}</Alert>
                  )}
                </Box>
              </Box>
            );
          })}
        </Card>
      )}
    </Box>
  );
}
