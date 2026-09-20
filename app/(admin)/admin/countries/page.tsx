'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, IconButton, Chip, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Avatar, Skeleton, Stack, InputAdornment, Alert,
} from '@mui/material';
import { Add, Edit, Delete, Search, Close, Public, LocalShipping } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { countryApi } from '../../../../services/api.service';
import { toast } from 'react-hot-toast';
import type { Country } from '../../../../types';
import CountryShippingRulesDialog from '../../../../components/admin/CountryShippingRulesDialog';

/**
 * Countries admin — same list+dialog CRUD shape as Materials/Styles/Rooms
 * (see phase-2-handicraft-domain-spec.md), adapted to the `Country` model's
 * fields (code, name, currency, currencySymbol, locale, timezone, sortOrder,
 * isEnabled, isDefault). Uses `GET /countries/admin/all` so all 8 seeded
 * markets show, not just the enabled ones the public storefront selector
 * sees via `CountryContext`.
 *
 * `isDefault` is the one field that isn't "just another toggle": it is the
 * site-wide fallback country used whenever a request carries no `?country=`
 * at all, and the backend enforces exactly one default row at all times —
 * setting a new default silently clears it off whatever country held it
 * before, and the backend refuses to let the current default be unset
 * without another country taking its place. The dialog spells this out so an
 * admin doesn't discover it by trial and error.
 */

const schema = Yup.object({
  code: Yup.string().required('Code required').matches(/^[A-Za-z]{2}$/, 'ISO 3166-1 alpha-2, e.g. IN, AE'),
  name: Yup.string().required('Name required'),
  currency: Yup.string().required('Currency required').matches(/^[A-Za-z]{3}$/, 'ISO 4217, e.g. INR, USD'),
  currencySymbol: Yup.string().required('Currency symbol required'),
  locale: Yup.string().required('Locale required'),
  timezone: Yup.string().required('Timezone required'),
  sortOrder: Yup.number(),
  isEnabled: Yup.boolean(),
  isDefault: Yup.boolean(),
});

