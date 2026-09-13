'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, IconButton, Chip, Switch, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Stack, Skeleton, Divider,
} from '@mui/material';
import { Add, Edit, Delete, Close } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { countryShippingRuleApi } from '../../services/api.service';
import type { Country, CountryShippingRule } from '../../types';

/**
 * Per-country shipping-rules CRUD (Phase 3 — see
 * documentation/docs/architecture/phase-3-country-shipping-and-admin-spec.md).
 * One rule per method (STANDARD/COD/EXPRESS) per country, enforced by the
 * backend's `@@unique([countryId, method])`. No rule is seeded for any
 * country — an empty list here means that country still resolves shipping
 * through the pre-existing flat-rate/per-product-override chain, unchanged.
 */

const METHODS = ['STANDARD', 'COD', 'EXPRESS'] as const;

const emptyRule = {
  method: 'STANDARD' as (typeof METHODS)[number],
  cost: '',
  freeShippingThreshold: '',
  estimatedDaysMin: '',
  estimatedDaysMax: '',
  customsMessage: '',
  isActive: true,
};

const schema = Yup.object({
  method: Yup.string().oneOf(METHODS as unknown as string[]).required(),
  cost: Yup.number().typeError('Cost must be a number').required('Cost required').min(0),
  freeShippingThreshold: Yup.number().typeError('Must be a number').nullable(),
  estimatedDaysMin: Yup.number().typeError('Must be a whole number').integer().nullable(),
  estimatedDaysMax: Yup.number().typeError('Must be a whole number').integer().nullable(),
  customsMessage: Yup.string(),
  isActive: Yup.boolean(),
});

interface Props {
  country: Country;
  open: boolean;
  onClose: () => void;
}

export default function CountryShippingRulesDialog({ country, open, onClose }: Props) {
  const [rules, setRules] = useState<CountryShippingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRule, setEditRule] = useState<CountryShippingRule | null>(null);

  const fetchRules = useCallback(() => {
    setLoading(true);
    countryShippingRuleApi.getAll(country.id)
      .then(({ data }) => setRules(data.data || []))
      .finally(() => setLoading(false));
  }, [country.id]);

  useEffect(() => { if (open) fetchRules(); }, [open, fetchRules]);

  const formik = useFormik({
    initialValues: emptyRule,
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: async (values, { setSubmitting }) => {
      const payload: any = {
        method: values.method,
        cost: values.cost,
        freeShippingThreshold: values.freeShippingThreshold === '' ? null : values.freeShippingThreshold,
        estimatedDaysMin: values.estimatedDaysMin === '' ? null : values.estimatedDaysMin,
        estimatedDaysMax: values.estimatedDaysMax === '' ? null : values.estimatedDaysMax,
        customsMessage: values.customsMessage || null,
        isActive: values.isActive,
      };
      try {
        if (editRule) {
          await countryShippingRuleApi.update(country.id, editRule.id, payload);
          toast.success('Shipping rule updated');
        } else {
          await countryShippingRuleApi.create(country.id, payload);
          toast.success('Shipping rule created');
        }
        closeForm();
        fetchRules();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Save failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const openCreate = () => {
    setEditRule(null);
    formik.resetForm({ values: emptyRule });
    setFormOpen(true);
  };

  const openEdit = (r: CountryShippingRule) => {
    setEditRule(r);
    formik.resetForm({
      values: {
        method: r.method,
        cost: String(r.cost ?? ''),
        freeShippingThreshold: r.freeShippingThreshold != null ? String(r.freeShippingThreshold) : '',
        estimatedDaysMin: r.estimatedDaysMin != null ? String(r.estimatedDaysMin) : '',
        estimatedDaysMax: r.estimatedDaysMax != null ? String(r.estimatedDaysMax) : '',
        customsMessage: r.customsMessage || '',
        isActive: r.isActive,
      },
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditRule(null);
    formik.resetForm({ values: emptyRule });
  };

  const handleDelete = async (r: CountryShippingRule) => {
    if (!confirm(`Delete the ${r.method} shipping rule for ${country.name}? Orders will fall back to the flat rate / per-product override.`)) return;
    try {
      await countryShippingRuleApi.delete(country.id, r.id);
      toast.success('Deleted');
      fetchRules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Shipping rules — {country.name}
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          One rule per method. A method with no rule here keeps using the platform&apos;s flat-rate /
          per-product-override shipping, unchanged.
        </Typography>

        {loading ? (
          <Stack spacing={1}>{[...Array(2)].map((_, i) => <Skeleton key={i} height={56} sx={{ borderRadius: 2 }} />)}</Stack>
        ) : (
          <Stack spacing={1} sx={{ mb: 2 }}>
            {rules.map(r => (
              <Box key={r.id} sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5,
                border: '1px solid', borderColor: 'divider', borderRadius: 2, opacity: r.isActive ? 1 : 0.6,
              }}>
                <Chip label={r.method} size="small" sx={{ fontWeight: 700 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {country.currencySymbol}{Number(r.cost).toFixed(2)}
                    {r.freeShippingThreshold != null && ` · free above ${country.currencySymbol}${Number(r.freeShippingThreshold).toFixed(2)}`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(r.estimatedDaysMin || r.estimatedDaysMax) && `${r.estimatedDaysMin ?? '?'}–${r.estimatedDaysMax ?? '?'} days`}
                    {!r.isActive && ' · inactive'}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => openEdit(r)}><Edit sx={{ fontSize: 16 }} /></IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(r)}><Delete sx={{ fontSize: 16 }} /></IconButton>
              </Box>
            ))}
            {rules.length === 0 && (
              <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center', fontSize: '0.85rem' }}>
                No shipping rules configured for {country.name} yet.
              </Typography>
            )}
          </Stack>
        )}

        {!formOpen && rules.length < METHODS.length && (
          <Button size="small" startIcon={<Add />} onClick={openCreate}>Add rule</Button>
        )}

        {formOpen && (
          <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField select label="Method" size="small" fullWidth
                  {...formik.getFieldProps('method')}
                  disabled={!!editRule}
                  error={formik.touched.method && !!formik.errors.method}>
                  {METHODS.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
                <TextField label="Cost *" size="small" fullWidth {...formik.getFieldProps('cost')}
                  error={formik.touched.cost && !!formik.errors.cost}
                  helperText={formik.touched.cost && formik.errors.cost} />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField label="Free shipping above" size="small" fullWidth {...formik.getFieldProps('freeShippingThreshold')}
                  error={formik.touched.freeShippingThreshold && !!formik.errors.freeShippingThreshold}
                  helperText="Optional" />
                <TextField label="Customs message" size="small" fullWidth {...formik.getFieldProps('customsMessage')} helperText="Optional" />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField label="Est. days (min)" size="small" fullWidth {...formik.getFieldProps('estimatedDaysMin')} helperText="Optional" />
                <TextField label="Est. days (max)" size="small" fullWidth {...formik.getFieldProps('estimatedDaysMax')} helperText="Optional" />
              </Stack>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Switch checked={formik.values.isActive} onChange={e => formik.setFieldValue('isActive', e.target.checked)} />
                <Typography variant="body2">Active</Typography>
              </Stack>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button onClick={closeForm}>Cancel</Button>
                <Button type="submit" variant="contained" disabled={formik.isSubmitting}
                  sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, fontWeight: 700 }}>
                  {formik.isSubmitting ? 'Saving…' : editRule ? 'Save Changes' : 'Create Rule'}
                </Button>
              </Stack>
            </Stack>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
