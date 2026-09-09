'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  FormControlLabel, Table, TableBody, TableCell, TableHead, TableRow, Skeleton,
  TablePagination, InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { couponApi } from '../../../../services/api.service';
import { formatDate, formatPrice } from '../../../../utils/format';

const PAGE_SIZE = 20;
const COUPON_TYPES = ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'];

const schema = Yup.object({
  code: Yup.string().required('Code required'),
  type: Yup.string().required('Type required'),
  value: Yup.number().positive('Must be positive').required('Value required'),
  minOrderAmount: Yup.number().min(0).nullable(),
  usageLimit: Yup.number().min(0).nullable(),
  expiresAt: Yup.date().nullable(),
});

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState<any>(null);

  const fetchCoupons = useCallback(() => {
    setLoading(true);
    couponApi.getAll({ page: page + 1, limit: PAGE_SIZE, search: search || undefined })
      .then(({ data }) => {
        const d = data as any;
        setCoupons(d.data || []);
        setTotal(d.meta?.total || 0);
      }).finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchCoupons, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchCoupons, search]);

  const formik = useFormik({
    initialValues: {
      code: '', type: 'PERCENTAGE', value: '',
      minOrderAmount: '', usageLimit: '', expiresAt: '',
      isActive: true, description: '',
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload = {
          ...values,
          code: values.code.toUpperCase(),
          value: Number(values.value),
          minOrderAmount: values.minOrderAmount ? Number(values.minOrderAmount) : null,
          usageLimit: values.usageLimit ? Number(values.usageLimit) : null,
          expiresAt: values.expiresAt || null,
        };
        if (editCoupon) {
          await couponApi.update(editCoupon.id, payload);
          toast.success('Coupon updated');
        } else {
          await couponApi.create(payload);
          toast.success('Coupon created');
        }
        closeDialog();
        fetchCoupons();
      } catch {
        toast.error('Save failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const openCreate = () => { setEditCoupon(null); formik.resetForm(); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setEditCoupon(c);
    formik.setValues({
      code: c.code, type: c.type, value: c.value,
      minOrderAmount: c.minOrderAmount || '', usageLimit: c.usageLimit || '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      isActive: c.isActive ?? true, description: c.description || '',
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditCoupon(null); formik.resetForm(); };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    try {
      await couponApi.delete(id);
      toast.success('Deleted');
      fetchCoupons();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>Coupons</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
          Add Coupon
        </Button>
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <TextField size="small" placeholder="Search by code..." sx={{ width: 280 }}
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Code', 'Discount', 'Min Order', 'Uses', 'Expires', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? [...Array(8)].map((_, i) => (
                <TableRow key={i}>{[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
              )) : coupons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>No coupons found</TableCell>
                </TableRow>
              ) : coupons.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
                      {c.code}
                    </Typography>
                    {c.description && <Typography variant="caption" color="text.secondary">{c.description}</Typography>}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>
                    {c.type === 'PERCENTAGE' ? `${c.value}%` : c.type === 'FREE_SHIPPING' ? 'Free Shipping' : formatPrice(c.value)}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{c.minOrderAmount ? formatPrice(c.minOrderAmount) : '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{c.usageCount || 0}{c.usageLimit ? `/${c.usageLimit}` : ''}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{c.expiresAt ? formatDate(c.expiresAt) : '—'}</TableCell>
                  <TableCell>
                    <Chip label={c.isActive ? 'Active' : 'Inactive'} size="small"
                      color={c.isActive ? 'success' : 'default'}
                      sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20 }} />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div" count={total} page={page} rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
            onPageChange={(_, p) => setPage(p)}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editCoupon ? 'Edit Coupon' : 'Add Coupon'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField label="Code" size="small" fullWidth required
              inputProps={{ style: { textTransform: 'uppercase' } }}
              {...formik.getFieldProps('code')}
              error={formik.touched.code && !!formik.errors.code}
              helperText={formik.touched.code && formik.errors.code} />
            <TextField label="Description" size="small" fullWidth {...formik.getFieldProps('description')} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField select label="Type" size="small" sx={{ flex: 1 }} {...formik.getFieldProps('type')}>
                {COUPON_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
              <TextField label="Value" type="number" size="small" sx={{ flex: 1 }}
                {...formik.getFieldProps('value')}
                error={formik.touched.value && !!formik.errors.value}
                helperText={formik.touched.value && formik.errors.value} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Min Order (₹)" type="number" size="small" sx={{ flex: 1 }}
                {...formik.getFieldProps('minOrderAmount')} />
              <TextField label="Usage Limit" type="number" size="small" sx={{ flex: 1 }}
                {...formik.getFieldProps('usageLimit')} />
            </Box>
            <TextField label="Expires At" type="date" size="small" fullWidth
              InputLabelProps={{ shrink: true }} {...formik.getFieldProps('expiresAt')} />
            <FormControlLabel
              control={<Switch checked={formik.values.isActive}
                onChange={e => formik.setFieldValue('isActive', e.target.checked)} />}
              label="Active"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting}
              sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
              {editCoupon ? 'Save' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
