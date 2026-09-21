'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton, Switch, Tooltip,
  TextField, Table, TableBody, TableCell, TableHead, TableRow, Skeleton,
  TablePagination, InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search, BarChart } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { couponApi, countryApi } from '../../../../services/api.service';
import { formatDate } from '../../../../utils/format';
import type { Country } from '../../../../types';
import CouponFormDialog from '../../../../components/admin/CouponFormDialog';
import CouponUsageDialog from '../../../../components/admin/CouponUsageDialog';

const PAGE_SIZE = 20;

const statusOf = (c: any): { label: string; color: 'success' | 'default' | 'warning' | 'error' | 'info' } => {
  const now = Date.now();
  if (!c.isActive) return { label: 'Inactive', color: 'default' };
  if (c.expiresAt && new Date(c.expiresAt).getTime() < now) return { label: 'Expired', color: 'error' };
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: 'Scheduled', color: 'info' };
  if (c.usageLimit != null && c.usageCount >= c.usageLimit) return { label: 'Used up', color: 'warning' };
  return { label: 'Live', color: 'success' };
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [usageFor, setUsageFor] = useState<{ id: string; code: string } | null>(null);

  const def = countries.find((c) => c.isDefault);
  const sym = def?.currencySymbol ?? '₹';
  const money = (n: number | string, s = sym) => {
    const v = Number(n);
    return `${s}${v.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(v) ? 0 : 2, maximumFractionDigits: 2 })}`;
  };

  const fetchCoupons = useCallback(() => {
    setLoading(true);
    couponApi.getAll({ page: page + 1, limit: PAGE_SIZE, search: search || undefined })
      .then(({ data }) => { const d = data as any; setCoupons(d.data || []); setTotal(d.meta?.total || 0); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { countryApi.getAllAdmin().then(({ data }) => setCountries((data as any).data ?? [])).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(fetchCoupons, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchCoupons, search]);

  const discountText = (c: any) => {
    const base = c.type === 'PERCENTAGE' ? `${Number(c.value)}%${c.maxDiscount ? ` (max ${money(c.maxDiscount)})` : ''}`
      : c.type === 'FREE_SHIPPING' ? 'Free shipping' : money(c.value);
    const extra = Object.entries<any>(c.countryTerms ?? {}).map(([code, t]) => {
      const cs = countries.find((x) => x.code === code)?.currencySymbol ?? '';
      return `${code} ${c.type === 'PERCENTAGE' ? `${t.value}%` : c.type === 'FREE_SHIPPING' ? 'free' : money(t.value, cs)}`;
    });
    return { base, extra };
  };

  const toggle = async (c: any) => {
    try {
      await couponApi.setActive(c.id, !c.isActive);
      setCoupons((rows) => rows.map((r) => (r.id === c.id ? { ...r, isActive: !c.isActive } : r)));
    } catch { toast.error('Could not change status'); }
  };

  const handleDelete = async (c: any) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    try { await couponApi.delete(c.id); toast.success('Deleted'); fetchCoupons(); }
    catch (e: any) { toast.error(e?.response?.data?.message || 'Delete failed'); }
  };

  const head = ['Code', 'Discount', 'Rules', 'Uses', 'Valid', 'Status', 'Active', ''];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>Coupons</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditId(null); setFormOpen(true); }}
          sx={{ bgcolor: '#3B2314', '&:hover': { bgcolor: '#2a190e' } }}>
          Add coupon
        </Button>
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <TextField size="small" placeholder="Search by code or description..." sx={{ width: { xs: '100%', sm: 320 } }}
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {head.map((h, i) => (
                    <TableCell key={i} sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? [...Array(6)].map((_, i) => (
                  <TableRow key={i}>{head.map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
                )) : coupons.length === 0 ? (
                  <TableRow><TableCell colSpan={head.length} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No coupons found</TableCell></TableRow>
                ) : coupons.map((c) => {
                  const st = statusOf(c);
                  const d = discountText(c);
                  const scope = Array.isArray(c.countryCodes) && c.countryCodes.length ? c.countryCodes.join(', ') : 'All markets';
                  return (
                    <TableRow key={c.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>{c.code}</Typography>
                        {c.description && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 240 }}>{c.description}</Typography>}
                        {c.isPublic && <Chip label="Public offer" size="small" variant="outlined" sx={{ mt: 0.5, height: 18, fontSize: '0.6rem' }} />}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem' }}>
                        {d.base}
                        {d.extra.length > 0 && <Typography variant="caption" color="text.secondary" display="block">{d.extra.join(' · ')}</Typography>}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                        <div>{scope}</div>
                        {c.minOrderAmount != null && <div>Min {money(c.minOrderAmount)}</div>}
                        {c.firstOrderOnly && <div>First order only</div>}
                        {c.excludeSaleItems && <div>Excludes sale items</div>}
                        {(c.categoryIds?.length || c.productIds?.length) ? <div>Limited to {[c.categoryIds?.length ? `${c.categoryIds.length} categor${c.categoryIds.length > 1 ? 'ies' : 'y'}` : '', c.productIds?.length ? `${c.productIds.length} product${c.productIds.length > 1 ? 's' : ''}` : ''].filter(Boolean).join(' + ')}</div> : null}
                        <div>{c.userLimit == null ? 'Unlimited per customer' : `${c.userLimit} per customer`}</div>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        <strong>{c.usageCount || 0}</strong>{c.usageLimit != null ? ` / ${c.usageLimit}` : ''}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                        {c.startsAt && <div>From {formatDate(c.startsAt)}</div>}
                        <div>{c.expiresAt ? `Until ${formatDate(c.expiresAt)}` : 'No expiry'}</div>
                      </TableCell>
                      <TableCell><Chip label={st.label} size="small" color={st.color} sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20 }} /></TableCell>
                      <TableCell><Switch size="small" checked={c.isActive} onChange={() => toggle(c)} inputProps={{ 'aria-label': `Toggle ${c.code}` }} /></TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Usage report"><IconButton size="small" onClick={() => setUsageFor({ id: c.id, code: c.code })}><BarChart fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditId(c.id); setFormOpen(true); }}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(c)}><Delete fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
          <TablePagination component="div" count={total} page={page} rowsPerPage={PAGE_SIZE} rowsPerPageOptions={[PAGE_SIZE]} onPageChange={(_, p) => setPage(p)} />
        </CardContent>
      </Card>

      <CouponFormDialog open={formOpen} couponId={editId} onClose={() => setFormOpen(false)} onSaved={fetchCoupons} />
      <CouponUsageDialog coupon={usageFor} onClose={() => setUsageFor(null)} />
    </Box>
  );
}
