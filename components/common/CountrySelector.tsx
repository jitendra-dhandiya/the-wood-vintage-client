'use client';
/**
 * Country switcher — the mechanism the spec asks for (see "Country selector
 * component" in country-architecture-spec.md's Frontend changes section), not
 * a storefront redesign. A compact MUI `Select` that lists the enabled
 * markets from `CountryContext` (backed by `GET /countries`) and writes the
 * `wv_country` cookie through `setCountry` on change.
 *
 * Renders nothing while there is only one (or zero) enabled market — a
 * one-item "switcher" has nothing to switch to. Today that is the real state
 * (only India is enabled), so this is inert until a second market is turned
 * on in admin, exactly as intended.
 */
import { Box, FormControl, Select, MenuItem, type SelectChangeEvent } from '@mui/material';
import { Public } from '@mui/icons-material';
import { useCountry } from '../../contexts/CountryContext';

interface Props {
  /** Slightly larger, labelled variant for the mobile drawer; compact icon-only for the desktop bar. */
  variant?: 'compact' | 'full';
}

export default function CountrySelector({ variant = 'compact' }: Props) {
  const { country, countries, setCountry, loading } = useCountry();

  if (loading || countries.length < 2) return null;

  const handleChange = (e: SelectChangeEvent) => setCountry(e.target.value);
  // Falls back to the first enabled country only for the controlled Select's
  // display value — does not persist or otherwise change the resolved
  // context state, which stays whatever CountryContext resolved (possibly
  // null, per its documented tier-4 fallback).
  const value = country && countries.some((c) => c.code === country) ? country : '';

  return (
    <FormControl size="small" sx={{ minWidth: variant === 'full' ? 160 : 92 }}>
      <Select
        value={value}
        onChange={handleChange}
        displayEmpty
        variant="standard"
        disableUnderline
        renderValue={(v) => {
          const selected = countries.find((c) => c.code === v);
          return (
            <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.75rem', fontWeight: 600 }}>
              <Public sx={{ fontSize: 16, color: '#888' }} />
              {selected ? `${selected.code} · ${selected.currencySymbol}` : 'Region'}
            </Box>
          );
        }}
        sx={{
          fontSize: '0.75rem',
          '& .MuiSelect-select': { py: 0.5, display: 'flex', alignItems: 'center' },
        }}
        aria-label="Select your country"
      >
        {countries.map((c) => (
          <MenuItem key={c.id} value={c.code} sx={{ fontSize: '0.85rem' }}>
            {c.name} ({c.currency})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
