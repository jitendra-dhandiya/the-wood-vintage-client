'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Button, Divider,
  Grid, CircularProgress, Tabs, Tab, Paper, Chip, LinearProgress,
  Slider, ToggleButton, ToggleButtonGroup, Stack,
} from '@mui/material';
import {
  CloudUpload, CheckCircle, Image as ImageIcon, Delete, GridView,
} from '@mui/icons-material';
import Image from 'next/image';
import { settingsApi } from '../../../../services/api.service';
import api from '../../../../lib/axios';
import { toast } from 'react-hot-toast';
import { useImageCropper } from '../../../../components/common/ImageCropperProvider';
import {
  NAV_LAYOUT_DEFAULTS, NAV_LAYOUT_RANGES, NAV_SETTING_KEYS, resolveNavLayout,
  type NavLayout, type NavRangeKey,
} from '../../../../lib/navLayout';

interface TabPanelProps { children?: React.ReactNode; index: number; value: number; }
const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <Box hidden={value !== index} sx={{ pt: 3 }}>{value === index && children}</Box>
);

// ── Logo Uploader ──────────────────────────────────────────────────
interface LogoUploaderProps {
  value: string;
  onChange: (url: string) => void;
}

function LogoUploader({ value, onChange }: LogoUploaderProps) {
  const cropImage = useImageCropper();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, SVG, WebP)');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('files', file);
      fd.append('folder', 'GENERAL');
      const { data } = await api.post('/media/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = data.data?.[0]?.url || '';
      if (url) {
        onChange(url);
        toast.success('Logo uploaded');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Both entry points crop first. A logo dropped onto the panel and a logo
  // picked from the dialog should behave identically.
  const cropThenUpload = async (file?: File | null) => {
    if (!file) return;
    const cropped = await cropImage(file, 'logo');
    if (cropped) upload(cropped);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    void cropThenUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    void cropThenUpload(e.dataTransfer.files?.[0]);
  };

  return (
    <Box>
      <Typography variant="caption" fontWeight={700} sx={{ color: 'text.secondary', display: 'block', mb: 1.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        Store Logo
      </Typography>

      {/* Current logo preview */}
      {value ? (
        <Paper
          elevation={0}
          sx={{
            border: '2px solid #e8e8e8',
            borderRadius: 2,
            p: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            mb: 2,
            bgcolor: '#f8f8f8',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
            {/* Checkered background to show transparency */}
            <Box sx={{
              width: 180, height: 72, flexShrink: 0,
              backgroundImage: 'linear-gradient(45deg, #d8d8d8 25%, transparent 25%), linear-gradient(-45deg, #d8d8d8 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d8d8d8 75%), linear-gradient(-45deg, transparent 75%, #d8d8d8 75%)',
              backgroundSize: '12px 12px',
              backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0px',
              bgcolor: 'white',
              borderRadius: 1,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e0e0e0',
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={value}
                alt="logo preview"
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', display: 'block' }}
              />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.5 }}>
                <CheckCircle sx={{ fontSize: 16, color: '#2e7d32' }} />
                <Typography variant="body2" fontWeight={700} color="#2e7d32">Logo active</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', display: 'block' }} noWrap>
                {value.length > 60 ? `…${value.slice(-55)}` : value}
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            startIcon={<Delete sx={{ fontSize: 16 }} />}
            onClick={() => onChange('')}
            sx={{ color: '#d32f2f', fontWeight: 700, flexShrink: 0, '&:hover': { bgcolor: '#fff0f0' } }}
          >
            Remove
          </Button>
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            border: `2px dashed ${dragOver ? '#1a1a1a' : '#d0d0d0'}`,
            borderRadius: 2,
            p: { xs: 3, md: 4 },
            textAlign: 'center',
            bgcolor: dragOver ? '#f5f5f5' : '#fafafa',
            transition: 'all 0.15s',
            mb: 2,
            cursor: 'pointer',
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          {uploading ? (
            <Box>
              <CircularProgress size={32} sx={{ color: '#1a1a1a', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">Uploading logo…</Typography>
              <LinearProgress sx={{ mt: 2, borderRadius: 1, bgcolor: '#e0e0e0', '& .MuiLinearProgress-bar': { bgcolor: '#1a1a1a' } }} />
            </Box>
          ) : (
            <Box>
              <CloudUpload sx={{ fontSize: 40, color: '#bbb', mb: 1 }} />
              <Typography variant="body1" fontWeight={700} sx={{ mb: 0.5 }}>
                Drop your logo here or click to upload
              </Typography>
              <Typography variant="caption" color="text.secondary">
                PNG, SVG, WebP — transparent background recommended
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mt: 1.5 }}>
                {['PNG with transparency', 'Min 400px wide', 'SVG preferred'].map(t => (
                  <Chip key={t} label={t} size="small" sx={{ fontSize: '0.65rem', height: 20 }} />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Upload button */}
      <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
        <Button
          variant="outlined"
          startIcon={uploading ? <CircularProgress size={14} /> : <CloudUpload sx={{ fontSize: 16 }} />}
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          sx={{ fontWeight: 700, borderColor: '#1a1a1a', color: '#1a1a1a', '&:hover': { bgcolor: '#1a1a1a', color: 'white' }, borderRadius: 1.5 }}
        >
          {value ? 'Replace Logo' : 'Upload Logo'}
        </Button>
        {value && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ImageIcon sx={{ fontSize: 14 }} />
            Showing checkered bg = transparent area
          </Typography>
        )}
      </Box>

      {/* URL fallback */}
      <TextField
        label="Or paste a logo URL directly"
        size="small"
        fullWidth
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="https://... or /logo.png"
        sx={{ mt: 2 }}
        InputProps={{ sx: { fontSize: '0.82rem' } }}
      />
    </Box>
  );
}

// ── Navigation layout controls ─────────────────────────────────────

/**
 * A bounded numeric setting.
 *
 * A slider rather than a text box, because every one of these values has a
 * range outside which the storefront clamps anyway — a control that cannot
 * express an invalid value is easier to trust than one that silently corrects
 * you after saving.
 */
function RangeRow({ label, help, rangeKey, value, onChange }: {
  label: string;
  help?: string;
  rangeKey: NavRangeKey;
  value: number;
  onChange: (v: number) => void;
}) {
  const r = NAV_LAYOUT_RANGES[rangeKey];
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#666' }}>
          {value}{r.unit === '×8px' ? '' : ` ${r.unit}`}
          {r.unit === '×8px' && <span style={{ color: '#aaa' }}>{` (${Math.round(value * 8)}px)`}</span>}
        </Typography>
      </Box>
      <Slider
        size="small"
        value={value}
        min={r.min}
        max={r.max}
        step={r.step}
        onChange={(_, v) => onChange(v as number)}
        sx={{ color: '#1a1a1a', mt: 0.5 }}
      />
      {help && <Typography sx={{ fontSize: '0.72rem', color: '#999', mt: -0.5 }}>{help}</Typography>}
    </Box>
  );
}

function ChoiceRow<T extends string>({ label, help, value, options, onChange }: {
  label: string;
  help?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, mb: 0.75 }}>{label}</Typography>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={value}
        onChange={(_, v) => { if (v) onChange(v as T); }}
        sx={{
          '& .MuiToggleButton-root': { textTransform: 'none', fontSize: '0.76rem', px: 1.5, py: 0.5 },
          '& .Mui-selected': { bgcolor: '#1a1a1a !important', color: '#fff !important' },
        }}
      >
        {options.map(o => <ToggleButton key={o.value} value={o.value}>{o.label}</ToggleButton>)}
      </ToggleButtonGroup>
      {help && <Typography sx={{ fontSize: '0.72rem', color: '#999', mt: 0.75 }}>{help}</Typography>}
    </Box>
  );
}

/**
 * A miniature of the real drawer, at the real width, driven by the same
 * resolved layout the storefront uses. Values are clamped by
 * `resolveNavLayout` before they reach either, so what is drawn here is what
 * ships — including when the admin drags a slider to its limit.
 */
function NavDrawerPreview({ layout }: { layout: NavLayout }) {
  const m = layout.mobile;
  const centred = m.align === 'center';
  const justify = centred ? 'center' : 'flex-start';
  const textAlign = centred ? 'center' : 'left';
  const icon = <GridView sx={{ fontSize: 13, color: '#aaa' }} />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Typography sx={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999' }}>
        Mobile drawer preview
      </Typography>
      <Box sx={{
        width: m.drawerWidth, maxWidth: '100%',
        border: '1px solid #e4e4e4', borderRadius: 1, overflow: 'hidden',
        bgcolor: '#fff', fontFamily: 'inherit',
      }}>
        {/* header */}
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, letterSpacing: '0.15em', fontSize: '0.8rem' }}>
            THE UNIQUE DRESSUP
          </Typography>
        </Box>
        {/* gender tabs */}
        <Box sx={{ display: 'flex', borderBottom: '1px solid #eee' }}>
          {['WOMEN', 'MEN'].map((g, i) => (
            <Box key={g} sx={{
              flex: 1, textAlign: 'center', py: 0.9, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.15em',
              color: i === 0 ? '#1a1a1a' : '#aaa',
              borderBottom: i === 0 ? '2px solid #1a1a1a' : '2px solid transparent',
            }}>{g}</Box>
          ))}
        </Box>
        {/* top links */}
        {['New In', 'Collections', 'Sale', 'Blog'].map(l => (
          <Box key={l} sx={{ px: 2, py: 0.85, fontSize: '0.8rem', fontWeight: 500, color: '#1a1a1a', textAlign }}>{l}</Box>
        ))}
        <Divider sx={{ my: 0.5 }} />
        <Box sx={{ px: 2, py: 0.6, textAlign }}>
          <Typography sx={{ fontSize: '0.55rem', letterSpacing: '0.15em', color: '#aaa', textTransform: 'uppercase' }}>
            Shop by Category
          </Typography>
        </Box>
        {/* chips */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: justify, gap: 0.5, px: 2, pb: 1.2 }}>
          {['Shop All', 'New Arrivals', 'Best Sellers'].map(c => (
            <Box key={c} sx={{
              px: 1.2, py: 0.4, border: '1px solid #e6e2dc', borderRadius: 5,
              fontSize: '0.64rem', fontWeight: 700, color: '#6b5f4e', bgcolor: '#fdfcfa',
            }}>{c}</Box>
          ))}
        </Box>
        <Divider />
        {/* category rows */}
        {['DENIM', 'Pants and Trousers'].map(c => (
          <Box key={c} sx={{
            display: 'flex', alignItems: 'center', justifyContent: justify, gap: 1.5,
            px: 2, py: m.rowPadding, borderBottom: '1px solid #f4f4f4',
          }}>
            {m.thumbWidth > 0 && (
              <Box sx={{
                width: m.thumbWidth, height: m.thumbHeight, borderRadius: 1, flexShrink: 0, bgcolor: '#f3f1ee',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-playfair)', fontSize: '0.9rem', fontWeight: 700, color: '#c9b79a',
              }}>{c.charAt(0)}</Box>
            )}
            <Box sx={{ minWidth: 0, textAlign }}>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c}
              </Typography>
              <Typography sx={{ fontSize: '0.62rem', color: '#9a9a9a' }}>Shop now</Typography>
            </Box>
          </Box>
        ))}
        {/* view all */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: justify, px: 2, py: 1.1 }}>
          {m.viewAllIcon === 'before' && <Box sx={{ mr: 1, display: 'flex' }}>{icon}</Box>}
          <Typography sx={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, flex: centred ? '0 1 auto' : '1 1 auto', textAlign }}>
            View All Categories
          </Typography>
          {m.viewAllIcon === 'after' && <Box sx={{ ml: 1, display: 'flex' }}>{icon}</Box>}
        </Box>
      </Box>
      <Typography sx={{ fontSize: '0.7rem', color: '#999' }}>
        Drawn at the real drawer width ({m.drawerWidth}px). Type sizes are slightly reduced to fit this card.
      </Typography>
    </Box>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function SettingsPage() {
  const [tab, setTab] = useState(0);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(() => {
    settingsApi.getAll().then(({ data }) => {
      const map: Record<string, string> = {};
      (data.data || []).forEach((s: any) => { map[s.key] = s.value ?? ''; });
      setSettings(map);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const set = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  const save = async (keys: string[]) => {
    setSaving(true);
    try {
      await settingsApi.upsertBulk(keys.map(key => ({ key, value: settings[key] ?? '' })));
      toast.success('Settings saved');
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>;

  const storeKeys = ['site_name', 'site_tagline', 'site_description', 'site_email', 'site_phone', 'site_address', 'contact_hours', 'logo_url', 'currency', 'currency_symbol'];
  const shippingKeys = ['free_shipping_threshold', 'standard_shipping_rate', 'express_shipping_rate', 'self_delivery_pincodes'];
  const socialKeys = ['instagram_url', 'facebook_url', 'twitter_url', 'youtube_url', 'pinterest_url'];
  const homepageKeys = ['announcement_text'];
  const analyticsKeys = ['google_analytics_id', 'facebook_pixel_id'];
  const navKeys = [...NAV_SETTING_KEYS];

  // Resolved the same way the storefront resolves it, so the preview below
  // cannot drift from what shoppers get.
  const navLayout = resolveNavLayout(settings);
  const setNav = (key: string, value: string | number | boolean) => set(key, String(value));
  const resetNav = () => {
    const d = NAV_LAYOUT_DEFAULTS;
    setNav('nav_mobile_drawer_width',    d.mobile.drawerWidth);
    setNav('nav_mobile_align',           d.mobile.align);
    setNav('nav_mobile_viewall_icon',    d.mobile.viewAllIcon);
    setNav('nav_mobile_thumb_width',     d.mobile.thumbWidth);
    setNav('nav_mobile_thumb_height',    d.mobile.thumbHeight);
    setNav('nav_mobile_row_padding',     d.mobile.rowPadding);
    setNav('nav_desktop_panel_height',   d.desktop.panelHeight);
    setNav('nav_desktop_sidebar_width',  d.desktop.sidebarWidth);
    setNav('nav_desktop_quicklink_icon', d.desktop.quickLinkIcon);
  };

  const SaveBtn = ({ keys }: { keys: string[] }) => (
    <Button variant="contained" onClick={() => save(keys)} disabled={saving}
      sx={{ mt: 3, bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
      {saving ? 'Saving...' : 'Save Settings'}
    </Button>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 3 }}>Settings</Typography>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 0 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Store" />
            <Tab label="Shipping" />
            <Tab label="Social" />
            <Tab label="Homepage" />
            <Tab label="Analytics" />
            <Tab label="Navigation" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Store */}
            <TabPanel value={tab} index={0}>
              <Grid container spacing={3}>

                {/* Logo uploader — full width at top */}
                <Grid item xs={12}>
                  <Paper elevation={0} sx={{ border: '1px solid #e8e8e8', borderRadius: 2, p: 3 }}>
                    <LogoUploader
                      value={settings['logo_url'] ?? ''}
                      onChange={url => set('logo_url', url)}
                    />
                  </Paper>
                </Grid>

                <Grid item xs={12}><Divider /></Grid>

                {/* Store details */}
                {[
                  { key: 'site_name',    label: 'Store Name' },
                  { key: 'site_tagline', label: 'Tagline' },
                  { key: 'site_email',   label: 'Contact Email' },
                  { key: 'site_phone',   label: 'Phone Number' },
                  { key: 'currency',        label: 'Currency Code (e.g. INR)' },
                  { key: 'currency_symbol', label: 'Currency Symbol (e.g. ₹)' },
                  { key: 'contact_hours',   label: 'Business Hours (e.g. Mon–Sat: 10am–7pm)' },
                ].map(({ key, label }) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <TextField label={label} size="small" fullWidth
                      value={settings[key] ?? ''}
                      onChange={e => set(key, e.target.value)} />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <TextField label="Site Description (shown in footer)" size="small" fullWidth multiline rows={2}
                    value={settings['site_description'] ?? ''} onChange={e => set('site_description', e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Store Address" size="small" fullWidth multiline rows={2}
                    value={settings['site_address'] ?? ''} onChange={e => set('site_address', e.target.value)} />
                </Grid>
              </Grid>
              <SaveBtn keys={storeKeys} />
            </TabPanel>

            {/* Shipping */}
            <TabPanel value={tab} index={1}>
              <Grid container spacing={2}>
                {[
                  { key: 'free_shipping_threshold', label: 'Free Shipping Threshold (₹)' },
                  { key: 'standard_shipping_rate',  label: 'Standard Shipping Rate (₹)' },
                  { key: 'express_shipping_rate',   label: 'Express Shipping Rate (₹)' },
                ].map(({ key, label }) => (
                  <Grid item xs={12} sm={6} key={key}>
                    <TextField label={label} type="number" size="small" fullWidth
                      value={settings[key] ?? ''}
                      onChange={e => set(key, e.target.value)} />
                  </Grid>
                ))}
                <Grid item xs={12}>
                  <TextField
                    label="Self-delivery pincodes"
                    size="small"
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="302017, 302018, 3030"
                    value={settings['self_delivery_pincodes'] ?? ''}
                    onChange={e => set('self_delivery_pincodes', e.target.value)}
                    helperText={
                      'Orders going to these pincodes are marked "Self delivery" automatically; everything else goes to Delhivery. ' +
                      'Separate with commas or new lines. A short entry covers the whole block — "3020" matches every pincode starting 3020. ' +
                      'Leave empty to send every order to Delhivery. You can still change the method on any individual order.'
                    }
                  />
                </Grid>
              </Grid>
              <SaveBtn keys={shippingKeys} />
            </TabPanel>

            {/* Social */}
            <TabPanel value={tab} index={2}>
              <Grid container spacing={2}>
                {[
                  { key: 'instagram_url', label: 'Instagram URL' },
                  { key: 'facebook_url',  label: 'Facebook URL' },
                  { key: 'twitter_url',   label: 'Twitter / X URL' },
                  { key: 'youtube_url',   label: 'YouTube URL' },
                  { key: 'pinterest_url', label: 'Pinterest URL' },
                ].map(({ key, label }) => (
                  <Grid item xs={12} key={key}>
                    <TextField label={label} size="small" fullWidth
                      value={settings[key] ?? ''}
                      onChange={e => set(key, e.target.value)} />
                  </Grid>
                ))}
              </Grid>
              <SaveBtn keys={socialKeys} />
            </TabPanel>

            {/* Homepage */}
            <TabPanel value={tab} index={3}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Announcement Bar Text"
                    size="small" fullWidth multiline rows={2}
                    helperText="Shown at the top of every page. Use | to separate messages."
                    value={settings['announcement_text'] ?? ''}
                    onChange={e => set('announcement_text', e.target.value)}
                  />
                </Grid>
              </Grid>
              <SaveBtn keys={homepageKeys} />
            </TabPanel>

            {/* Analytics */}
            <TabPanel value={tab} index={4}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label="Google Analytics ID" size="small" fullWidth
                    value={settings['google_analytics_id'] ?? ''}
                    onChange={e => set('google_analytics_id', e.target.value)}
                    placeholder="G-XXXXXXXXXX" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label="Facebook Pixel ID" size="small" fullWidth
                    value={settings['facebook_pixel_id'] ?? ''}
                    onChange={e => set('facebook_pixel_id', e.target.value)} />
                </Grid>
              </Grid>
              <SaveBtn keys={analyticsKeys} />
            </TabPanel>

            {/* Navigation */}
            <TabPanel value={tab} index={5}>
              <Typography sx={{ fontSize: '0.82rem', color: '#666', mb: 3, maxWidth: '62ch' }}>
                Layout of the menu on both screen sizes. Changes apply to the whole
                storefront on the next page load — nothing here affects which links or
                categories appear, which is managed under Menu Links and Categories.
              </Typography>

              <Grid container spacing={4}>
                {/* ── Mobile ── */}
                <Grid item xs={12} md={6}>
                  <Paper elevation={0} sx={{ border: '1px solid #e8e8e8', borderRadius: 2, p: 2.5 }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1a1a1a', mb: 2.5 }}>
                      Mobile drawer
                    </Typography>
                    <Stack spacing={2.5}>
                      <RangeRow
                        label="Drawer width"
                        rangeKey="drawerWidth"
                        value={navLayout.mobile.drawerWidth}
                        onChange={v => setNav('nav_mobile_drawer_width', v)}
                        help="How far the panel slides in from the left."
                      />
                      <ChoiceRow
                        label="Label alignment"
                        value={navLayout.mobile.align}
                        options={[{ value: 'left' as const, label: 'Left' }, { value: 'center' as const, label: 'Centre' }]}
                        onChange={v => setNav('nav_mobile_align', v)}
                        help="Left keeps every label on one edge and is faster to scan."
                      />
                      <ChoiceRow
                        label={'"View All Categories" icon'}
                        value={navLayout.mobile.viewAllIcon}
                        options={[
                          { value: 'before' as const, label: 'Before text' },
                          { value: 'after'  as const, label: 'After text' },
                          { value: 'hidden' as const, label: 'Hidden' },
                        ]}
                        onChange={v => setNav('nav_mobile_viewall_icon', v)}
                        help="Before the text pushes the label off the drawer's shared left edge."
                      />
                      <RangeRow
                        label="Category thumbnail width"
                        rangeKey="thumbWidth"
                        value={navLayout.mobile.thumbWidth}
                        onChange={v => setNav('nav_mobile_thumb_width', v)}
                        help="Set to 0 to remove the thumbnails and show names only."
                      />
                      <RangeRow
                        label="Category thumbnail height"
                        rangeKey="thumbHeight"
                        value={navLayout.mobile.thumbHeight}
                        onChange={v => setNav('nav_mobile_thumb_height', v)}
                      />
                      <RangeRow
                        label="Category row padding"
                        rangeKey="rowPadding"
                        value={navLayout.mobile.rowPadding}
                        onChange={v => setNav('nav_mobile_row_padding', v)}
                        help="Vertical breathing room above and below each category row."
                      />
                    </Stack>
                  </Paper>

                  <Paper elevation={0} sx={{ border: '1px solid #e8e8e8', borderRadius: 2, p: 2.5, mt: 3 }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1a1a1a', mb: 2.5 }}>
                      Desktop mega menu
                    </Typography>
                    <Stack spacing={2.5}>
                      <RangeRow
                        label="Panel height"
                        rangeKey="panelHeight"
                        value={navLayout.desktop.panelHeight}
                        onChange={v => setNav('nav_desktop_panel_height', v)}
                        help="Share of the screen height the open Shop panel covers."
                      />
                      <RangeRow
                        label="Sidebar width"
                        rangeKey="sidebarWidth"
                        value={navLayout.desktop.sidebarWidth}
                        onChange={v => setNav('nav_desktop_sidebar_width', v)}
                        help="Left column holding quick links and the category list."
                      />
                      <ChoiceRow
                        label="Quick-link arrow"
                        value={navLayout.desktop.quickLinkIcon ? 'show' : 'hide'}
                        options={[{ value: 'show' as const, label: 'Show' }, { value: 'hide' as const, label: 'Hide' }]}
                        onChange={v => setNav('nav_desktop_quicklink_icon', v === 'show')}
                      />
                    </Stack>
                  </Paper>
                </Grid>

                {/* ── Preview ── */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ position: 'sticky', top: 24 }}>
                    <NavDrawerPreview layout={navLayout} />
                  </Box>
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <SaveBtn keys={navKeys} />
                <Button onClick={resetNav} disabled={saving} sx={{ mt: 3, color: '#666', textTransform: 'none' }}>
                  Reset to defaults
                </Button>
              </Box>
              <Typography sx={{ fontSize: '0.72rem', color: '#999', mt: 1.5 }}>
                Reset only fills the fields — press Save Settings to apply it.
              </Typography>
            </TabPanel>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
