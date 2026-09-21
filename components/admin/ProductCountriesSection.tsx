'use client';
import { useMemo } from 'react';
import { Box, Typography, Chip, Button, Card, CardContent, TextField, Alert, Tooltip, InputAdornment } from '@mui/material';
import { Check, AutoFixHigh } from '@mui/icons-material';
import { countryApi, productApi } from '../../services/api.service';

/**
 * "Countries & pricing" section of the admin product form (decision 0032).
 *
 * The admin picks the countries a product is SOLD in. Each selected country
 * gets a price row in that country's currency:
 *  - the default country (India) is the product's own base/sale price — shown
 *    read-only here and edited in the main pricing fields above (it is also
 *    the fallback for anything without an override);
 *  - every other country uses a ProductCountryPricing row (required).
 * Unselected countries -> product is NOT sold there (hidden from that
 * country's shop/search/product page; checkout rejects it). Disabled markets
 * are shown greyed and cannot be selected until enabled in Admin > Countries.
 */

export interface CountryDraft {
  countryId: string;
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  isEnabled: boolean;
  isDefault: boolean;
  selected: boolean;
  basePrice: string;
  salePrice: string;
}

export const flag = (code: string) =>
  String.fromCodePoint(...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0)));

/** Rough INR per 1 unit of currency — ONLY for the "estimate" helper. */
const INR_PER_UNIT: Record<string, number> = { USD: 83, AED: 22.6, AUD: 54, GBP: 105, EUR: 90 };

export function estimateFromInr(inr: number, currency: string): number | null {
  const rate = INR_PER_UNIT[currency];
  if (!rate || !Number.isFinite(inr) || inr <= 0) return null;
  const v = (inr / rate) * 1.25; // same 25% margin as the US preview seed
  return v >= 20 ? Math.round(v / 10) * 10 - 1 : Math.round(v * 100) / 100;
}

/** Fresh selection for a NEW product: default country only. */
export async function loadCountryDraftsForCreate(): Promise<CountryDraft[]> {
  const { data } = await countryApi.getAllAdmin();
  return ((data as any).data as any[]).map((c) => ({
    countryId: c.id, code: c.code, name: c.name, currency: c.currency, currencySymbol: c.currencySymbol,
    isEnabled: c.isEnabled, isDefault: c.isDefault,
    selected: c.isEnabled && c.isDefault, basePrice: '', salePrice: '',
  }));
}

/** Current state of an existing product (effective availability + prices). */
export async function loadCountryDraftsForProduct(productId: string): Promise<{ drafts: CountryDraft[]; legacy: boolean }> {
  const { data } = await productApi.getCountries(productId);
  const rows = (data as any).data as any[];
  const enabled = rows.filter((r) => r.isEnabled);
  return {
    // No explicit row for any enabled country = never configured: it is
    // currently sold everywhere by the no-row default.
    legacy: enabled.length > 0 && enabled.every((r) => !r.explicit),
    drafts: rows.map((r) => ({
      countryId: r.countryId, code: r.code, name: r.name, currency: r.currency, currencySymbol: r.currencySymbol,
      isEnabled: r.isEnabled, isDefault: r.isDefault,
      // A disabled market is only "on" if an admin explicitly set it so.
      selected: r.isEnabled ? r.isAvailable : r.explicit && r.isAvailable,
      basePrice: r.basePrice != null ? String(r.basePrice) : '',
      salePrice: r.salePrice != null ? String(r.salePrice) : '',
    })),
  };
}

/** Per-country error messages ('' key = section-level). */
export function validateCountryDrafts(drafts: CountryDraft[]): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!drafts.some((d) => d.selected && d.isEnabled)) errors[''] = 'Select at least one country — or deactivate the product to hide it everywhere.';
  for (const d of drafts) {
    if (!d.selected || d.isDefault) continue;
    const base = Number(d.basePrice);
    const sale = d.salePrice === '' ? null : Number(d.salePrice);
    if (d.basePrice === '' || !(base > 0)) errors[d.countryId] = `Enter a base price in ${d.currency} (greater than 0).`;
    else if (sale !== null && !(sale > 0)) errors[d.countryId] = 'Sale price must be greater than 0.';
    else if (sale !== null && sale >= base) errors[d.countryId] = 'Sale price must be lower than the base price.';
  }
  return errors;
}

export const toCountriesPayload = (drafts: CountryDraft[]) =>
  drafts.map((d) => ({
    countryId: d.countryId,
    isAvailable: d.selected,
    ...(!d.isDefault && d.selected && d.basePrice !== ''
      ? { basePrice: Number(d.basePrice), salePrice: d.salePrice === '' ? null : Number(d.salePrice) }
      : {}),
  }));

interface Props {
  drafts: CountryDraft[];
  onChange: (next: CountryDraft[]) => void;
  /** The product's own (default-country) price from the main form. */
  baseInr: string | number;
  saleInr: string | number;
  errors?: Record<string, string>;
  legacy?: boolean;
  mode: 'create' | 'edit';
}

