'use client';
import { useState, useEffect } from 'react';
import { Box, Typography, Button, Slider, Divider, Chip } from '@mui/material';
import { PRODUCT_SIZES, PRODUCT_COLORS } from '../../constants';


import type { Material, Style, Room } from '../../types';

/**
 * Shared filter sidebar/drawer content — Price, Size, Color, and the Phase 2
 * handicraft taxonomy (Material/Style/Room). Used by both `/shop` (browsing)
 * and `/search` (Phase 4 §6) so search results get the same facets as
 * browsing rather than a narrower, duplicated filter UI.
 *
 * Defined at module level in each caller — stable identity, never remounted.
 * The price slider keeps its own local state for smooth drag; it only calls
 * `onPriceCommit` when the thumb is released (`onChangeCommitted`).
 */
export interface FilterPanelProps {
  isMobile: boolean;
  priceRange: number[];          // committed value (from parent)
  selectedSizes: string[];
  selectedColors: string[];
  materials: Material[];
  styles: Style[];
  rooms: Room[];
  selectedMaterial: string;
  selectedStyle: string;
  selectedRoom: string;
  activeFilterCount: number;
  onPriceCommit: (v: number[]) => void;
  onToggleSize: (s: string) => void;
  onToggleColor: (c: string) => void;
  onSelectMaterial: (slug: string) => void;
  onSelectStyle: (slug: string) => void;
  onSelectRoom: (slug: string) => void;
  onClear: () => void;
}

export function FilterPanel({
  isMobile, priceRange, selectedSizes, selectedColors,
  materials, styles, rooms, selectedMaterial, selectedStyle, selectedRoom,
  activeFilterCount, onPriceCommit, onToggleSize, onToggleColor,
  onSelectMaterial, onSelectStyle, onSelectRoom, onClear,
}: FilterPanelProps) {
  // Local state drives slider visuals smoothly — no API call on every drag
  const [localPrice, setLocalPrice] = useState<number[]>(priceRange);

  // Sync when parent resets filters (e.g. "Clear All")
  useEffect(() => { setLocalPrice(priceRange); }, [priceRange]);

  return (
    <Box sx={{ p: isMobile ? 2 : 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Filters</Typography>
        {activeFilterCount > 0 && (
          <Button size="small" onClick={onClear} sx={{ color: '#A0693A' }}>Clear All</Button>
        )}
      </Box>

      {/* Price range */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Price Range</Typography>
      <Box sx={{ px: 1, mb: 2 }}>
        <Slider
          value={localPrice}
          onChange={(_, v) => setLocalPrice(v as number[])}
          onChangeCommitted={(_, v) => onPriceCommit(v as number[])}
          min={PRICE_RANGE[0]} max={PRICE_RANGE[1]} step={PRICE_STEP}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => `₹${v.toLocaleString('en-IN')}`}
          sx={{ color: '#3B2314' }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">₹{localPrice[0].toLocaleString('en-IN')}</Typography>
          <Typography variant="caption">₹{localPrice[1].toLocaleString('en-IN')}</Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Sizes — furniture rarely has apparel sizes; the section only renders if a list is configured. */}
      {PRODUCT_SIZES.length > 0 && (<>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Size</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
        {PRODUCT_SIZES.map((size) => (
          <Chip
            key={size} label={size} size="small"
            onClick={() => onToggleSize(size)}
            variant={selectedSizes.includes(size) ? 'filled' : 'outlined'}
            sx={{
              cursor: 'pointer',
              ...(selectedSizes.includes(size) && { bgcolor: '#3B2314', color: 'white', '&:hover': { bgcolor: '#5A3D2B' } }),
            }}
          />
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />
      </>)}

      {/* Wood finishes */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Finish</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
        {PRODUCT_COLORS.map((color) => (
          <Chip
            key={color} label={color} size="small"
            onClick={() => onToggleColor(color)}
            variant={selectedColors.includes(color) ? 'filled' : 'outlined'}
            sx={{
              cursor: 'pointer',
              ...(selectedColors.includes(color) && { bgcolor: '#3B2314', color: 'white', '&:hover': { bgcolor: '#5A3D2B' } }),
            }}
          />
        ))}
      </Box>

      {/* Material / Style / Room — Phase 2 handicraft taxonomy. Single-select
          per facet (a product carries one of each, not many), so these
          render as a toggleable chip row exactly like Size/Color above but
          with click-to-clear on the active one instead of multi-select. Each
          section is absent entirely when the taxonomy list hasn't loaded or
          is empty, rather than showing an empty heading. */}
      {materials.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Material</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {materials.map((m) => (
              <Chip
                key={m.id} label={m.name} size="small"
                onClick={() => onSelectMaterial(m.slug)}
                variant={selectedMaterial === m.slug ? 'filled' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  ...(selectedMaterial === m.slug && { bgcolor: '#3B2314', color: 'white', '&:hover': { bgcolor: '#5A3D2B' } }),
                }}
              />
            ))}
          </Box>
        </>
      )}

      {styles.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Style</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {styles.map((s) => (
              <Chip
                key={s.id} label={s.name} size="small"
                onClick={() => onSelectStyle(s.slug)}
                variant={selectedStyle === s.slug ? 'filled' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  ...(selectedStyle === s.slug && { bgcolor: '#3B2314', color: 'white', '&:hover': { bgcolor: '#5A3D2B' } }),
                }}
              />
            ))}
          </Box>
        </>
      )}

      {rooms.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Room</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {rooms.map((r) => (
              <Chip
                key={r.id} label={r.name} size="small"
                onClick={() => onSelectRoom(r.slug)}
                variant={selectedRoom === r.slug ? 'filled' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  ...(selectedRoom === r.slug && { bgcolor: '#3B2314', color: 'white', '&:hover': { bgcolor: '#5A3D2B' } }),
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

/** Shop's price slider bounds — shared so `/search` matches exactly. */
export const PRICE_RANGE = [0, 100000];
const PRICE_STEP = 1000;
