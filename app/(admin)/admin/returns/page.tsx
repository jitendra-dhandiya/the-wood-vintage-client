'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Button, TextField, MenuItem, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, Dialog, DialogTitle,
  DialogContent, DialogActions, Stack, Skeleton, Alert, IconButton,
  InputAdornment, Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Replay } from '@mui/icons-material';
import { returnApi, orderApi } from '../../../../services/api.service';
import { formatDate, formatPrice } from '../../../../utils/format';
import toast from 'react-hot-toast';

const STATUSES = ['REQUESTED', 'APPROVED', 'REJECTED', 'PICKED_UP', 'REFUNDED'] as const;
const STATUS_COLOR: Record<string, { bg: string; fg: string }> = {
  REQUESTED: { bg: '#fff8e1', fg: '#8a6d00' },
  APPROVED:  { bg: '#e3f2fd', fg: '#0d47a1' },
  REJECTED:  { bg: '#fdecea', fg: '#b71c1c' },
  PICKED_UP: { bg: '#ede7f6', fg: '#4527a0' },
  REFUNDED:  { bg: '#e8f5e9', fg: '#1b5e20' },
};

const BLANK = { orderId: '', reason: '', description: '', status: 'REQUESTED', adminNote: '', refundAmount: '' };

export default function AdminReturnsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('ALL');
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await returnApi.getAll(filter === 'ALL' ? {} : { status: filter });
      setRows(((data as any).data || []) as any[]);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Could not load returns');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  // Only fetched when recording a new one — the picker needs somewhere to
  // choose from, and the list screen does not.
  const openCreate = async () => {
    setEditingId(null);
    setForm({ ...BLANK });
    setDialog(true);
    if (!orders.length) {
      try {
        const { data } = await orderApi.getAll({ limit: 100 });
        setOrders(((data as any).data || []) as any[]);
      } catch { /* the picker just stays empty */ }
    }
  };

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({
      orderId: r.orderId,
      reason: r.reason || '',
      description: r.description || '',
      status: r.status,
      adminNote: r.adminNote || '',
      refundAmount: r.refundAmount != null ? String(r.refundAmount) : '',
    });
    setDialog(true);
  };

  const save = async () => {
    if (!editingId && !form.orderId) { toast.error('Choose the order this return is for'); return; }
    if (!form.reason.trim()) { toast.error('Give a reason'); return; }

    setSaving(true);
    try {
      if (editingId) {
        await returnApi.update(editingId, {
          reason: form.reason.trim(),
          description: form.description.trim() || null,
          status: form.status,
          adminNote: form.adminNote.trim() || null,
          refundAmount: form.refundAmount === '' ? null : Number(form.refundAmount),
        });
        toast.success('Return updated');
      } else {
        await returnApi.create({
          orderId: form.orderId,
          reason: form.reason.trim(),
          description: form.description.trim() || null,
          refundAmount: form.refundAmount === '' ? null : Number(form.refundAmount),
        });
        toast.success('Return recorded');
      }
      setDialog(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await returnApi.remove(id);
      setRows(prev => prev.filter(r => r.id !== id));
      toast.success('Return deleted');
    } catch {
      toast.error('Could not delete');
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5, flexWrap: 'wrap' }}>
        <Replay />
        <Typography variant="h5" fontWeight={800}>Returns</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <TextField
          select size="small" value={filter} onChange={e => setFilter(e.target.value)}
          sx={{ minWidth: 170 }} label="Status"
        >
          <MenuItem value="ALL">All</MenuItem>
          {STATUSES.map(s => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
        </TextField>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
          Record a return
        </Button>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>
        Customers raise returns on Instagram, per the policy. Record them here so they can follow the progress from their account.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}
          action={<Button size="small" startIcon={<Refresh />} onClick={load}>Retry</Button>}>{error}</Alert>
      )}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        {loading ? (
          <CardContent><Skeleton height={44} /><Skeleton height={44} /><Skeleton height={44} /></CardContent>
        ) : rows.length === 0 ? (
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Replay sx={{ fontSize: 48, color: '#e0e0e0', mb: 1.5 }} />
            <Typography fontWeight={700} sx={{ mb: 0.5 }}>No returns recorded</Typography>
            <Typography variant="body2" color="text.secondary">
              When a customer messages on Instagram, record it here.
            </Typography>
          </CardContent>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 800, whiteSpace: 'nowrap' } }}>
                  <TableCell>Order</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Credit</TableCell>
                  <TableCell>Raised</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(r => {
                  const c = STATUS_COLOR[r.status] ?? STATUS_COLOR.REQUESTED;
                  const u = r.order?.user;
                  return (
                    <TableRow key={r.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="body2" fontWeight={700}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => r.order && router.push(`/admin/orders/${r.order.id}`)}>
                          {r.order?.orderNumber || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{u ? `${u.firstName} ${u.lastName}` : '—'}</Typography>
                        <Typography variant="caption" color="text.secondary">{u?.email}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 240 }}>
                        <Typography variant="body2" noWrap title={r.reason}>{r.reason}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={r.status.replace('_', ' ')}
                          sx={{ fontWeight: 700, bgcolor: c.bg, color: c.fg }} />
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {r.refundAmount != null ? formatPrice(Number(r.refundAmount)) : '—'}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <Typography variant="caption">{formatDate(r.createdAt)}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(r)}><Edit fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton size="small" onClick={() => remove(r.id)} sx={{ color: '#d32f2f' }}><Delete fontSize="small" /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <Dialog open={dialog} onClose={() => setDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {editingId ? 'Update return' : 'Record a return'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {!editingId && (
            <TextField
              select size="small" fullWidth label="Order" value={form.orderId}
              onChange={e => setForm(f => ({ ...f, orderId: e.target.value }))}
              helperText={orders.length ? 'Which order is this about?' : 'Loading orders…'}
            >
              {orders.map(o => (
                <MenuItem key={o.id} value={o.id}>
                  {o.orderNumber} — {o.user ? `${o.user.firstName} ${o.user.lastName}` : 'customer'}
                </MenuItem>
              ))}
            </TextField>
          )}

          <TextField size="small" fullWidth required label="Reason" value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            placeholder="e.g. Wrong size sent, damaged on arrival" />

          <TextField size="small" fullWidth multiline rows={2} label="Details" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What the customer told us on Instagram" />

          {editingId && (
            <TextField select size="small" fullWidth label="Status" value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {STATUSES.map(s => <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>)}
            </TextField>
          )}

          <TextField size="small" fullWidth type="number" label="Store credit" value={form.refundAmount}
            onChange={e => setForm(f => ({ ...f, refundAmount: e.target.value }))}
            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
            helperText="The policy issues store credit, not a bank refund" />

          {editingId && (
            <TextField size="small" fullWidth multiline rows={2} label="Note to the customer"
              value={form.adminNote}
              onChange={e => setForm(f => ({ ...f, adminNote: e.target.value }))}
              helperText="Shown on their Returns page" />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving}
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Record return'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