export default function ProductCountriesSection({ drafts, onChange, baseInr, saleInr, errors = {}, legacy, mode }: Props) {
  const enabled = useMemo(() => drafts.filter((d) => d.isEnabled), [drafts]);
  const selected = drafts.filter((d) => d.selected && d.isEnabled);
  const patch = (id: string, p: Partial<CountryDraft>) => onChange(drafts.map((d) => (d.countryId === id ? { ...d, ...p } : d)));
  const allSelected = enabled.length > 0 && enabled.every((d) => d.selected);

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }} data-testid="countries-section">
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle2" fontWeight={700}>Countries &amp; pricing</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          Choose where this product is sold. It is hidden from every other country&apos;s shop, search and product page,
          and cannot be ordered there.
        </Typography>

        {mode === 'create' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            New products start in the default country only. Add more countries below and set a price in each currency.
          </Alert>
        )}
        {legacy && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This product has no saved country settings, so it currently sells in every enabled country. Saving stores
            the selection below explicitly.
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1 }}>
          <Button size="small" variant="outlined" disabled={allSelected || !enabled.length}
            onClick={() => onChange(drafts.map((d) => (d.isEnabled ? { ...d, selected: true } : d)))}>
            Select all
          </Button>
          <Button size="small" variant="text" disabled={!selected.length}
            onClick={() => onChange(drafts.map((d) => (d.isEnabled ? { ...d, selected: false } : d)))}>
            Clear
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
            Sold in {selected.length} of {enabled.length} enabled countr{enabled.length === 1 ? 'y' : 'ies'}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }} role="group" aria-label="Countries this product is sold in">
          {drafts.map((d) => {
            const chip = (
              <Chip
                key={d.countryId}
                clickable={d.isEnabled}
                disabled={!d.isEnabled}
                color={d.selected && d.isEnabled ? 'primary' : 'default'}
                variant={d.selected && d.isEnabled ? 'filled' : 'outlined'}
                icon={d.selected && d.isEnabled ? <Check /> : undefined}
                label={`${flag(d.code)} ${d.name}${d.isDefault ? ' (default)' : ''}${d.isEnabled ? '' : ' — disabled'}`}
                onClick={() => d.isEnabled && patch(d.countryId, { selected: !d.selected })}
                aria-pressed={d.selected && d.isEnabled}
              />
            );
            return d.isEnabled ? chip : (
              <Tooltip key={d.countryId} title="This market is disabled. Enable it in Admin > Countries to sell here."><span>{chip}</span></Tooltip>
            );
          })}
        </Box>

        {errors[''] && <Alert severity="error" sx={{ mb: 2 }}>{errors['']}</Alert>}

        {selected.map((d) => {
          const err = errors[d.countryId];
          const inr = Number(saleInr) > 0 ? Number(saleInr) : Number(baseInr);
          return (
            <Box key={d.countryId} sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'flex-start', py: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ minWidth: 150, pt: 1 }}>
                <Typography variant="body2" fontWeight={600}>{flag(d.code)} {d.name}</Typography>
                <Typography variant="caption" color="text.secondary">{d.currency}{d.isDefault ? ' · default & fallback' : ''}</Typography>
              </Box>
              {d.isDefault ? (
                <Typography variant="body2" color="text.secondary" sx={{ pt: 1, flex: 1, minWidth: 200 }}>
                  Uses the product price above: {d.currencySymbol}{baseInr || '—'}
                  {Number(saleInr) > 0 ? ` (sale ${d.currencySymbol}${saleInr})` : ''}
                </Typography>
              ) : (
                <>
                  <TextField size="small" type="number" label={`Base price (${d.currencySymbol})`} value={d.basePrice}
                    onChange={(e) => patch(d.countryId, { basePrice: e.target.value })}
                    error={!!err} sx={{ width: 170 }}
                    InputProps={{ startAdornment: <InputAdornment position="start">{d.currency}</InputAdornment> }} />
                  <TextField size="small" type="number" label={`Sale price (${d.currencySymbol})`} value={d.salePrice}
                    onChange={(e) => patch(d.countryId, { salePrice: e.target.value })}
                    error={!!err} sx={{ width: 170 }} />
                  <Tooltip title="Rough conversion of the INR price (+25% margin). An estimate only — review before saving.">
                    <span>
                      <Button size="small" startIcon={<AutoFixHigh />} sx={{ mt: 0.5 }}
                        disabled={!(inr > 0) || estimateFromInr(inr, d.currency) === null}
                        onClick={() => {
                          const b = estimateFromInr(Number(baseInr), d.currency);
                          const s = Number(saleInr) > 0 ? estimateFromInr(Number(saleInr), d.currency) : null;
                          patch(d.countryId, { basePrice: b != null ? String(b) : d.basePrice, salePrice: s != null && b != null && s < b ? String(s) : '' });
                        }}>
                        Suggest from INR (estimate)
                      </Button>
                    </span>
                  </Tooltip>
                  {err && <Typography variant="caption" color="error" sx={{ width: '100%' }}>{err}</Typography>}
                </>
              )}
            </Box>
          );
        })}
      </CardContent>
    </Card>
  );
}