const emptyValues = {
  code: '', name: '', currency: '', currencySymbol: '', locale: '', timezone: '',
  sortOrder: 0, isEnabled: false, isDefault: false,
};

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Country | null>(null);
  const [shippingCountry, setShippingCountry] = useState<Country | null>(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    countryApi.getAllAdmin()
      .then(({ data }) => setCountries(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const formik = useFormik({
    initialValues: emptyValues,
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload: any = { ...values };
        if (editItem) {
          await countryApi.update(editItem.id, payload);
          toast.success('Country updated');
        } else {
          await countryApi.create(payload);
          toast.success('Country created');
        }
        closeDialog();
        fetchAll();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Save failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const openCreate = () => {
    setEditItem(null);
    formik.resetForm({ values: emptyValues });
    setDialogOpen(true);
  };

  const openEdit = (c: Country) => {
    setEditItem(c);
    formik.resetForm({
      values: {
        code: c.code || '', name: c.name || '', currency: c.currency || '',
        currencySymbol: c.currencySymbol || '', locale: c.locale || '', timezone: c.timezone || '',
        sortOrder: c.sortOrder ?? 0, isEnabled: c.isEnabled ?? false, isDefault: c.isDefault ?? false,
      },
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    formik.resetForm({ values: emptyValues });
  };

  const handleDelete = async (c: Country) => {
    if (c.isDefault) {
      toast.error('Cannot delete the default country — set a different country as default first');
      return;
    }
    if (!confirm(`Delete ${c.name}? Any product pricing/availability overrides for it are removed too.`)) return;
    try {
      await countryApi.delete(c.id);
      toast.success('Deleted');
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const handleEnabledToggle = async (c: Country) => {
    const next = !c.isEnabled;
    setCountries(prev => prev.map(x => x.id === c.id ? { ...x, isEnabled: next } : x));
    try {
      await countryApi.update(c.id, { isEnabled: next });
    } catch (err: any) {
      setCountries(prev => prev.map(x => x.id === c.id ? { ...x, isEnabled: !next } : x));
      toast.error(err?.response?.data?.message || 'Update failed');
    }
  };

  const filtered = countries.filter(c =>
    !search
    || c.name.toLowerCase().includes(search.toLowerCase())
    || c.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
            Countries
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Markets the storefront can sell into — currency, locale, and which ones shoppers see.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ bgcolor: '#3B2314', '&:hover': { bgcolor: '#333' }, borderRadius: 1.5, fontWeight: 700, fontSize: '0.8rem' }}>
          Add Country
        </Button>
      </Box>

      <TextField size="small" placeholder="Search countries…" sx={{ width: 260, mb: 2.5 }}
        value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />

      {loading ? (
        <Stack spacing={1.5}>
          {[...Array(8)].map((_, i) => <Skeleton key={i} height={64} sx={{ borderRadius: 2 }} />)}
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map(c => (
            <Card key={c.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, opacity: c.isEnabled ? 1 : 0.6 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar variant="rounded" sx={{ width: 48, height: 48, bgcolor: '#f0f0f0', fontSize: '0.75rem', fontWeight: 700 }}>
                  {c.code}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                    {c.isDefault && <Chip icon={<Public sx={{ fontSize: '0.8rem' }} />} label="Default" size="small" color="primary" sx={{ fontSize: '0.62rem', height: 18 }} />}
                    {!c.isEnabled && <Chip label="Disabled" size="small" sx={{ fontSize: '0.62rem', height: 18 }} />}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {c.currency} ({c.currencySymbol}) · {c.locale} · {c.timezone} · order {c.sortOrder}
                  </Typography>
                </Box>
                <Switch size="small" color="success" checked={c.isEnabled} onChange={() => handleEnabledToggle(c)} />
                <IconButton size="small" title="Shipping rules" onClick={() => setShippingCountry(c)}><LocalShipping sx={{ fontSize: 16 }} /></IconButton>
                <IconButton size="small" onClick={() => openEdit(c)}><Edit sx={{ fontSize: 16 }} /></IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(c)}><Delete sx={{ fontSize: 16 }} /></IconButton>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>No countries found</Typography>
          )}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editItem ? `Edit: ${editItem.name}` : 'Add Country'}
          <IconButton size="small" onClick={closeDialog}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Stack direction="row" spacing={2}>
              <TextField label="ISO code *" size="small" fullWidth
                {...formik.getFieldProps('code')}
                onChange={(e) => formik.setFieldValue('code', e.target.value.toUpperCase())}
                error={formik.touched.code && !!formik.errors.code}
                helperText={(formik.touched.code && formik.errors.code) || 'e.g. IN, AE, US'} />
              <TextField label="Name *" size="small" fullWidth
                {...formik.getFieldProps('name')}
                error={formik.touched.name && !!formik.errors.name}
                helperText={formik.touched.name && formik.errors.name} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Currency code *" size="small" fullWidth
                {...formik.getFieldProps('currency')}
                onChange={(e) => formik.setFieldValue('currency', e.target.value.toUpperCase())}
                error={formik.touched.currency && !!formik.errors.currency}
                helperText={(formik.touched.currency && formik.errors.currency) || 'ISO 4217, e.g. INR'} />
              <TextField label="Currency symbol *" size="small" fullWidth
                {...formik.getFieldProps('currencySymbol')}
                error={formik.touched.currencySymbol && !!formik.errors.currencySymbol}
                helperText={formik.touched.currencySymbol && formik.errors.currencySymbol} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField label="Locale *" size="small" fullWidth
                {...formik.getFieldProps('locale')}
                error={formik.touched.locale && !!formik.errors.locale}
                helperText={(formik.touched.locale && formik.errors.locale) || 'e.g. en-IN'} />
              <TextField label="Timezone *" size="small" fullWidth
                {...formik.getFieldProps('timezone')}
                error={formik.touched.timezone && !!formik.errors.timezone}
                helperText={(formik.touched.timezone && formik.errors.timezone) || 'e.g. Asia/Kolkata'} />
            </Stack>
            <TextField label="Sort Order" size="small" type="number" fullWidth {...formik.getFieldProps('sortOrder')}
              helperText="Lower = shown first in the storefront country selector" />

            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={formik.values.isEnabled} onChange={e => formik.setFieldValue('isEnabled', e.target.checked)} />
              <Typography variant="body2">Enabled (visible to shoppers)</Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={formik.values.isDefault} onChange={e => formik.setFieldValue('isDefault', e.target.checked)} />
              <Typography variant="body2">Default country</Typography>
            </Stack>
            <Alert severity="info" sx={{ fontSize: '0.78rem' }}>
              The default country is the site-wide fallback used whenever a request has no country
              selected at all. Exactly one country is always the default — turning this on here
              turns it off for whichever country currently holds it. You cannot turn this off for
              the current default without making another country the default first.
            </Alert>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting}
              sx={{ bgcolor: '#3B2314', '&:hover': { bgcolor: '#333' }, fontWeight: 700 }}>
              {formik.isSubmitting ? 'Saving…' : editItem ? 'Save Changes' : 'Create Country'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {shippingCountry && (
        <CountryShippingRulesDialog
          country={shippingCountry}
          open={!!shippingCountry}
          onClose={() => setShippingCountry(null)}
        />
      )}
    </Box>
  );
}
