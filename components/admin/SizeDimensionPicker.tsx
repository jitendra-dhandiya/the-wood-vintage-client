'use client';
import { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Typography, TextField, Button, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { Add } from '@mui/icons-material';
import {
  type SizeFamily, type Unit, FAMILY_LABELS, presetsFor, buildSizeLabel, validateDimInputs,
  alternateUnits, parseSizeList, normaliseSizeLabel, MAX_SIZE_LABEL,
} from '../../lib/handicraftSize';

interface Props {
  /** Preset family, normally derived from the product's category. */
  family: SizeFamily;
  onFamilyChange: (f: SizeFamily) => void;
  /** Labels the admin picked or built. The caller decides what "add" means. */
  onPick: (labels: string[]) => void;
  /** Labels already on the product, so their chips read as added. */
  existing?: string[];
  /** Compact single-choice use (edit dialog): chips fill one field. */
  compact?: boolean;
}

const FAMILIES = Object.keys(FAMILY_LABELS) as SizeFamily[];
const chipSx = { fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' } as const;

/**
 * One control for choosing "Size / Dimensions": category-aware preset chips,
 * one-click sets, a free-text list, and a custom L x W x H builder with a cm/in
 * toggle and a live preview of the label that will be saved (decision 0039).
 */
export default function SizeDimensionPicker({ family, onFamilyChange, onPick, existing = [], compact }: Props) {
  const [unit, setUnit] = useState<Unit>('cm');
  const [name, setName] = useState('');
  const [dims, setDims] = useState({ l: '', w: '', h: '' });
  const [round, setRound] = useState(false);
  const [weight, setWeight] = useState('');
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);

  const have = useMemo(() => new Set(existing.map(e => e.toLowerCase())), [existing]);
  const sections = presetsFor(family, unit);

  // Diameter mode only needs one measurement.
  useEffect(() => { if (round) setDims(d => ({ l: d.l, w: '', h: '' })); }, [round]);

  const error = validateDimInputs(round ? { l: dims.l } : dims, unit)
    || (weight !== '' && !(Number(weight) > 0 && Number(weight) < 5000) ? 'Weight must be a positive number of kg' : '');

  const values = (round ? [dims.l] : [dims.l, dims.w, dims.h]).filter(v => v !== '' && Number(v) > 0).map(Number);
  const label = buildSizeLabel({
    name,
    dims: values.length ? { values, unit, round: round && values.length === 1 } : null,
    weightKg: weight ? Number(weight) : null,
  });
  const tooLong = label.length > MAX_SIZE_LABEL;
  const canAdd = !!label && !error && !tooLong;
  const alt = values.length ? alternateUnits(label) : null;

  const add = () => {
    setTouched(true);
    if (!canAdd) return;
    onPick([label]);
    setName(''); setDims({ l: '', w: '', h: '' }); setWeight(''); setTouched(false);
  };

  const dimField = (key: 'l' | 'w' | 'h', lbl: string) => (
    <TextField
      label={lbl} size="small" type="number" value={dims[key]}
      disabled={round && key !== 'l'}
      onChange={e => setDims(d => ({ ...d, [key]: e.target.value }))}
      inputProps={{ min: 0, step: 0.1, 'aria-label': `${lbl} in ${unit}` }}
      sx={{ width: { xs: '30%', sm: 92 }, flex: { xs: '1 1 28%', sm: '0 0 auto' } }}
    />
  );

  return (
    <Box>
      {!compact && (
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', mb: 1.25 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#888', mr: 0.5 }}>PRODUCT TYPE:</Typography>
          {FAMILIES.map(f => (
            <Chip
              key={f} size="small" label={FAMILY_LABELS[f]} onClick={() => onFamilyChange(f)}
              color={f === family ? 'primary' : 'default'} variant={f === family ? 'filled' : 'outlined'}
              sx={{ ...chipSx, ...(f === family && { bgcolor: '#3B2314', '&:hover': { bgcolor: '#3B2314' } }) }}
            />
          ))}
        </Box>
      )}
      {compact && (
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1 }}>
          {FAMILIES.map(f => (
            <Chip key={f} size="small" label={FAMILY_LABELS[f]} onClick={() => onFamilyChange(f)}
              variant={f === family ? 'filled' : 'outlined'}
              sx={{ ...chipSx, ...(f === family && { bgcolor: '#3B2314', color: '#fff', '&:hover': { bgcolor: '#3B2314' } }) }} />
          ))}
        </Box>
      )}

      {sections.map(sec => (
        <Box key={sec.title} sx={{ mb: 1.25 }}>
          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, color: '#888', mb: 0.5 }}>
            {sec.title.toUpperCase()}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {sec.items.map(item => {
              const added = have.has(item.toLowerCase());
              const hint = alternateUnits(item);
              return (
                <Tooltip key={item} title={hint || ''} disableHoverListener={!hint} arrow>
                  <Chip
                    size="small" label={`${added ? '' : '+ '}${item}`} onClick={() => onPick([item])}
                    variant={added ? 'filled' : 'outlined'}
                    sx={{ ...chipSx, ...(added && { bgcolor: '#EFE3D0', borderColor: '#A0693A' }) }}
                  />
                </Tooltip>
              );
            })}
            {(sec.sets || []).map(s => (
              <Chip
                key={s.label} size="small" label={`Add set: ${s.label}`} onClick={() => onPick(s.items)}
                sx={{ ...chipSx, bgcolor: '#3B2314', color: '#fff', '&:hover': { bgcolor: '#5A3D2B' } }}
              />
            ))}
          </Box>
        </Box>
      ))}

      {/* Custom builder */}
      <Box sx={{ mt: 1.5, p: 1.5, border: '1px dashed', borderColor: 'divider', borderRadius: 1, bgcolor: '#fff' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, gap: 1, flexWrap: 'wrap' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#888' }}>CUSTOM SIZE / DIMENSIONS</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ToggleButtonGroup
              size="small" exclusive value={round ? 'round' : 'box'} aria-label="Shape"
              onChange={(_, v) => v && setRound(v === 'round')}
            >
              <ToggleButton value="box" sx={{ py: 0.25, px: 1, fontSize: '0.7rem' }}>L × W × H</ToggleButton>
              <ToggleButton value="round" sx={{ py: 0.25, px: 1, fontSize: '0.7rem' }}>Ø Diameter</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              size="small" exclusive value={unit} aria-label="Unit"
              onChange={(_, v) => v && setUnit(v)}
            >
              <ToggleButton value="cm" sx={{ py: 0.25, px: 1, fontSize: '0.7rem' }}>cm</ToggleButton>
              <ToggleButton value="in" sx={{ py: 0.25, px: 1, fontSize: '0.7rem' }}>in</ToggleButton>
              <ToggleButton value="ft" sx={{ py: 0.25, px: 1, fontSize: '0.7rem' }}>ft</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <TextField
            label="Name (optional)" size="small" placeholder="e.g. 4-Seater, Large" value={name}
            onChange={e => setName(e.target.value)} sx={{ flex: { xs: '1 1 100%', sm: '1 1 160px' }, minWidth: 140 }}
          />
          {round ? dimField('l', 'Diameter') : (<>{dimField('l', 'Length')}{dimField('w', 'Width')}{dimField('h', 'Height')}</>)}
          <TextField
            label="Weight kg" size="small" type="number" value={weight} onChange={e => setWeight(e.target.value)}
            inputProps={{ min: 0, step: 0.1 }} sx={{ width: { xs: '40%', sm: 100 } }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ fontWeight: 700, color: '#3B2314' }} aria-live="polite">
            {label ? <>Preview: {label}</> : <span style={{ color: '#999', fontWeight: 400 }}>Preview appears as you type</span>}
          </Typography>
          {alt && <Typography variant="caption" color="text.secondary">({alt})</Typography>}
          <Box sx={{ flex: 1 }} />
          <Button size="small" variant="contained" startIcon={<Add />} onClick={add} disabled={!canAdd && touched}
            sx={{ bgcolor: '#3B2314', '&:hover': { bgcolor: '#333' } }}>
            {compact ? 'Use this' : 'Add size'}
          </Button>
        </Box>
        {(error || tooLong || (touched && !label)) && (
          <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
            {error || (tooLong ? `Label is too long (max ${MAX_SIZE_LABEL} characters)` : 'Enter a name or at least one dimension')}
          </Typography>
        )}
      </Box>

      {/* Free text */}
      <TextField
        size="small" fullWidth sx={{ mt: 1.25 }} value={text}
        label="Or type sizes" placeholder='e.g. Queen (5×6.5 ft), Set of 4 — press Enter'
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          const parsed = parseSizeList(text).map(normaliseSizeLabel).filter(Boolean);
          if (!parsed.length) return;
          onPick(parsed);
          setText('');
        }}
      />
    </Box>
  );
}
