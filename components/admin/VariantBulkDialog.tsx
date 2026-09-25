'use client';
import { useMemo, useState } from 'react';
import {
  Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Typography,
} from '@mui/material';
import SizeDimensionPicker from './SizeDimensionPicker';
import { FINISH_SUGGESTIONS, sortSizes, type SizeFamily } from '../../lib/handicraftSize';
import { SIZE_LABEL, FINISH_LABEL } from '../../lib/variantLabel';

export interface BulkVariant { size: string; color: string; stockQuantity: number }

interface Props {
  open: boolean;
  onClose: () => void;
  family: SizeFamily;
  onFamilyChange: (f: SizeFamily) => void;
  /** Variants the product already has, so existing combinations are skipped. */
  existing: { size?: string | null; color?: string | null }[];
  onCreate: (items: BulkVariant[]) => Promise<void>;
}

const key = (size: string, color: string) => `${size.trim().toLowerCase()}|${color.trim().toLowerCase()}`;

/** Generate the sizes x finishes matrix for an existing product in one go. */
export default function VariantBulkDialog({ open, onClose, family, onFamilyChange, existing, onCreate }: Props) {
  const [sizes, setSizes] = useState<string[]>([]);
  const [finishes, setFinishes] = useState<string[]>([]);
  const [customFinish, setCustomFinish] = useState('');
  const [stock, setStock] = useState(2);
  const [busy, setBusy] = useState(false);

  const have = useMemo(() => new Set(existing.map(v => key(v.size || '', v.color || ''))), [existing]);
  // No finish chosen means one row per size with a blank finish.
  const finishList = finishes.length ? finishes : [''];
  const combos = useMemo(
    () => sortSizes(sizes).flatMap(size => finishList.map(color => ({ size, color, stockQuantity: stock }))),
    [sizes, finishList, stock]
  );
  const fresh = combos.filter(c => !have.has(key(c.size, c.color)));

  const toggleFinish = (f: string) =>
    setFinishes(prev => (prev.some(x => x.toLowerCase() === f.toLowerCase()) ? prev.filter(x => x.toLowerCase() !== f.toLowerCase()) : [...prev, f]));

  const submit = async () => {
    if (!fresh.length || busy) return;
    setBusy(true);
    try {
      await onCreate(fresh);
      setSizes([]); setFinishes([]);
      onClose();
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={open} onClose={() => !busy && onClose()} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Bulk add variants</DialogTitle>
      <DialogContent>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          Choose {SIZE_LABEL} and {FINISH_LABEL} options; every combination is created (existing ones are skipped).
        </Typography>
        <SizeDimensionPicker
          family={family} onFamilyChange={onFamilyChange} existing={sizes}
          onPick={labels => setSizes(prev => [...new Set([...prev, ...labels])])}
        />

        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#888', mt: 2, mb: 0.5 }}>
          SELECTED SIZES ({sizes.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', minHeight: 28 }}>
          {sortSizes(sizes).map(s => (
            <Chip key={s} size="small" label={s} onDelete={() => setSizes(prev => prev.filter(x => x !== s))} />
          ))}
          {!sizes.length && <Typography variant="caption" color="text.secondary">None yet. Pick from above.</Typography>}
        </Box>

        <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#888', mt: 2, mb: 0.5 }}>
          {FINISH_LABEL.toUpperCase()}ES (optional)
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center' }}>
          {[...FINISH_SUGGESTIONS, ...finishes.filter(f => !FINISH_SUGGESTIONS.some(s => s.toLowerCase() === f.toLowerCase()))].map(f => {
            const on = finishes.some(x => x.toLowerCase() === f.toLowerCase());
            return (
              <Chip key={f} size="small" label={f} onClick={() => toggleFinish(f)} variant={on ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700, ...(on && { bgcolor: '#3B2314', color: '#fff', '&:hover': { bgcolor: '#3B2314' } }) }} />
            );
          })}
          <TextField
            size="small" placeholder="Custom finish + Enter" value={customFinish} sx={{ width: 190 }}
            onChange={e => setCustomFinish(e.target.value)}
            onKeyDown={e => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              const v = customFinish.trim().slice(0, 40);
              if (v && !finishes.some(x => x.toLowerCase() === v.toLowerCase())) setFinishes(prev => [...prev, v]);
              setCustomFinish('');
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2, flexWrap: 'wrap' }}>
          <TextField label="Stock for each" type="number" size="small" sx={{ width: 140 }} value={stock}
            onChange={e => setStock(Math.max(0, Math.trunc(Number(e.target.value)) || 0))} inputProps={{ min: 0 }} />
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {fresh.length} new variant{fresh.length === 1 ? '' : 's'}
            {combos.length > fresh.length ? ` (${combos.length - fresh.length} already exist, skipped)` : ''}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={!fresh.length || busy}
          sx={{ bgcolor: '#3B2314', '&:hover': { bgcolor: '#333' } }}>
          {busy ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : `Create ${fresh.length}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
