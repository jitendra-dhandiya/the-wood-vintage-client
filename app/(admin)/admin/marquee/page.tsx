'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Card, CardContent, TextField, Switch,
  FormControlLabel, Divider, Stack, IconButton, Tooltip, Chip,
  CircularProgress, Alert, Snackbar, Slider, Paper,
} from '@mui/material';
import {
  AddCircleOutline, RemoveCircleOutline, Save, DragIndicator,
  Preview, Campaign, Speed, Palette, Article,
} from '@mui/icons-material';
import api from '../../../../lib/axios';

// ── Types ──────────────────────────────────────────────────────────
interface MarqueeItem {
  text: string;
  icon: string;
  link: string;
}

interface MarqueeConfig {
  items: MarqueeItem[];
  speed: number;
  variant: 'dark' | 'light' | 'gold' | 'accent';
  separatorStyle: 'diamond' | 'dot' | 'star' | 'slash' | 'line' | 'none';
  uppercase: boolean;
  pauseOnHover: boolean;
  fontSize: 'xs' | 'sm' | 'md';
}

// ── Constants ──────────────────────────────────────────────────────
const SEPARATOR_OPTIONS = [
  { value: 'diamond', label: '◆ Diamond', char: '◆' },
  { value: 'dot',     label: '• Dot',     char: '•' },
  { value: 'star',    label: '★ Star',    char: '★' },
  { value: 'slash',   label: '/ Slash',   char: '/' },
  { value: 'line',    label: '| Line',    char: '|' },
  { value: 'none',    label: 'None',      char: '' },
];

const VARIANT_OPTIONS = [
  { value: 'dark',   label: 'Dark',   bg: '#1a1a1a', text: '#ffffff', accent: '#c9a84c' },
  { value: 'light',  label: 'Light',  bg: '#f5f5f5', text: '#1a1a1a', accent: '#c9a84c' },
  { value: 'gold',   label: 'Gold',   bg: '#c9a84c', text: '#1a1a1a', accent: '#1a1a1a' },
  { value: 'accent', label: 'Accent', bg: '#0d0d0d', text: '#c9a84c', accent: '#ffffff' },
];

const FONT_SIZE_OPTIONS = [
  { value: 'xs', label: 'XS' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'MD' },
];

const DEFAULT_CONFIG: MarqueeConfig = {
  items: [
    { text: 'Free Shipping on Orders Above ₹999', icon: '🚚', link: '' },
    { text: 'Easy Size Exchange', icon: '↩', link: '' },
    { text: 'New Arrivals Every Week', icon: '✨', link: '' },
    { text: 'Exclusive Offers for Members', icon: '🎁', link: '' },
    { text: 'Secure Payments — UPI · Cards · COD', icon: '🔒', link: '' },
  ],
  speed: 35,
  variant: 'dark',
  separatorStyle: 'diamond',
  uppercase: true,
  pauseOnHover: true,
  fontSize: 'sm',
};

