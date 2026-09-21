'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, FormControlLabel, InputAdornment, MenuItem, Switch, TextField, ToggleButton,
  ToggleButtonGroup, Typography,
} from '@mui/material';
import { categoryApi, countryApi, couponApi, productApi } from '../../services/api.service';
import type { Country } from '../../types';
import toast from 'react-hot-toast';

/**
 * Create / edit a coupon with every rule (decision 0035). Money amounts are per
 * country: the default market's figures are the coupon's base terms, every other
 * market gets its own row in its own currency. Nothing here converts currency.
 */

const TYPES = [
  { value: 'PERCENTAGE', label: 'Percentage off', hint: 'Takes a % off the eligible items.' },
  { value: 'FIXED', label: 'Fixed amount off', hint: 'Takes a fixed amount off, never more than the eligible items cost.' },
  { value: 'FREE_SHIPPING', label: 'Free shipping', hint: 'Waives the delivery charge. Nothing comes off the goods.' },
];

interface Terms { value: string; min: string; max: string }
const emptyTerms = (): Terms => ({ value: '', min: '', max: '' });

const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const blank = () => ({
  code: '', description: '', type: 'PERCENTAGE',
  value: '', minOrderAmount: '', maxDiscount: '',
  scope: 'ALL' as 'ALL' | 'SELECT', countryCodes: [] as string[], terms: {} as Record<string, Terms>,
  usageLimit: '', userLimitMode: 'LIMITED' as 'LIMITED' | 'UNLIMITED', userLimit: '1',
  categoryIds: [] as string[], products: [] as { id: string; name: string }[],
  firstOrderOnly: false, excludeSaleItems: false, isPublic: false, isActive: true,
  startsAt: '', expiresAt: '',
});
type Form = ReturnType<typeof blank>;

const num = (v: string) => (v === '' ? null : Number(v));

