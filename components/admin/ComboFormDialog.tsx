'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert, Autocomplete, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, InputAdornment, MenuItem, Switch, TextField, ToggleButton, ToggleButtonGroup,
  Typography, Divider,
} from '@mui/material';
import { Close, DeleteOutline, AddPhotoAlternate } from '@mui/icons-material';
import { comboApi, countryApi, productApi } from '../../services/api.service';
import type { Country } from '../../types';
import toast from 'react-hot-toast';
import { variantShort } from '../../lib/variantLabel';

/**
 * Create / edit a combo offer (decision 0037). The "you save" preview comes from
 * the server (`POST /combos/admin/preview`), i.e. the exact code that prices the
 * cart, so what the admin sees is what shoppers are charged. Money figures are
 * per market in that market's own currency; nothing is converted.
 */

const MODES = [
  { value: 'FIXED_PRICE', label: 'Fixed price', hint: 'The set costs exactly this, per market.' },
  { value: 'PERCENT_OFF', label: '% off', hint: 'A percentage off what the items cost separately (same in every market).' },
  { value: 'AMOUNT_OFF', label: 'Amount off', hint: 'A flat amount off the separate total, per market.' },
] as const;

interface Line { key: string; productId: string; name: string; image: string | null; quantity: string; variantId: string; variants: { id: string; size?: string | null; color?: string | null; isActive: boolean }[] }
interface Row { enabled: boolean; value: string }

const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const isoOrNull = (v: string) => (v ? new Date(v).toISOString() : null);
const variantLabel = (v: { size?: string | null; color?: string | null }) => variantShort(v) || 'Option';

const blank = () => ({
  name: '', slug: '', description: '', badgeText: '', sortOrder: '0', isActive: true, showOnHome: true,
  startsAt: '', endsAt: '', pricingMode: 'FIXED_PRICE' as string, baseValue: '',
});

