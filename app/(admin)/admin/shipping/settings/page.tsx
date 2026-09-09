'use client';
import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Switch,
  FormControlLabel, Alert, CircularProgress, Divider, Chip,
  InputAdornment, IconButton, Tooltip,
} from '@mui/material';
import {
  Save, Refresh, Visibility, VisibilityOff, CheckCircle, Warning,
} from '@mui/icons-material';
import { shippingApi } from '../../../../../services/api.service';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh',
  'Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka',
  'Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram',
  'Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh',
];

interface Settings {
  apiKey: string;
  apiKeyConfigured: boolean;
  environment: 'sandbox' | 'production';
  warehouseName: string;
  pickupName: string;
  pickupPhone: string;
  pickupEmail: string;
  pickupAddress: string;
  pickupCity: string;
  pickupState: string;
  pickupPincode: string;
  gstNumber: string;
  defaultWeightKg: number;
  autoCreateShipment: boolean;
}

const DEFAULTS: Settings = {
  apiKey: '',
  apiKeyConfigured: false,
  environment: 'sandbox',
  warehouseName: '',
  pickupName: '',
  pickupPhone: '',
  pickupEmail: '',
  pickupAddress: '',
  pickupCity: '',
  pickupState: '',
  pickupPincode: '',
  gstNumber: '',
  defaultWeightKg: 0.5,
  autoCreateShipment: false,
};

