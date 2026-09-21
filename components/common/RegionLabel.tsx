'use client';
/**
 * Read-only market label ("Shipping to India · ₹"). Replaces the former country
 * switcher: the market is locked to the visitor's location (decision 0036), so
 * this is information, not a control — no menu, no click handler.
 */
import { Box } from '@mui/material';
import { Public } from '@mui/icons-material';
import { useCountry } from '../../contexts/CountryContext';

interface Props {
  /** Icon + code only on the desktop bar; full sentence in the mobile drawer. */
  variant?: 'compact' | 'full';
}

export default function RegionLabel({ variant = 'compact' }: Props) {
  const { countryData, loading } = useCountry();
  if (loading || !countryData) return null;

  const text = variant === 'full'
    ? `Shipping to ${countryData.name} · ${countryData.currencySymbol}`
    : `${countryData.code} · ${countryData.currencySymbol}`;

  return (
    <Box
      component="span"
      data-testid="region-label"
      title={`Shipping to ${countryData.name}`}
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1,
        fontSize: '0.75rem', fontWeight: 600, color: 'text.secondary', cursor: 'default', userSelect: 'none',
      }}
    >
      <Public sx={{ fontSize: 16, color: '#888' }} />
      {text}
    </Box>
  );
}
