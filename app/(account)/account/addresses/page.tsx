'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  FormControlLabel, Checkbox, Skeleton, Stack,
} from '@mui/material';
import { Add, Edit, Delete, Home } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { userApi } from '../../../../services/api.service';
import { toast } from 'react-hot-toast';

const schema = Yup.object({
  fullName: Yup.string().required('Full name required'),
  phone: Yup.string().required('Phone required'),
  addressLine1: Yup.string().required('Address required'),
  city: Yup.string().required('City required'),
  state: Yup.string().required('State required'),
  pincode: Yup.string().required('Pincode required').matches(/^\d{6}$/, 'Enter valid 6-digit pincode'),
});

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editAddress, setEditAddress] = useState<any>(null);

  const fetchAddresses = useCallback(() => {
    setLoading(true);
    userApi.getAddresses().then(({ data }) => setAddresses(data.data || [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAddresses(); }, [fetchAddresses]);

  const formik = useFormik({
    initialValues: {
      fullName: '', phone: '', addressLine1: '', addressLine2: '',
      city: '', state: '', pincode: '', country: 'India',
      addressType: 'HOME', isDefault: false,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (editAddress) {
          await userApi.updateAddress(editAddress.id, values);
          toast.success('Address updated');
        } else {
          await userApi.addAddress(values);
          toast.success('Address added');
        }
        closeDialog();
        fetchAddresses();
      } catch {
        toast.error('Save failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const openCreate = () => { setEditAddress(null); formik.resetForm(); setDialogOpen(true); };
  const openEdit = (addr: any) => {
    setEditAddress(addr);
    formik.setValues({
      fullName: addr.fullName || '', phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '', addressLine2: addr.addressLine2 || '',
      city: addr.city || '', state: addr.state || '', pincode: addr.pincode || '',
      country: addr.country || 'India', addressType: addr.addressType || 'HOME',
      isDefault: addr.isDefault || false,
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditAddress(null); formik.resetForm(); };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      await userApi.deleteAddress(id);
      fetchAddresses();
    } catch { toast.error('Delete failed'); }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await userApi.updateAddress(id, { isDefault: true });
      fetchAddresses();
    } catch { toast.error('Failed'); }
  };

  const INDIAN_STATES = [
    'Andhra Pradesh', 'Delhi', 'Gujarat', 'Haryana', 'Karnataka',
    'Kerala', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu',
    'Telangana', 'Uttar Pradesh', 'West Bengal', 'Other',
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
          My Addresses
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
          Add Address
        </Button>
      </Box>

      {loading ? (
        <Stack spacing={2}>{[...Array(2)].map((_, i) => <Skeleton key={i} height={140} sx={{ borderRadius: 2 }} />)}</Stack>
      ) : addresses.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Home sx={{ fontSize: 56, color: '#eee', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>No saved addresses</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Add a delivery address to make checkout faster.</Typography>
          <Button variant="contained" onClick={openCreate} sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
            Add Address
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {addresses.map(addr => (
            <Grid item xs={12} sm={6} key={addr.id}>
              <Card elevation={0} sx={{
                border: '1px solid', borderColor: addr.isDefault ? '#1a1a1a' : 'divider',
                borderRadius: 2, position: 'relative',
              }}>
                {addr.isDefault && (
                  <Chip label="Default" size="small"
                    sx={{ position: 'absolute', top: 12, right: 12, bgcolor: '#1a1a1a', color: '#fff', fontSize: '0.65rem', height: 22 }} />
                )}
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip label={addr.addressType} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 22 }} />
                  </Box>
                  <Typography variant="body2" fontWeight={700}>{addr.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">{addr.addressLine1}</Typography>
                  {addr.addressLine2 && <Typography variant="body2" color="text.secondary">{addr.addressLine2}</Typography>}
                  <Typography variant="body2" color="text.secondary">
                    {addr.city}, {addr.state} — {addr.pincode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{addr.phone}</Typography>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    {!addr.isDefault && (
                      <Button size="small" variant="outlined" onClick={() => handleSetDefault(addr.id)}
                        sx={{ fontSize: '0.72rem', borderColor: '#ccc', color: '#666' }}>
                        Set Default
                      </Button>
                    )}
                    <IconButton size="small" onClick={() => openEdit(addr)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(addr.id)} disabled={addr.isDefault}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Full Name" size="small" fullWidth required
                {...formik.getFieldProps('fullName')}
                error={formik.touched.fullName && !!formik.errors.fullName} />
              <TextField label="Phone" size="small" fullWidth required
                {...formik.getFieldProps('phone')}
                error={formik.touched.phone && !!formik.errors.phone} />
            </Box>
            <TextField label="Address Line 1" size="small" fullWidth required
              {...formik.getFieldProps('addressLine1')}
              error={formik.touched.addressLine1 && !!formik.errors.addressLine1} />
            <TextField label="Address Line 2 (optional)" size="small" fullWidth
              {...formik.getFieldProps('addressLine2')} />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="City" size="small" fullWidth required
                {...formik.getFieldProps('city')}
                error={formik.touched.city && !!formik.errors.city} />
              <TextField select label="State" size="small" fullWidth required
                {...formik.getFieldProps('state')}
                error={formik.touched.state && !!formik.errors.state}>
                {INDIAN_STATES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </TextField>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField label="Pincode" size="small" fullWidth required
                {...formik.getFieldProps('pincode')}
                error={formik.touched.pincode && !!formik.errors.pincode}
                helperText={formik.touched.pincode && formik.errors.pincode} />
              <TextField select label="Type" size="small" fullWidth {...formik.getFieldProps('addressType')}>
                {['HOME', 'WORK', 'OTHER'].map(t => <option key={t} value={t}>{t}</option>)}
              </TextField>
            </Box>
            <FormControlLabel
              control={<Checkbox checked={formik.values.isDefault}
                onChange={e => formik.setFieldValue('isDefault', e.target.checked)} />}
              label="Set as default address"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting}
              sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
              {editAddress ? 'Save' : 'Add Address'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