export default function ComboFormDialog({ open, comboId, onClose, onSaved }: { open: boolean; comboId: string | null; onClose: () => void; onSaved: () => void }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [f, setF] = useState(blank());
  const [lines, setLines] = useState<Line[]>([]);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [image, setImage] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [productQ, setProductQ] = useState('');
  const [productOpts, setProductOpts] = useState<{ id: string; name: string; image?: string | null }[]>([]);
  const [preview, setPreview] = useState<any[] | null>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const seq = useRef(0);

  const def = countries.find((c) => c.isDefault);

  useEffect(() => {
    if (!open) return;
    countryApi.getAllAdmin().then(({ data }) => setCountries(((data as any).data ?? []).filter((c: Country) => c.isEnabled))).catch(() => {});
  }, [open]);

  // Load (edit) or reset (create).
  useEffect(() => {
    if (!open) return;
    setErr(null); setImage(null); setRemoveImage(false); setPreview(null); setPreviewErr(null);
    if (!comboId) { setF(blank()); setLines([]); setRows({}); setExistingImage(null); return; }
    setLoading(true);
    comboApi.adminGet(comboId).then(({ data }) => {
      const c = (data as any).data;
      setF({
        name: c.name, slug: c.slug, description: c.description ?? '', badgeText: c.badgeText ?? '', sortOrder: String(c.sortOrder ?? 0),
        isActive: c.isActive, showOnHome: c.showOnHome, startsAt: toLocalInput(c.startsAt), endsAt: toLocalInput(c.endsAt),
        pricingMode: c.pricingMode, baseValue: c.discountValue != null ? String(Number(c.discountValue)) : '',
      });
      setExistingImage(c.image ?? null);
      setLines(c.items.map((i: any) => ({
        key: i.id, productId: i.productId, name: i.product.name, image: i.product.images?.[0]?.url ?? null,
        quantity: String(i.quantity), variantId: i.variantId ?? '', variants: i.product.variants ?? [],
      })));
      const r: Record<string, Row> = {};
      for (const x of c.countries) r[x.country.code] = { enabled: x.isEnabled, value: x.value != null ? String(Number(x.value)) : '' };
      setRows(r);
    }).catch(() => setErr('Could not load this combo.')).finally(() => setLoading(false));
  }, [open, comboId]);

  // Default new combo: on in the default market.
  useEffect(() => {
    if (open && !comboId && def) setRows((r) => (Object.keys(r).length ? r : { [def.code]: { enabled: true, value: '' } }));
  }, [open, comboId, def]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      productApi.getAllAdmin({ search: productQ || undefined, limit: 15 })
        .then(({ data }) => setProductOpts(((data as any).data ?? []).filter((p: any) => p.isActive !== false).map((p: any) => ({ id: p.id, name: p.name, image: p.images?.[0]?.url ?? null }))))
        .catch(() => {});
    }, 300);
    return () => clearTimeout(t);
  }, [open, productQ]);

  const addProduct = async (p: { id: string; name: string; image?: string | null } | null) => {
    if (!p) return;
    if (lines.some((l) => l.productId === p.id)) { toast.error('Already in the combo. Raise its quantity instead.'); return; }
    let variants: Line['variants'] = [];
    try {
      const { data } = await productApi.getById(p.id);
      variants = ((data as any).data?.variants ?? []).filter((v: any) => v.isActive);
    } catch { /* picker still works for products without options */ }
    setLines((ls) => [...ls, { key: p.id, productId: p.id, name: p.name, image: p.image ?? null, quantity: '1', variantId: variants[0]?.id ?? '', variants }]);
  };

  const body = useMemo(() => ({
    name: f.name.trim(), slug: f.slug.trim() || undefined, description: f.description, badgeText: f.badgeText,
    sortOrder: f.sortOrder, isActive: f.isActive, showOnHome: f.showOnHome,
    startsAt: isoOrNull(f.startsAt), endsAt: isoOrNull(f.endsAt),
    pricingMode: f.pricingMode, discountValue: f.baseValue === '' ? null : Number(f.baseValue),
    items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId || null, quantity: Number(l.quantity) || 1 })),
    countries: Object.entries(rows).map(([code, r]) => ({
      code, isEnabled: r.enabled,
      // The default market's figure is the combo's base value; only other markets use a per-row value.
      value: code === def?.code ? null : (r.value === '' ? null : Number(r.value)),
    })),
  }), [f, lines, rows, def]);

  // Live per-market preview, debounced, latest request wins.
  useEffect(() => {
    if (!open || !lines.length) { setPreview(null); setPreviewErr(null); return; }
    const mine = ++seq.current;
    const t = setTimeout(() => {
      comboApi.preview({ ...body, name: body.name || 'Preview combo' })
        .then(({ data }) => { if (mine === seq.current) { setPreview((data as any).data); setPreviewErr(null); } })
        .catch((e) => { if (mine === seq.current) { setPreview(null); setPreviewErr(e?.response?.data?.message || 'Preview unavailable'); } });
    }, 450);
    return () => clearTimeout(t);
  }, [open, body, lines.length]);

  const submit = async () => {
    setErr(null);
    if (f.name.trim().length < 3) { setErr('Give the combo a name (at least 3 characters).'); return; }
    if (!lines.length) { setErr('Add at least one product.'); return; }
    setSaving(true);
    try {
      const form = new FormData();
      Object.entries(body).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        form.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
      });
      if (image) form.append('image', image);
      if (removeImage && !image) form.append('removeImage', 'true');
      if (comboId) await comboApi.update(comboId, form); else await comboApi.create(form);
      toast.success(comboId ? 'Combo updated' : 'Combo created');
      onSaved(); onClose();
    } catch (e: any) {
      setErr(e?.response?.data?.message || 'Could not save the combo.');
    } finally { setSaving(false); }
  };

  const modeHint = MODES.find((m) => m.value === f.pricingMode)?.hint;
  const baseLabel = f.pricingMode === 'PERCENT_OFF' ? 'Percent off' : f.pricingMode === 'FIXED_PRICE' ? `Combo price (${def?.currency ?? 'INR'})` : `Amount off (${def?.currency ?? 'INR'})`;
  const previewUrl = image ? URL.createObjectURL(image) : (!removeImage ? existingImage : null);

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 700 }}>
        {comboId ? 'Edit combo' : 'New combo'}
        <IconButton onClick={onClose} disabled={saving} aria-label="Close"><Close /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {loading ? <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box> : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {err && <Alert severity="error" onClose={() => setErr(null)}>{err}</Alert>}

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Name" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} inputProps={{ maxLength: 120 }} />
              <TextField label="URL slug" placeholder="auto from name" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} helperText="Leave empty to generate" />
            </Box>
            <TextField label="Description" multiline minRows={2} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Badge text" placeholder="e.g. Gift-ready (empty shows 'Save 22%')" value={f.badgeText} onChange={(e) => setF({ ...f, badgeText: e.target.value })} inputProps={{ maxLength: 30 }} />
              <TextField label="Sort order" type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} helperText="Lower shows first" />
            </Box>

            {/* Image */}
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ width: 120, height: 90, borderRadius: 1, border: '1px dashed #ccc', bgcolor: '#faf6ee', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {previewUrl ? <img src={previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <AddPhotoAlternate sx={{ color: '#bbb' }} />}
              </Box>
              <Box>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { setImage(e.target.files?.[0] ?? null); setRemoveImage(false); }} />
                <Button size="small" variant="outlined" onClick={() => fileRef.current?.click()}>{previewUrl ? 'Replace image' : 'Upload image'}</Button>
                {previewUrl && <Button size="small" color="error" sx={{ ml: 1 }} onClick={() => { setImage(null); setRemoveImage(true); }}>Remove</Button>}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>Landscape, at least 800px wide. Without one, a collage of the products is shown.</Typography>
              </Box>
            </Box>

            <Divider />
            {/* Products */}
            <Box>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>Products in the combo</Typography>
              <Autocomplete
                options={productOpts} getOptionLabel={(o) => o.name} value={null} blurOnSelect clearOnBlur
                inputValue={productQ} onInputChange={(_, v, reason) => { if (reason !== 'reset') setProductQ(v); }}
                onChange={(_, v) => { addProduct(v); setProductQ(''); }}
                renderInput={(p) => <TextField {...p} size="small" placeholder="Search products to add…" />}
                filterOptions={(x) => x}
              />
              <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {lines.map((l) => (
                  <Box key={l.key} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', p: 1, border: '1px solid #eee', borderRadius: 1, flexWrap: 'wrap' }}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 1, overflow: 'hidden', bgcolor: '#f3ece0', flexShrink: 0 }}>
                      {l.image && <img src={l.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </Box>
                    <Typography sx={{ flex: '1 1 160px', minWidth: 0, fontSize: '0.9rem', fontWeight: 600 }}>{l.name}</Typography>
                    {l.variants.length > 0 && (
                      <TextField select size="small" label="Size / Finish" value={l.variantId} sx={{ minWidth: 150 }}
                        onChange={(e) => setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, variantId: e.target.value } : x)))}>
                        {l.variants.map((v) => <MenuItem key={v.id} value={v.id}>{variantLabel(v)}</MenuItem>)}
                      </TextField>
                    )}
                    <TextField size="small" type="number" label="Qty" value={l.quantity} sx={{ width: 84 }} inputProps={{ min: 1, max: 20 }}
                      onChange={(e) => setLines((ls) => ls.map((x) => (x.key === l.key ? { ...x, quantity: e.target.value } : x)))} />
                    <IconButton size="small" color="error" aria-label={`Remove ${l.name}`} onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}><DeleteOutline fontSize="small" /></IconButton>
                  </Box>
                ))}
                {!lines.length && <Typography variant="body2" color="text.secondary">No products yet. A combo needs at least two items.</Typography>}
              </Box>
            </Box>

            <Divider />
            {/* Pricing */}
            <Box>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>Pricing</Typography>
              <ToggleButtonGroup exclusive size="small" value={f.pricingMode} onChange={(_, v) => v && setF({ ...f, pricingMode: v })}>
                {MODES.map((m) => <ToggleButton key={m.value} value={m.value} sx={{ px: 2, textTransform: 'none', fontWeight: 600 }}>{m.label}</ToggleButton>)}
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>{modeHint}</Typography>
              <TextField sx={{ mt: 1.5, width: { xs: '100%', sm: 260 } }} size="small" type="number" label={baseLabel} value={f.baseValue}
                onChange={(e) => setF({ ...f, baseValue: e.target.value })}
                InputProps={f.pricingMode === 'PERCENT_OFF' ? { endAdornment: <InputAdornment position="end">%</InputAdornment> } : { startAdornment: <InputAdornment position="start">{def?.currencySymbol ?? '₹'}</InputAdornment> }} />
            </Box>

            {/* Markets */}
            <Box>
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Markets and live savings</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                Switch a market on to sell the combo there.{f.pricingMode !== 'PERCENT_OFF' && ' Other markets need their own price in their own currency: a rupee figure is never charged as dollars.'}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {countries.map((c) => {
                  const r = rows[c.code] ?? { enabled: false, value: '' };
                  const pv = preview?.find((p) => p.code === c.code);
                  const money = (n: number | null) => (n == null ? '-' : `${c.currencySymbol}${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`);
                  return (
                    <Box key={c.code} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', p: 1.25, border: '1px solid #eee', borderRadius: 1, bgcolor: r.enabled ? '#fffdf8' : '#fafafa' }}>
                      <FormControlLabel sx={{ minWidth: 190, m: 0 }} label={<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name} <Typography component="span" variant="caption" color="text.secondary">({c.currency}){c.isDefault ? ' · default' : ''}</Typography></Typography>}
                        control={<Switch size="small" checked={r.enabled} onChange={(e) => setRows((x) => ({ ...x, [c.code]: { ...r, enabled: e.target.checked } }))} />} />
                      {r.enabled && !c.isDefault && (
                        <TextField size="small" type="number" sx={{ width: 170 }}
                          label={f.pricingMode === 'FIXED_PRICE' ? 'Price' : f.pricingMode === 'AMOUNT_OFF' ? 'Amount off' : 'Percent (optional)'}
                          value={r.value} onChange={(e) => setRows((x) => ({ ...x, [c.code]: { ...r, value: e.target.value } }))}
                          InputProps={{ startAdornment: f.pricingMode === 'PERCENT_OFF' ? undefined : <InputAdornment position="start">{c.currencySymbol}</InputAdornment> }} />
                      )}
                      {r.enabled && (
                        <Box sx={{ flex: 1, minWidth: 180, fontSize: '0.8rem' }}>
                          {pv ? (pv.error
                            ? <Typography variant="caption" sx={{ color: '#b3261e' }}>{pv.error}</Typography>
                            : <span>Separately <b>{money(pv.separateTotal)}</b> → combo <b>{money(pv.price)}</b> · <span style={{ color: '#2e7d32', fontWeight: 700 }}>you save {money(pv.savings)} ({pv.savingsPercent}%)</span></span>)
                            : <Typography variant="caption" color="text.secondary">{lines.length ? 'Calculating…' : 'Add products to preview'}</Typography>}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
              {previewErr && <Typography variant="caption" sx={{ color: '#b3261e', display: 'block', mt: 1 }}>{previewErr}</Typography>}
            </Box>

            <Divider />
            <Box>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>Schedule and visibility</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Starts" type="datetime-local" InputLabelProps={{ shrink: true }} value={f.startsAt} onChange={(e) => setF({ ...f, startsAt: e.target.value })} helperText="Empty = immediately" />
                <TextField label="Ends" type="datetime-local" InputLabelProps={{ shrink: true }} value={f.endsAt} onChange={(e) => setF({ ...f, endsAt: e.target.value })} helperText="Empty = no end" />
              </Box>
              <Box sx={{ display: 'flex', gap: 3, mt: 1, flexWrap: 'wrap' }}>
                <FormControlLabel control={<Switch checked={f.isActive} onChange={(e) => setF({ ...f, isActive: e.target.checked })} />} label="Active" />
                <FormControlLabel control={<Switch checked={f.showOnHome} onChange={(e) => setF({ ...f, showOnHome: e.target.checked })} />} label="Show on the homepage" />
              </Box>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={saving || loading} sx={{ bgcolor: '#3B2314', '&:hover': { bgcolor: '#2a190e' } }}>
          {saving ? 'Saving…' : comboId ? 'Save changes' : 'Create combo'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
