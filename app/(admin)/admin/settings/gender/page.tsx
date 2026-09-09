'use client';
import { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Switch, FormControlLabel,
  Button, CircularProgress, Alert, Select, MenuItem, FormControl,
  InputLabel, Grid, Chip, Divider,
} from '@mui/material';
import { settingsApi, productApi } from '../../../../../services/api.service';
import { toast } from 'react-hot-toast';

export default function GenderSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggleEnabled, setToggleEnabled] = useState(true);
  const [defaultGender, setDefaultGender] = useState('');
  const [stats, setStats] = useState({ men: 0, women: 0, unisex: 0, total: 0 });

  useEffect(() => {
    Promise.all([
      settingsApi.getByGroup('general').catch(() => ({ data: { data: [] } })),
      productApi.getAll({ limit: 1, gender: 'MEN' }).catch(() => null),
      productApi.getAll({ limit: 1, gender: 'WOMEN' }).catch(() => null),
      productApi.getAll({ limit: 1 }).catch(() => null),
    ]).then(([settingsRes, menRes, womenRes, allRes]) => {
      const settings: any[] = (settingsRes.data as any)?.data || [];
      const findVal = (key: string) => settings.find((s: any) => s.key === key)?.value;
      setToggleEnabled(findVal('gender_toggle_enabled') !== 'false');
      setDefaultGender(findVal('gender_default') || '');

      const menTotal = (menRes?.data as any)?.meta?.total ?? 0;
      const womenTotal = (womenRes?.data as any)?.meta?.total ?? 0;
      const allTotal = (allRes?.data as any)?.meta?.total ?? 0;
      setStats({
        men: menTotal,
        women: womenTotal,
        unisex: allTotal - menTotal - womenTotal,
        total: allTotal,
      });
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsApi.upsertBulk([
        { key: 'gender_toggle_enabled', value: String(toggleEnabled) },
        { key: 'gender_default', value: defaultGender },
      ]);
      toast.success('Gender settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
          Gender Toggle Settings
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Control the Men / Women toggle shown in the storefront navbar.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Controls */}
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Configuration</Typography>

              <FormControlLabel
                control={
                  <Switch
                    checked={toggleEnabled}
                    onChange={(e) => setToggleEnabled(e.target.checked)}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#1a1a1a' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#1a1a1a' } }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Show Gender Toggle in Navbar</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Display the MEN / WOMEN toggle bar above the main navigation.
                    </Typography>
                  </Box>
                }
                sx={{ display: 'flex', alignItems: 'flex-start', mb: 3, gap: 1 }}
              />

              <Divider sx={{ mb: 3 }} />

              <FormControl size="small" fullWidth sx={{ mb: 3 }}>
                <InputLabel>Default Gender on First Visit</InputLabel>
                <Select
                  value={defaultGender}
                  label="Default Gender on First Visit"
                  onChange={(e) => setDefaultGender(e.target.value)}
                >
                  <MenuItem value="">No default (show all products)</MenuItem>
                  <MenuItem value="MEN">Men</MenuItem>
                  <MenuItem value="WOMEN">Women</MenuItem>
                </Select>
              </FormControl>

              <Alert severity="info" sx={{ mb: 3, fontSize: '0.8rem' }}>
                <strong>How it works:</strong> When a customer selects MEN or WOMEN, only products tagged
                with that gender (plus UNISEX products) are shown throughout the store — on the homepage,
                shop page, and all product sections. The selection is saved in the browser.
              </Alert>

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}
              >
                {saving ? <CircularProgress size={18} sx={{ color: 'white', mr: 1 }} /> : null}
                Save Settings
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Stats */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Product Distribution</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Tag products with Men / Women / Unisex gender in the product edit page.
              </Typography>

              {[
                { label: 'Men', count: stats.men, color: '#1565c0' },
                { label: 'Women', count: stats.women, color: '#c2185b' },
                { label: 'Unisex', count: Math.max(0, stats.unisex), color: '#555' },
              ].map(({ label, count, color }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
                    <Typography variant="body2">{label}</Typography>
                  </Box>
                  <Chip label={count} size="small" sx={{ fontWeight: 700, minWidth: 48 }} />
                </Box>
              ))}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 1.5 }}>
                <Typography variant="body2" fontWeight={600}>Total Active Products</Typography>
                <Chip label={stats.total} size="small" sx={{ fontWeight: 700, bgcolor: '#1a1a1a', color: 'white' }} />
              </Box>

              <Alert severity="warning" sx={{ mt: 2, fontSize: '0.75rem' }}>
                Products without a gender tag default to <strong>Unisex</strong> and appear in both Men and Women views.
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