export default function ShippingSettingsPage() {
  const [settings, setSettings]       = useState<Settings>(DEFAULTS);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState('');
  const [showKey, setShowKey]         = useState(false);
  const [pincode, setPincode]         = useState('');
  const [svcResult, setSvcResult]     = useState<any>(null);
  const [svcLoading, setSvcLoading]   = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await shippingApi.getSettings();
      setSettings({ ...DEFAULTS, ...data.data });
    } catch {
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof Settings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await shippingApi.saveSettings({
        apiKey:             settings.apiKey,
        environment:        settings.environment,
        warehouseName:      settings.warehouseName,
        pickupName:         settings.pickupName,
        pickupPhone:        settings.pickupPhone,
        pickupEmail:        settings.pickupEmail,
        pickupAddress:      settings.pickupAddress,
        pickupCity:         settings.pickupCity,
        pickupState:        settings.pickupState,
        pickupPincode:      settings.pickupPincode,
        gstNumber:          settings.gstNumber,
        defaultWeight:      settings.defaultWeightKg,
        autoCreateShipment: settings.autoCreateShipment,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await loadSettings(); // re-fetch to get masked key
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testServiceability = async () => {
    if (!pincode.trim()) return;
    setSvcLoading(true);
    setSvcResult(null);
    try {
      const { data } = await shippingApi.checkServiceability(pincode.trim());
      setSvcResult(data.data);
    } catch {
      setSvcResult({ error: 'Failed to check serviceability' });
    } finally {
      setSvcLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Delhivery Shipping Settings</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Configure your Delhivery B2C integration. Changes take effect immediately.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
          onClick={handleSave}
          disabled={saving}
          sx={{ minWidth: 120 }}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Box>

      {error  && <Alert severity="error"   sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {saved  && <Alert severity="success" sx={{ mb: 2 }}>Settings saved successfully.</Alert>}

      {/* ── Environment ───────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Environment
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <Chip
            label="Sandbox (Testing)"
            variant={settings.environment === 'sandbox' ? 'filled' : 'outlined'}
            color={settings.environment === 'sandbox' ? 'warning' : 'default'}
            onClick={() => handleChange('environment', 'sandbox')}
            sx={{ cursor: 'pointer', fontWeight: 600 }}
          />
          <Chip
            label="Production (Live)"
            variant={settings.environment === 'production' ? 'filled' : 'outlined'}
            color={settings.environment === 'production' ? 'success' : 'default'}
            onClick={() => handleChange('environment', 'production')}
            sx={{ cursor: 'pointer', fontWeight: 600 }}
          />
        </Box>
        {settings.environment === 'production' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Production mode — real shipments will be created and charges will apply.
          </Alert>
        )}
      </Paper>

      {/* ── API Key ───────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>API Key</Typography>
          {settings.apiKeyConfigured && (
            <Tooltip title="API key is configured">
              <CheckCircle fontSize="small" color="success" />
            </Tooltip>
          )}
        </Box>
        <Divider sx={{ mb: 2 }} />
        <TextField
          fullWidth
          label="Delhivery API Token"
          type={showKey ? 'text' : 'password'}
          value={settings.apiKey}
          onChange={e => handleChange('apiKey', e.target.value)}
          placeholder={settings.apiKeyConfigured ? 'Leave blank to keep existing key' : 'Enter your Delhivery API token'}
          helperText="Get this from Delhivery Merchant Dashboard → Settings → API"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowKey(v => !v)} edge="end">
                  {showKey ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* ── Warehouse / Pickup ────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Warehouse & Pickup Details
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Warehouse Name"
              value={settings.warehouseName}
              onChange={e => handleChange('warehouseName', e.target.value)}
              helperText="Must match the pickup location name in Delhivery dashboard"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Pickup Contact Name"
              value={settings.pickupName}
              onChange={e => handleChange('pickupName', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Pickup Phone"
              value={settings.pickupPhone}
              onChange={e => handleChange('pickupPhone', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Pickup Email"
              type="email"
              value={settings.pickupEmail}
              onChange={e => handleChange('pickupEmail', e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth label="Pickup Address"
              value={settings.pickupAddress}
              onChange={e => handleChange('pickupAddress', e.target.value)}
              multiline rows={2}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth label="City"
              value={settings.pickupCity}
              onChange={e => handleChange('pickupCity', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth label="State" select SelectProps={{ native: true }}
              value={settings.pickupState}
              onChange={e => handleChange('pickupState', e.target.value)}
            >
              <option value="">Select state…</option>
              {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth label="Pincode"
              value={settings.pickupPincode}
              onChange={e => handleChange('pickupPincode', e.target.value)}
              inputProps={{ maxLength: 6 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="GST Number (optional)"
              value={settings.gstNumber}
              onChange={e => handleChange('gstNumber', e.target.value)}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── Automation ────────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>Automation</Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth label="Default Package Weight (kg)"
              type="number"
              value={settings.defaultWeightKg}
              onChange={e => handleChange('defaultWeightKg', parseFloat(e.target.value) || 0.5)}
              inputProps={{ min: 0.1, max: 50, step: 0.1 }}
              helperText="Used when product weight is not set"
            />
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.autoCreateShipment}
                  onChange={e => handleChange('autoCreateShipment', e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    Auto-create shipment on payment
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatically creates a Delhivery shipment when a customer completes payment
                  </Typography>
                </Box>
              }
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ── Test Serviceability ───────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Test Pincode Serviceability
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <TextField
            label="Enter pincode"
            value={pincode}
            onChange={e => setPincode(e.target.value)}
            inputProps={{ maxLength: 6 }}
            size="small"
            sx={{ width: 180 }}
          />
          <Button
            variant="outlined"
            onClick={testServiceability}
            disabled={svcLoading || !pincode.trim()}
            startIcon={svcLoading ? <CircularProgress size={14} /> : <Refresh />}
          >
            Check
          </Button>
        </Box>
        {svcResult && (
          <Box sx={{ mt: 2 }}>
            {svcResult.error ? (
              <Alert severity="error">{svcResult.error}</Alert>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                <Chip size="small" label={svcResult.serviceable ? 'Serviceable' : 'Not Serviceable'}
                      color={svcResult.serviceable ? 'success' : 'error'} />
                {svcResult.cod !== undefined && (
                  <Chip size="small" label={`COD: ${svcResult.cod ? 'Yes' : 'No'}`}
                        color={svcResult.cod ? 'success' : 'default'} />
                )}
                {svcResult.prepaid !== undefined && (
                  <Chip size="small" label={`Prepaid: ${svcResult.prepaid ? 'Yes' : 'No'}`}
                        color={svcResult.prepaid ? 'success' : 'default'} />
                )}
                {svcResult.maxCodAmount && (
                  <Chip size="small" label={`Max COD: ₹${svcResult.maxCodAmount}`} />
                )}
              </Box>
            )}
          </Box>
        )}
      </Paper>

      {/* ── Save Footer ───────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={loadSettings} startIcon={<Refresh />}>
          Reset
        </Button>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </Box>
    </Box>
  );
}
