'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton, Switch, Tooltip, TextField, Table, TableBody,
  TableCell, TableHead, TableRow, Skeleton, InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search, ContentCopy } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { comboApi } from '../../../../services/api.service';
import { formatDate } from '../../../../utils/format';
import ComboFormDialog from '../../../../components/admin/ComboFormDialog';

const STATUS: Record<string, { label: string; color: 'success' | 'default' | 'error' | 'info' }> = {
  live: { label: 'Live', color: 'success' }, inactive: { label: 'Inactive', color: 'default' },
  ended: { label: 'Ended', color: 'error' }, scheduled: { label: 'Scheduled', color: 'info' },
};

export default function CombosPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    comboApi.adminList({ search: search || undefined })
      .then(({ data }) => setRows((data as any).data ?? []))
      .finally(() => setLoading(false));
  }, [search]);
  useEffect(() => { const t = setTimeout(load, search ? 400 : 0); return () => clearTimeout(t); }, [load, search]);

  const money = (n: number | null, s: string) => (n == null ? '-' : `${s}${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
  const fail = (e: any, fallback: string) => toast.error(e?.response?.data?.message || fallback);

  const toggle = async (c: any) => {
    try { await comboApi.setActive(c.id, !c.isActive); load(); } catch (e) { fail(e, 'Could not change status'); }
  };
  const duplicate = async (c: any) => {
    try { await comboApi.duplicate(c.id); toast.success('Duplicated (inactive, edit and activate it)'); load(); } catch (e) { fail(e, 'Duplicate failed'); }
  };
  const remove = async (c: any) => {
    if (!confirm(`Delete "${c.name}"?`)) return;
    try { await comboApi.delete(c.id); toast.success('Deleted'); load(); }
    catch (e: any) {
      if (e?.response?.status === 409 && confirm(`"${c.name}" has been ordered, so it can't be deleted. Deactivate it instead?`)) {
        try { await comboApi.setActive(c.id, false); load(); } catch (e2) { fail(e2, 'Could not deactivate'); }
      } else if (e?.response?.status !== 409) fail(e, 'Delete failed');
    }
  };

  const head = ['Combo', 'Items', 'Default market price', 'Markets', 'Sold', 'Valid', 'Status', 'Active', ''];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>Combo offers</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { setEditId(null); setFormOpen(true); }} sx={{ bgcolor: '#3B2314', '&:hover': { bgcolor: '#2a190e' } }}>
          Add combo
        </Button>
      </Box>
      <Box sx={{ mb: 2.5 }}>
        <TextField size="small" placeholder="Search combos..." sx={{ width: { xs: '100%', sm: 320 } }} value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
      </Box>
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>{head.map((h, i) => <TableCell key={i} sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase' }}>{h}</TableCell>)}</TableRow>
              </TableHead>
              <TableBody>
                {loading ? [...Array(4)].map((_, i) => <TableRow key={i}>{head.map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>)
                  : rows.length === 0 ? <TableRow><TableCell colSpan={head.length} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No combos yet</TableCell></TableRow>
                  : rows.map((c) => {
                    const st = STATUS[c.status] ?? STATUS.inactive;
                    const d = c.defaultMarket;
                    return (
                      <TableRow key={c.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center' }}>
                            <Box sx={{ width: 48, height: 36, borderRadius: 0.75, overflow: 'hidden', bgcolor: '#f3ece0', flexShrink: 0 }}>
                              {(c.image || c.items[0]?.image) && <img src={c.image || c.items[0].image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                              <Typography variant="caption" color="text.secondary">/{c.slug}{c.showOnHome ? ' · on homepage' : ''}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', maxWidth: 240 }}>{c.items.map((i: any) => `${i.quantity > 1 ? `${i.quantity}× ` : ''}${i.name}`).join(', ')}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {d.price != null ? (<>
                            <strong>{money(d.price, d.currencySymbol)}</strong> <span style={{ color: '#888', textDecoration: 'line-through' }}>{money(d.separateTotal, d.currencySymbol)}</span>
                            <Typography variant="caption" sx={{ display: 'block', color: '#2e7d32', fontWeight: 700 }}>save {money(d.savings, d.currencySymbol)} ({d.savingsPercent}%)</Typography>
                          </>) : <Typography variant="caption" sx={{ color: '#b3261e' }}>{d.error}</Typography>}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{c.markets}</TableCell>
                        <TableCell sx={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}><strong>{c.unitsSold}</strong> sets<Typography variant="caption" color="text.secondary" display="block">{money(c.revenue, d.currencySymbol)}</Typography></TableCell>
                        <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
                          {c.startsAt && <div>From {formatDate(c.startsAt)}</div>}
                          <div>{c.endsAt ? `Until ${formatDate(c.endsAt)}` : 'No end'}</div>
                        </TableCell>
                        <TableCell><Chip label={st.label} size="small" color={st.color} sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20 }} /></TableCell>
                        <TableCell><Switch size="small" checked={c.isActive} onChange={() => toggle(c)} inputProps={{ 'aria-label': `Toggle ${c.name}` }} /></TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditId(c.id); setFormOpen(true); }}><Edit fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Duplicate"><IconButton size="small" onClick={() => duplicate(c)}><ContentCopy fontSize="small" /></IconButton></Tooltip>
                          <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => remove(c)}><Delete fontSize="small" /></IconButton></Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
      <ComboFormDialog open={formOpen} comboId={editId} onClose={() => setFormOpen(false)} onSaved={load} />
    </Box>
  );
}