// ── Live animated preview ──────────────────────────────────────────
function LivePreview({ config }: { config: MarqueeConfig }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const v = VARIANT_OPTIONS.find(x => x.value === config.variant) || VARIANT_OPTIONS[0];
  const sep = SEPARATOR_OPTIONS.find(x => x.value === config.separatorStyle)?.char || '◆';
  const items = [...config.items, ...config.items]; // doubled for seamless loop

  useEffect(() => {
    if (!config.pauseOnHover) return;
    const el = trackRef.current;
    if (!el) return;
    const pause = () => { el.style.animationPlayState = 'paused'; };
    const play  = () => { el.style.animationPlayState = 'running'; };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', play);
    return () => {
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', play);
    };
  }, [config.pauseOnHover]);

  const fontSize = config.fontSize === 'xs' ? '0.65rem' : config.fontSize === 'md' ? '0.8rem' : '0.72rem';

  return (
    <Box sx={{
      bgcolor: v.bg,
      overflow: 'hidden',
      position: 'relative',
      borderRadius: '10px',
      py: 0,
      border: `1px solid ${v.accent}22`,
    }}>
      {/* Fade masks */}
      <Box sx={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 60,
        background: `linear-gradient(to right, ${v.bg}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 60,
        background: `linear-gradient(to left, ${v.bg}, transparent)`, zIndex: 2, pointerEvents: 'none' }} />

      <Box
        ref={trackRef}
        sx={{
          display: 'flex', alignItems: 'center', width: 'max-content',
          animation: `marquee-scroll-admin ${config.speed}s linear infinite`,
          '@keyframes marquee-scroll-admin': {
            from: { transform: 'translateX(0)' },
            to:   { transform: 'translateX(-50%)' },
          },
          py: 1.25, gap: 0,
        }}
      >
        {items.map((item, i) => (
          <Box key={i} sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, whiteSpace: 'nowrap', px: 3 }}>
            {item.icon && <span style={{ fontSize: '0.85rem' }}>{item.icon}</span>}
            <span style={{
              color: v.text, fontSize, fontWeight: 600,
              letterSpacing: config.uppercase ? '0.09em' : '0.03em',
              textTransform: config.uppercase ? 'uppercase' : 'none',
            }}>
              {item.text}
            </span>
            {sep && (
              <span style={{ color: v.accent, fontWeight: 700, marginLeft: 8, marginRight: 0 }}>
                {sep}
              </span>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function MarqueeAdminPage() {
  const [sectionId, setSectionId] = useState<string | null>(null);
  const [config, setConfig]       = useState<MarqueeConfig>(DEFAULT_CONFIG);
  const [isActive, setIsActive]   = useState(true);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [snack, setSnack]         = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const [dragIdx, setDragIdx]     = useState<number | null>(null);

  // Fetch existing MARQUEE section from homepage
  useEffect(() => {
    api.get('/homepage/admin').then(({ data }) => {
      const sections: any[] = data.data || [];
      const marquee = sections.find((s: any) => s.type === 'MARQUEE');
      if (marquee) {
        setSectionId(marquee.id);
        setIsActive(marquee.isActive);
        if (marquee.config && typeof marquee.config === 'object') {
          setConfig({ ...DEFAULT_CONFIG, ...marquee.config });
        }
      }
    }).catch(() => {
      setSnack({ msg: 'Failed to load marquee data', sev: 'error' });
    }).finally(() => setLoading(false));
  }, []);

  const update = (patch: Partial<MarqueeConfig>) => setConfig(prev => ({ ...prev, ...patch }));

  const updateItem = (i: number, patch: Partial<MarqueeItem>) => {
    update({ items: config.items.map((it, idx) => idx === i ? { ...it, ...patch } : it) });
  };

  const addItem = () => update({ items: [...config.items, { text: 'New announcement', icon: '✨', link: '' }] });

  const removeItem = (i: number) => {
    if (config.items.length <= 1) return;
    update({ items: config.items.filter((_, idx) => idx !== i) });
  };

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= config.items.length) return;
    const next = [...config.items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    update({ items: next });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (sectionId) {
        await api.put(`/homepage/${sectionId}`, { config, isActive });
        setSnack({ msg: 'Marquee saved!', sev: 'success' });
      } else {
        // Create a new MARQUEE section
        const { data } = await api.post('/homepage', {
          type: 'MARQUEE',
          title: 'Marquee',
          isActive,
          sortOrder: 0,
          config,
        });
        setSectionId(data.data?.id || null);
        setSnack({ msg: 'Marquee created and saved!', sev: 'success' });
      }
    } catch {
      setSnack({ msg: 'Failed to save', sev: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedVariant = VARIANT_OPTIONS.find(v => v.value === config.variant) || VARIANT_OPTIONS[0];

  return (
    <Box>
      {/* ── Header ───────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            bgcolor: '#1a1a1a', borderRadius: '10px', p: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Campaign sx={{ color: '#c9a84c', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800}>Marquee / Ticker</Typography>
            <Typography variant="caption" color="text.secondary">
              Scrolling announcement strip shown on the homepage
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                sx={{ '& .MuiSwitch-thumb': { bgcolor: isActive ? '#2e7d32' : undefined } }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={700}>{isActive ? 'Live on site' : 'Hidden'}</Typography>
                <Typography variant="caption" color="text.secondary">{isActive ? 'Visible to shoppers' : 'Draft mode'}</Typography>
              </Box>
            }
          />
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <Save />}
            onClick={save}
            disabled={saving}
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, fontWeight: 700, borderRadius: 2, px: 3 }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {/* ── Live Preview ─────────────────────────────────────────── */}
      <Card elevation={0} sx={{ border: '1px solid #e8e8e8', borderRadius: 2, mb: 3, overflow: 'visible' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Preview sx={{ fontSize: 18, color: '#c9a84c' }} />
            <Typography variant="caption" fontWeight={800} sx={{ letterSpacing: '0.1em', color: '#555' }}>
              LIVE PREVIEW
            </Typography>
            <Chip label={`${config.items.length} items`} size="small" sx={{ ml: 'auto', fontSize: '0.65rem' }} />
          </Box>
          <LivePreview config={config} />
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: 3 }}>

        {/* ── Left: Messages ───────────────────────────────────── */}
        <Card elevation={0} sx={{ border: '1px solid #e8e8e8', borderRadius: 2 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Article sx={{ fontSize: 18, color: '#c9a84c' }} />
                <Typography variant="subtitle2" fontWeight={800}>
                  MESSAGES
                </Typography>
                <Chip label={config.items.length} size="small" sx={{ bgcolor: '#1a1a1a', color: 'white', fontSize: '0.65rem', height: 20 }} />
              </Box>
              <Button
                size="small"
                variant="outlined"
                startIcon={<AddCircleOutline sx={{ fontSize: 16 }} />}
                onClick={addItem}
                sx={{ fontSize: '0.75rem', fontWeight: 700, borderColor: '#1a1a1a', color: '#1a1a1a',
                  '&:hover': { bgcolor: '#1a1a1a', color: 'white' }, borderRadius: 1.5 }}
              >
                Add Message
              </Button>
            </Box>

            <Stack spacing={1.5}>
              {config.items.map((item, i) => (
                <Paper
                  key={i}
                  elevation={0}
                  sx={{
                    border: '1.5px solid',
                    borderColor: dragIdx === i ? '#c9a84c' : '#f0f0f0',
                    borderRadius: 2, p: 1.75,
                    bgcolor: '#fafafa',
                    transition: 'border-color 0.15s',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    {/* Drag handle + order */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5, gap: 0.5 }}>
                      <DragIndicator sx={{ fontSize: 18, color: '#ccc', cursor: 'grab' }} />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Tooltip title="Move up">
                          <IconButton size="small" onClick={() => moveItem(i, i - 1)} disabled={i === 0}
                            sx={{ p: 0.25, color: '#aaa', '&:not(:disabled):hover': { color: '#1a1a1a' } }}>
                            <Box sx={{ fontSize: 12, lineHeight: 1 }}>▲</Box>
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Move down">
                          <IconButton size="small" onClick={() => moveItem(i, i + 1)} disabled={i === config.items.length - 1}
                            sx={{ p: 0.25, color: '#aaa', '&:not(:disabled):hover': { color: '#1a1a1a' } }}>
                            <Box sx={{ fontSize: 12, lineHeight: 1 }}>▼</Box>
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Item number */}
                    <Box sx={{
                      width: 24, height: 24, borderRadius: '50%', bgcolor: '#1a1a1a',
                      color: 'white', fontSize: '0.65rem', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.5,
                    }}>
                      {i + 1}
                    </Box>

                    {/* Fields */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: 1 }}>
                        <TextField
                          value={item.icon}
                          onChange={e => updateItem(i, { icon: e.target.value })}
                          size="small"
                          placeholder="🚚"
                          label="Icon"
                          inputProps={{ style: { textAlign: 'center', fontSize: '1.1rem', padding: '6px 4px' } }}
                        />
                        <TextField
                          value={item.text}
                          onChange={e => updateItem(i, { text: e.target.value })}
                          size="small"
                          label="Message *"
                          placeholder="Free shipping on orders above ₹999"
                          fullWidth
                        />
                      </Box>
                      <TextField
                        value={item.link}
                        onChange={e => updateItem(i, { link: e.target.value })}
                        size="small"
                        label="Link URL (optional)"
                        placeholder="https://... or /shop"
                        fullWidth
                        sx={{ '& input': { fontSize: '0.8rem' } }}
                      />
                    </Box>

                    {/* Remove */}
                    <Tooltip title="Remove">
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => removeItem(i)}
                          disabled={config.items.length <= 1}
                          sx={{ color: '#ef5350', mt: 0.5, '&:disabled': { opacity: 0.3 } }}
                        >
                          <RemoveCircleOutline sx={{ fontSize: 20 }} />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                </Paper>
              ))}
            </Stack>

            <Button
              fullWidth
              variant="outlined"
              startIcon={<AddCircleOutline />}
              onClick={addItem}
              sx={{ mt: 2, borderStyle: 'dashed', borderColor: '#ddd', color: '#888', fontWeight: 600,
                '&:hover': { borderColor: '#1a1a1a', color: '#1a1a1a', borderStyle: 'dashed' } }}
            >
              Add Message
            </Button>
          </CardContent>
        </Card>

        {/* ── Right: Appearance ────────────────────────────────── */}
        <Stack spacing={3}>

          {/* Colour Theme */}
          <Card elevation={0} sx={{ border: '1px solid #e8e8e8', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Palette sx={{ fontSize: 18, color: '#c9a84c' }} />
                <Typography variant="subtitle2" fontWeight={800}>COLOUR THEME</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                {VARIANT_OPTIONS.map(v => (
                  <Box
                    key={v.value}
                    onClick={() => update({ variant: v.value as MarqueeConfig['variant'] })}
                    sx={{
                      p: 1.5, borderRadius: 1.5, cursor: 'pointer',
                      bgcolor: v.bg, color: v.text,
                      border: '2.5px solid',
                      borderColor: config.variant === v.value ? v.accent : 'transparent',
                      boxShadow: config.variant === v.value ? `0 0 0 1px ${v.accent}` : 'none',
                      textAlign: 'center', fontWeight: 700, fontSize: '0.78rem',
                      transition: 'all 0.15s', userSelect: 'none',
                      '&:hover': { opacity: 0.85 },
                    }}
                  >
                    {v.label}
                    {config.variant === v.value && (
                      <Box component="span" sx={{ ml: 0.75, fontSize: 10 }}>✓</Box>
                    )}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Separator */}
          <Card elevation={0} sx={{ border: '1px solid #e8e8e8', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>SEPARATOR BETWEEN ITEMS</Typography>
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                {SEPARATOR_OPTIONS.map(s => (
                  <Box
                    key={s.value}
                    onClick={() => update({ separatorStyle: s.value as MarqueeConfig['separatorStyle'] })}
                    sx={{
                      px: 1.5, py: 0.6, borderRadius: 1, cursor: 'pointer', flex: 1, textAlign: 'center',
                      border: '1.5px solid',
                      borderColor: config.separatorStyle === s.value ? '#1a1a1a' : '#e0e0e0',
                      bgcolor: config.separatorStyle === s.value ? '#1a1a1a' : 'white',
                      color: config.separatorStyle === s.value ? 'white' : '#555',
                      fontSize: '0.72rem', fontWeight: 600, userSelect: 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s.label}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Speed & Size */}
          <Card elevation={0} sx={{ border: '1px solid #e8e8e8', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Speed sx={{ fontSize: 18, color: '#c9a84c' }} />
                <Typography variant="subtitle2" fontWeight={800}>SPEED & SIZE</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>Scroll Speed</Typography>
                  <Typography variant="caption" fontWeight={700}>
                    {config.speed <= 20 ? 'Fast' : config.speed <= 35 ? 'Normal' : 'Slow'}
                  </Typography>
                </Box>
                <Slider
                  value={config.speed}
                  min={8}
                  max={70}
                  step={1}
                  onChange={(_, v) => update({ speed: v as number })}
                  marks={[
                    { value: 8,  label: 'Fast' },
                    { value: 35, label: 'Normal' },
                    { value: 70, label: 'Slow' },
                  ]}
                  sx={{ color: '#1a1a1a', '& .MuiSlider-markLabel': { fontSize: '0.65rem' } }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                Font Size
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {FONT_SIZE_OPTIONS.map(f => (
                  <Box
                    key={f.value}
                    onClick={() => update({ fontSize: f.value as MarqueeConfig['fontSize'] })}
                    sx={{
                      flex: 1, textAlign: 'center', py: 0.75, borderRadius: 1, cursor: 'pointer',
                      border: '1.5px solid',
                      borderColor: config.fontSize === f.value ? '#1a1a1a' : '#e0e0e0',
                      bgcolor: config.fontSize === f.value ? '#1a1a1a' : 'white',
                      color: config.fontSize === f.value ? 'white' : '#555',
                      fontSize: '0.75rem', fontWeight: 700, userSelect: 'none', transition: 'all 0.15s',
                    }}
                  >
                    {f.label}
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>

          {/* Options */}
          <Card elevation={0} sx={{ border: '1px solid #e8e8e8', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>OPTIONS</Typography>
              <Stack spacing={1.5}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.uppercase}
                      onChange={e => update({ uppercase: e.target.checked })}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>UPPERCASE TEXT</Typography>
                      <Typography variant="caption" color="text.secondary">Transform all text to capitals</Typography>
                    </Box>
                  }
                />
                <Divider />
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.pauseOnHover}
                      onChange={e => update({ pauseOnHover: e.target.checked })}
                      size="small"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Pause on Hover</Typography>
                      <Typography variant="caption" color="text.secondary">Pauses scrolling when mouse hovers</Typography>
                    </Box>
                  }
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Save CTA */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            startIcon={saving ? <CircularProgress size={18} sx={{ color: 'white' }} /> : <Save />}
            onClick={save}
            disabled={saving}
            sx={{
              bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' },
              fontWeight: 800, fontSize: '0.9rem', py: 1.5, borderRadius: 2,
              letterSpacing: '0.04em',
            }}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>

          {!sectionId && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              No marquee section exists yet. Clicking <strong>Save</strong> will create one automatically.
              Then go to <strong>Homepage Builder</strong> to position it on the page.
            </Alert>
          )}
        </Stack>
      </Box>

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack?.sev} onClose={() => setSnack(null)} sx={{ borderRadius: 2 }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
