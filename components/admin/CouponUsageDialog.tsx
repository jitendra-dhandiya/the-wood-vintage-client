'use client';
import { useEffect, useState } from 'react';
import {
  Box, Chip, CircularProgress, Dialog, DialogContent, DialogTitle, IconButton, Table, TableBody, TableCell,
  TableHead, TablePagination, TableRow, Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import Link from 'next/link';
import { couponApi } from '../../services/api.service';

const SYMBOL: Record<string, string> = { INR: '₹', USD: '$', AED: 'د.إ', AUD: 'A$', GBP: '£', EUR: '€' };
const money = (n: number | string, cur: string) => {
  const v = Number(n);
  return `${SYMBOL[cur] ?? cur + ' '}${v.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 })}`;
};

/** Who used a coupon, when, on which order, and what it saved them. */
export default function CouponUsageDialog({ coupon, onClose }: { coupon: { id: string; code: string } | null; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const PAGE = 10;

  useEffect(() => { setPage(0); setData(null); }, [coupon?.id]);
  useEffect(() => {
    if (!coupon) return;
    setLoading(true);
    couponApi.usages(coupon.id, { page: page + 1, limit: PAGE })
      .then(({ data }) => setData((data as any).data)).finally(() => setLoading(false));
  }, [coupon, page]);

  return (
    <Dialog open={!!coupon} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography component="span" sx={{ fontWeight: 700 }}>Usage report</Typography>
        <Typography component="span" sx={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: 1, color: '#A0693A' }}>{coupon?.code}</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton size="small" onClick={onClose} aria-label="Close"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {data?.summary && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip label={`${data.summary.redemptions} redemption${data.summary.redemptions === 1 ? '' : 's'} counting`} color="success" variant="outlined" />
            <Chip label={`${data.summary.reverted} reverted`} variant="outlined" />
            {data.summary.saved.map((s: any) => <Chip key={s.currency} label={`Customers saved ${money(s.amount, s.currency)}`} variant="outlined" />)}
          </Box>
        )}
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>{['When', 'Customer', 'Order', 'Saved', 'Status'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase' }}>{h}</TableCell>))}</TableRow>
            </TableHead>
            <TableBody>
              {loading && !data ? (
                <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={22} /></TableCell></TableRow>
              ) : !data?.items?.length ? (
                <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>This coupon hasn’t been used yet.</TableCell></TableRow>
              ) : data.items.map((u: any) => (
                <TableRow key={u.id} hover>
                  <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{new Date(u.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {u.user.firstName} {u.user.lastName}
                    <Typography variant="caption" color="text.secondary" display="block">{u.user.email}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    <Link href={`/admin/orders/${u.order.id}`} style={{ color: '#A0693A', fontWeight: 700 }}>{u.order.orderNumber}</Link>
                    <Typography variant="caption" color="text.secondary" display="block">{u.order.status} · {money(u.order.total, u.currency)}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{money(u.amount, u.currency)}</TableCell>
                  <TableCell>
                    {u.revertedAt
                      ? <Chip size="small" label="Reverted" title={u.revertReason ?? ''} sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                      : <Chip size="small" color="success" label="Applied" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
        <TablePagination component="div" count={data?.total ?? 0} page={page} rowsPerPage={PAGE} rowsPerPageOptions={[PAGE]} onPageChange={(_, p) => setPage(p)} />
      </DialogContent>
    </Dialog>
  );
}
