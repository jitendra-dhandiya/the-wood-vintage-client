'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid, Tabs, Tab, TextField, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, Skeleton, Alert,
  Button, Stack, Divider,
} from '@mui/material';
import { Refresh, Download, ReceiptLong, ShoppingCart } from '@mui/icons-material';
import { analyticsApi, orderApi } from '../../../../services/api.service';
import { formatPrice, formatDate } from '../../../../utils/format';

const METHODS = ['ALL', 'CASHFREE', 'RAZORPAY', 'COD'];

const KIND_LABEL: Record<string, { label: string; bg: string; fg: string; note: string }> = {
  ONLINE:      { label: 'Online',      bg: '#e8f5e9', fg: '#1b5e20', note: 'Full order paid through the gateway' },
  COD_DEPOSIT: { label: 'COD deposit', bg: '#fff8e1', fg: '#8a6d00', note: 'Only the delivery charge — goods still owed in cash' },
  COD_CASH:    { label: 'Cash',        bg: '#ede7f6', fg: '#4527a0', note: 'Collected at the door on a self-delivered order' },
};

/** Default range: this month to date. */
function thisMonth() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(first), end: iso(now) };
}

function Stat({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
      <CardContent sx={{ p: 2.25 }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: '.04em' }}>
          {label}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5, color: accent || 'text.primary' }}>
          {value}
        </Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const { start, end } = useMemo(thisMonth, []);
  const [startDate, setStartDate] = useState(start);
  const [endDate, setEndDate] = useState(end);
  const [method, setMethod] = useState('ALL');

  const [tx, setTx] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { startDate, endDate };
      if (method !== 'ALL') params.method = method;
      const [t, o] = await Promise.all([
        analyticsApi.getTransactions(params),
        orderApi.getAll({ limit: 200, startDate, endDate }).catch(() => ({ data: { data: [] } })),
      ]);
      setTx((t.data as any).data);
      setOrders(((o.data as any).data || []) as any[]);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not load the report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, method]);

  useEffect(() => { load(); }, [load]);

  const s = tx?.summary;

  /** Client-side CSV so the numbers on screen are the numbers exported. */
  const exportCsv = () => {
    const rows = tx?.rows || [];
    const head = ['Collected at', 'Type', 'Order', 'Customer', 'Method', 'Reference', 'Amount', 'Refunded'];
    const body = rows.map((r: any) => [
      new Date(r.collectedAt).toISOString(),
      KIND_LABEL[r.kind]?.label ?? r.kind,
      r.orderNumber ?? '',
      r.customer?.name ?? '',
      r.method,
      r.reference ?? '',
      r.amount,
      r.refundAmount,
    ]);
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [head, ...body].map(r => r.map(esc).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const orderStats = useMemo(() => {
    const total = orders.length;
    const value = orders.reduce((t, o) => t + Number(o.total || 0), 0);
    const byStatus: Record<string, number> = {};
    for (const o of orders) byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    return { total, value, byStatus };
  }, [orders]);

  return (
    <Box>
      <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>Reports</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>
        Orders placed, and money actually collected. They are different numbers.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2.5 }}>
        <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }}
          value={startDate} onChange={e => setStartDate(e.target.value)} />
        <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }}
          value={endDate} onChange={e => setEndDate(e.target.value)} />
        <TextField select size="small" label="Method" value={method}
          onChange={e => setMethod(e.target.value)} sx={{ minWidth: 150 }}>
          {METHODS.map(m => <MenuItem key={m} value={m}>{m === 'ALL' ? 'All methods' : m}</MenuItem>)}
        </TextField>
        <Button startIcon={<Refresh />} onClick={load} sx={{ textTransform: 'none' }}>Refresh</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<ShoppingCart sx={{ fontSize: 17 }} />} iconPosition="start" label="Orders" sx={{ textTransform: 'none', fontWeight: 700 }} />
        <Tab icon={<ReceiptLong sx={{ fontSize: 17 }} />} iconPosition="start" label="Transactions" sx={{ textTransform: 'none', fontWeight: 700 }} />
      </Tabs>

      {loading ? (
        <Grid container spacing={2}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rectangular" height={104} sx={{ borderRadius: 2 }} /></Grid>
          ))}
          <Grid item xs={12}><Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} /></Grid>
        </Grid>
      ) : tab === 0 ? (
        /* ── Orders ─────────────────────────────────────────── */
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Stat label="ORDERS PLACED" value={String(orderStats.total)} hint="In the selected range" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stat label="ORDER VALUE" value={formatPrice(orderStats.value)} hint="Invoiced, not necessarily collected" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stat label="DELIVERED" value={String(orderStats.byStatus.DELIVERED || 0)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stat label="CANCELLED" value={String(orderStats.byStatus.CANCELLED || 0)} accent="#b71c1c" />
            </Grid>
          </Grid>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>By status</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(orderStats.byStatus).length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No orders in this range.</Typography>
                ) : Object.entries(orderStats.byStatus).map(([k, v]) => (
                  <Chip key={k} label={`${k.replace(/_/g, ' ')} · ${v}`} sx={{ fontWeight: 700 }} />
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Button size="small" onClick={() => router.push('/admin/orders')} sx={{ textTransform: 'none', fontWeight: 700 }}>
                Open the full orders list →
              </Button>
            </CardContent>
          </Card>
        </Box>
      ) : (
        /* ── Transactions ───────────────────────────────────── */
        <Box>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Stat label="NET COLLECTED" value={formatPrice(s?.netCollected || 0)}
                hint="Actually in hand, after refunds" accent="#1b5e20" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stat label="ONLINE" value={formatPrice(s?.online || 0)} hint="Full orders paid by gateway" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stat label="COD DEPOSITS" value={formatPrice(s?.deposits || 0)} hint="Delivery charge only" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Stat label="CASH AT DOOR" value={formatPrice(s?.cash || 0)} hint="Self-delivered orders" />
            </Grid>
          </Grid>

          {(s?.refunded || 0) > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {formatPrice(s.refunded)} refunded in this period, already deducted from net collected.
            </Alert>
          )}

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Stack direction="row" alignItems="center" sx={{ p: 2, pb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={800}>
                Successful transactions ({s?.count || 0})
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <Button size="small" startIcon={<Download sx={{ fontSize: 16 }} />} onClick={exportCsv}
                disabled={!tx?.rows?.length} sx={{ textTransform: 'none', fontWeight: 700 }}>
                Export CSV
              </Button>
            </Stack>

            {!tx?.rows?.length ? (
              <CardContent sx={{ textAlign: 'center', py: 7 }}>
                <ReceiptLong sx={{ fontSize: 48, color: '#e0e0e0', mb: 1.5 }} />
                <Typography fontWeight={700} sx={{ mb: 0.5 }}>No collections in this range</Typography>
                <Typography variant="body2" color="text.secondary">
                  Only settled payments appear here — nothing pending or failed.
                </Typography>
              </CardContent>
            ) : (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 800, whiteSpace: 'nowrap' } }}>
                      <TableCell>Collected</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Order</TableCell>
                      <TableCell>Customer</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>Reference</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tx.rows.map((r: any) => {
                      const k = KIND_LABEL[r.kind] ?? KIND_LABEL.ONLINE;
                      return (
                        <TableRow key={r.id} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="caption">{formatDate(r.collectedAt)}</Typography>
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={k.label} title={k.note}
                              sx={{ fontWeight: 700, bgcolor: k.bg, color: k.fg }} />
                          </TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2" fontWeight={700} sx={{ cursor: r.orderId ? 'pointer' : 'default' }}
                              onClick={() => r.orderId && router.push(`/admin/orders/${r.orderId}`)}>
                              {r.orderNumber || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{r.customer?.name || '—'}</Typography>
                            <Typography variant="caption" color="text.secondary">{r.customer?.email}</Typography>
                          </TableCell>
                          <TableCell><Typography variant="caption">{r.method}</Typography></TableCell>
                          <TableCell sx={{ maxWidth: 190 }}>
                            <Typography variant="caption" color="text.secondary" noWrap title={r.reference || ''}>
                              {r.reference || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <Typography variant="body2" fontWeight={800}>{formatPrice(r.amount)}</Typography>
                            {r.refundAmount > 0 && (
                              <Typography variant="caption" color="error">−{formatPrice(r.refundAmount)}</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Card>
        </Box>
      )}
    </Box>
  );
}