export default function CouponFormDialog({ open, couponId, onClose, onSaved }: {
  open: boolean; couponId: string | null; onClose: () => void; onSaved: () => void;
}) {
  const [f, setF] = useState<Form>(blank());
  const [countries, setCountries] = useState<Country[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; parentId: string | null }[]>([]);
  const [productOpts, setProductOpts] = useState<{ id: string; name: string }[]>([]);
  const [productQ, setProductQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [usageCount, setUsageCount] = useState(0);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setErr(null); setTouched(false);
    countryApi.getAllAdmin().then(({ data }) => setCountries((data as any).data ?? [])).catch(() => {});
    categoryApi.getAll({ limit: 500 }).then(({ data }) => setCategories(((data as any).data ?? []) as any)).catch(() => {});
    if (!couponId) { setF(blank()); setUsageCount(0); return; }
    setLoading(true);
    couponApi.getOne(couponId).then(({ data }) => {
      const c = (data as any).data;
      const terms: Record<string, Terms> = {};
      for (const [k, t] of Object.entries<any>(c.countryTerms ?? {})) {
        terms[k] = { value: String(t.value ?? ''), min: t.minOrderAmount != null ? String(t.minOrderAmount) : '', max: t.maxDiscount != null ? String(t.maxDiscount) : '' };
      }
      setUsageCount(c.usageCount ?? 0);
      setF({
        code: c.code, description: c.description ?? '', type: c.type,
        value: c.type === 'FREE_SHIPPING' ? '' : String(Number(c.value)),
        minOrderAmount: c.minOrderAmount != null ? String(Number(c.minOrderAmount)) : '',
        maxDiscount: c.maxDiscount != null ? String(Number(c.maxDiscount)) : '',
        scope: c.countryCodes?.length ? 'SELECT' : 'ALL', countryCodes: c.countryCodes ?? [], terms,
        usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
        userLimitMode: c.userLimit == null ? 'UNLIMITED' : 'LIMITED', userLimit: String(c.userLimit ?? 1),
        categoryIds: c.categoryIds ?? [], products: c.products ?? [],
        firstOrderOnly: !!c.firstOrderOnly, excludeSaleItems: !!c.excludeSaleItems,
        isPublic: !!c.isPublic, isActive: c.isActive ?? true,
        startsAt: toLocalInput(c.startsAt), expiresAt: toLocalInput(c.expiresAt),
      });
    }).catch(() => setErr('Could not load this coupon.')).finally(() => setLoading(false));
  }, [open, couponId]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      productApi.getAllAdmin({ search: productQ || undefined, limit: 15 })
        .then(({ data }) => setProductOpts(((data as any).data ?? []).map((p: any) => ({ id: p.id, name: p.name }))))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [open, productQ]);

  const def = countries.find((c) => c.isDefault);
  const sym = def?.currencySymbol ?? '₹';
  const others = countries.filter((c) => !c.isDefault);
  const baseApplies = f.scope === 'ALL' || (def ? f.countryCodes.includes(def.code) : true);
  const money = f.type === 'FIXED' || !!f.minOrderAmount || !!f.maxDiscount
    || Object.values(f.terms).some((t) => t.min || t.max);
  // Which other markets get an amount row.
  const rows = f.scope === 'ALL' ? others.filter((c) => c.isEnabled) : others.filter((c) => f.countryCodes.includes(c.code));
  const rowsRequired = money && f.scope === 'SELECT';

  const setTerm = (code: string, k: keyof Terms, v: string) =>
    setF((p) => ({ ...p, terms: { ...p.terms, [code]: { ...(p.terms[code] ?? emptyTerms()), [k]: v } } }));

  const problems = useMemo(() => {
    const e: Record<string, string> = {};
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(f.code.trim())) e.code = '3-32 characters: letters, numbers, - or _';
    if (baseApplies && f.type !== 'FREE_SHIPPING') {
      const v = Number(f.value);
      if (!f.value || !(v > 0)) e.value = 'Enter an amount greater than 0';
      else if (f.type === 'PERCENTAGE' && v > 100) e.value = 'A percentage can’t exceed 100';
    }
    if (f.scope === 'SELECT' && !f.countryCodes.length) e.countries = 'Pick at least one country';
    if (rowsRequired && f.type !== 'FREE_SHIPPING') {
      for (const c of rows) if (!(Number(f.terms[c.code]?.value) > 0)) e[`t_${c.code}`] = `Amount for ${c.name}`;
    }
    if (f.startsAt && f.expiresAt && new Date(f.expiresAt) <= new Date(f.startsAt)) e.expiresAt = 'Expiry must be after the start';
    if (f.usageLimit && !(Number(f.usageLimit) >= 1)) e.usageLimit = 'Whole number, 1 or more';
    if (f.userLimitMode === 'LIMITED' && !(Number(f.userLimit) >= 1)) e.userLimit = 'Whole number, 1 or more';
    return e;
  }, [f, baseApplies, rows, rowsRequired]);

  const submit = async () => {
    setTouched(true); setErr(null);
    if (Object.keys(problems).length) return;
    const terms: Record<string, any> = {};
    for (const c of rows) {
      const t = f.terms[c.code];
      if (!t || (!t.value && f.type !== 'FREE_SHIPPING') || (f.type === 'FREE_SHIPPING' && !t.min)) continue;
      terms[c.code] = { value: num(t.value), minOrderAmount: num(t.min), maxDiscount: f.type === 'PERCENTAGE' ? num(t.max) : null };
    }
    const payload = {
      code: f.code.trim().toUpperCase(), description: f.description.trim() || null, type: f.type,
      value: f.type === 'FREE_SHIPPING' ? 0 : num(f.value),
      minOrderAmount: num(f.minOrderAmount), maxDiscount: f.type === 'PERCENTAGE' ? num(f.maxDiscount) : null,
      usageLimit: num(f.usageLimit), userLimit: f.userLimitMode === 'UNLIMITED' ? null : Number(f.userLimit),
      countryCodes: f.scope === 'SELECT' ? f.countryCodes : null, countryTerms: terms,
      categoryIds: f.categoryIds, productIds: f.products.map((p) => p.id),
      firstOrderOnly: f.firstOrderOnly, excludeSaleItems: f.excludeSaleItems, isPublic: f.isPublic, isActive: f.isActive,
      startsAt: f.startsAt ? new Date(f.startsAt).toISOString() : null,
      expiresAt: f.expiresAt ? new Date(f.expiresAt).toISOString() : null,
    };
    setSaving(true);
    try {
      if (couponId) await couponApi.update(couponId, payload); else await couponApi.create(payload);
      toast.success(couponId ? 'Coupon updated' : 'Coupon created');
      onSaved(); onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const eh = (k: string) => (touched && problems[k] ? { error: true, helperText: problems[k] } : {});
  const typeHint = TYPES.find((t) => t.value === f.type)?.hint;
  const catOptions = categories;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ fontWeight: 700 }}>{couponId ? 'Edit coupon' : 'New coupon'}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {loading ? <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress size={28} /></Box> : (<>
          {err && <Alert severity="error" onClose={() => setErr(null)}>{err}</Alert>}

          <Section title="Basics">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr' }, gap: 2 }}>
              <TextField label="Code" size="small" required value={f.code}
                onChange={(e) => set('code', e.target.value.toUpperCase())}
                disabled={!!couponId && usageCount > 0}
                inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 1 }, maxLength: 32 }}
                {...eh('code')} helperText={touched && problems.code ? problems.code : (couponId && usageCount > 0 ? 'Locked: already used on orders' : undefined)} />
              <TextField label="Description (shown in offers)" size="small" value={f.description}
                onChange={(e) => set('description', e.target.value)} inputProps={{ maxLength: 255 }} />
            </Box>
          </Section>

          <Section title="Discount" note={typeHint}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
              <TextField select label="Type" size="small" value={f.type} onChange={(e) => set('type', e.target.value)}>
                {TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
              {f.type !== 'FREE_SHIPPING' && baseApplies && (
                <TextField label={f.type === 'PERCENTAGE' ? 'Percentage' : `Amount (${def?.currency ?? 'INR'})`} size="small" type="number"
                  value={f.value} onChange={(e) => set('value', e.target.value)}
                  InputProps={{ endAdornment: <InputAdornment position="end">{f.type === 'PERCENTAGE' ? '%' : sym}</InputAdornment> }}
                  {...eh('value')} />
              )}
              {f.type === 'PERCENTAGE' && baseApplies && (
                <TextField label={`Max discount (${sym}), optional`} size="small" type="number" value={f.maxDiscount}
                  onChange={(e) => set('maxDiscount', e.target.value)} />
              )}
              {baseApplies && (
                <TextField label={`Minimum order (${sym}), optional`} size="small" type="number" value={f.minOrderAmount}
                  onChange={(e) => set('minOrderAmount', e.target.value)}
                  helperText="Judged on the items the coupon applies to" />
              )}
            </Box>
            {!baseApplies && <Typography variant="caption" color="text.secondary">The default market ({def?.name}) is not selected, so its amounts are not needed.</Typography>}
          </Section>

          <Section title="Countries" note="Money amounts are per country and never converted: a ₹ amount is not reused as $.">
            <ToggleButtonGroup exclusive size="small" value={f.scope} onChange={(_, v) => v && set('scope', v)}>
              <ToggleButton value="ALL">All markets</ToggleButton>
              <ToggleButton value="SELECT">Only selected countries</ToggleButton>
            </ToggleButtonGroup>
            {f.scope === 'SELECT' && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.5 }}>
                {countries.map((c) => {
                  const on = f.countryCodes.includes(c.code);
                  return (
                    <Chip key={c.code} label={`${c.name}${c.isEnabled ? '' : ' (disabled)'}`} size="small"
                      color={on ? 'primary' : 'default'} variant={on ? 'filled' : 'outlined'}
                      onClick={() => set('countryCodes', on ? f.countryCodes.filter((x) => x !== c.code) : [...f.countryCodes, c.code])}
                      sx={on ? { bgcolor: '#3B2314' } : undefined} />
                  );
                })}
              </Box>
            )}
            {touched && problems.countries && <Typography variant="caption" color="error">{problems.countries}</Typography>}

            {money && rows.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {rowsRequired
                    ? 'Amounts for each selected country, in that country’s currency:'
                    : 'Other markets: fill a row to offer this coupon there, leave it blank to not offer it.'}
                </Typography>
                {rows.map((c) => {
                  const t = f.terms[c.code] ?? emptyTerms();
                  return (
                    <Box key={c.code} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1.2fr 1fr 1fr 1fr' }, gap: 1.5, alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={700} sx={{ gridColumn: { xs: '1 / -1', sm: 'auto' } }}>{c.name} <Typography component="span" variant="caption" color="text.secondary">({c.currency})</Typography></Typography>
                      {f.type !== 'FREE_SHIPPING' && (
                        <TextField size="small" type="number" label={f.type === 'PERCENTAGE' ? '%' : 'Amount'} value={t.value}
                          onChange={(e) => setTerm(c.code, 'value', e.target.value)}
                          InputProps={{ startAdornment: f.type === 'FIXED' ? <InputAdornment position="start">{c.currencySymbol}</InputAdornment> : undefined }}
                          {...eh(`t_${c.code}`)} />
                      )}
                      <TextField size="small" type="number" label="Min order" value={t.min} onChange={(e) => setTerm(c.code, 'min', e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start">{c.currencySymbol}</InputAdornment> }} />
                      {f.type === 'PERCENTAGE' && (
                        <TextField size="small" type="number" label="Max discount" value={t.max} onChange={(e) => setTerm(c.code, 'max', e.target.value)}
                          InputProps={{ startAdornment: <InputAdornment position="start">{c.currencySymbol}</InputAdornment> }} />
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Section>

          <Section title="Applies to" note="Leave empty for the whole bag. Categories include their sub-categories.">
            <Autocomplete multiple size="small" options={catOptions} getOptionLabel={(o) => o.name}
              value={catOptions.filter((c) => f.categoryIds.includes(c.id))}
              onChange={(_, v) => set('categoryIds', v.map((x) => x.id))}
              renderInput={(p) => <TextField {...p} label="Categories" />} />
            <Autocomplete multiple size="small" sx={{ mt: 1.5 }} options={productOpts} getOptionLabel={(o) => o.name}
              filterOptions={(x) => x} isOptionEqualToValue={(a, b) => a.id === b.id}
              value={f.products} onChange={(_, v) => set('products', v)}
              onInputChange={(_, v) => setProductQ(v)}
              renderInput={(p) => <TextField {...p} label="Products (search)" />} />
            <FormControlLabel sx={{ mt: 0.5 }} control={<Checkbox checked={f.excludeSaleItems} onChange={(e) => set('excludeSaleItems', e.target.checked)} />}
              label="Exclude items that are already on sale" />
          </Section>

          <Section title="Limits & conditions">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Total uses (blank = unlimited)" size="small" type="number" value={f.usageLimit}
                onChange={(e) => set('usageLimit', e.target.value)} {...eh('usageLimit')} />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField label="Uses per customer" size="small" type="number" value={f.userLimitMode === 'UNLIMITED' ? '' : f.userLimit}
                  disabled={f.userLimitMode === 'UNLIMITED'} onChange={(e) => set('userLimit', e.target.value)} sx={{ flex: 1 }} {...eh('userLimit')} />
                <FormControlLabel control={<Checkbox checked={f.userLimitMode === 'UNLIMITED'} onChange={(e) => set('userLimitMode', e.target.checked ? 'UNLIMITED' : 'LIMITED')} />}
                  label="Unlimited" sx={{ mr: 0, whiteSpace: 'nowrap' }} />
              </Box>
            </Box>
            <FormControlLabel control={<Checkbox checked={f.firstOrderOnly} onChange={(e) => set('firstOrderOnly', e.target.checked)} />}
              label="First order only (customer has no earlier non-cancelled order)" />
          </Section>

          <Section title="Schedule & visibility">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Starts" type="datetime-local" size="small" InputLabelProps={{ shrink: true }} value={f.startsAt} onChange={(e) => set('startsAt', e.target.value)} />
              <TextField label="Expires" type="datetime-local" size="small" InputLabelProps={{ shrink: true }} value={f.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} {...eh('expiresAt')} />
            </Box>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <FormControlLabel control={<Switch checked={f.isActive} onChange={(e) => set('isActive', e.target.checked)} />} label="Active" />
              <FormControlLabel control={<Switch checked={f.isPublic} onChange={(e) => set('isPublic', e.target.checked)} />} label="Show in storefront “Available offers”" />
            </Box>
          </Section>
        </>)}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving || loading}
          sx={{ bgcolor: '#3B2314', '&:hover': { bgcolor: '#2a190e' } }}>
          {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : couponId ? 'Save changes' : 'Create coupon'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="overline" sx={{ fontWeight: 800, letterSpacing: '0.08em', color: '#A0693A' }}>{title}</Typography>
      {note && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{note}</Typography>}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 0.5 }}>{children}</Box>
      <Divider sx={{ mt: 2.5 }} />
    </Box>
  );
}
