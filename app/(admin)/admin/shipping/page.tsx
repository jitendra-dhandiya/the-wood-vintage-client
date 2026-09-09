'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, TextField, InputAdornment,
  MenuItem, Select, FormControl, InputLabel, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Alert, Pagination, Stack,
} from '@mui/material';
import {
  Search, Refresh, Add, Label, LocalShipping, Cancel, Sync,
  OpenInNew, Schedule,
} from '@mui/icons-material';
import Link from 'next/link';
import { shippingApi } from '../../../../services/api.service';

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  CREATED:           'info',
  PICKUP_REQUESTED:  'warning',
  DISPATCHED:        'warning',
  'IN TRANSIT':      'info',
  'OUT FOR DELIVERY':'warning',
  DELIVERED:         'success',
  CANCELLED:         'error',
  RTO:               'error',
  RETURNED:          'error',
};

interface Shipment {
  id: string;
  waybill: string | null;
  status: string;
  pickupScheduled: boolean;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    user: { firstName: string; lastName: string; email: string };
  };
  trackingEvents: { status: string; eventTime: string }[];
}

export default function ShippingPage() {
  const [shipments, setShipments]   = useState<Shipment[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [selectedWaybills, setSelected] = useState<string[]>([]);
  const [pickupDlg, setPickupDlg]   = useState(false);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [actionMsg, setActionMsg]   = useState('');
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await shippingApi.list({ page, limit: LIMIT, status: statusFilter || undefined, search: search || undefined });
      setShipments(data.data.shipments);
      setTotal(data.data.total);
    } catch {
      setError('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSync = async (waybill: string) => {
    try {
      await shippingApi.syncTracking(waybill);
      setActionMsg(`Tracking synced for ${waybill}`);
      load();
    } catch {
      setActionMsg('Sync failed');
    }
  };

  const handleLabel = async (waybill: string) => {
    try {
      const { data } = await shippingApi.getLabelUrl(waybill);
      window.open(data.data.url, '_blank');
    } catch {
      setActionMsg('Failed to get label URL');
    }
  };

  const handlePickup = async () => {
    try {
      await shippingApi.schedulePickup(selectedWaybills, pickupDate, pickupTime);
      setPickupDlg(false);
      setSelected([]);
      setActionMsg(`Pickup scheduled for ${selectedWaybills.length} shipments`);
      load();
    } catch {
      setActionMsg('Pickup scheduling failed');
    }
  };

  const toggleSelect = (waybill: string) => {
    setSelected(prev =>
      prev.includes(waybill) ? prev.filter(w => w !== waybill) : [...prev, waybill]
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Shipments</Typography>
          <Typography variant="body2" color="text.secondary">
            {total} total shipments
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {selectedWaybills.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<Schedule />}
              onClick={() => setPickupDlg(true)}
              size="small"
            >
              Schedule Pickup ({selectedWaybills.length})
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={load}
            size="small"
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            component={Link}
            href="/admin/shipping/settings"
            size="small"
          >
            Settings
          </Button>
        </Box>
      </Box>

      {actionMsg && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setActionMsg('')}>
          {actionMsg}
        </Alert>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search waybill / order number…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={e => { setStatus(e.target.value); setPage(1); }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="CREATED">Created</MenuItem>
            <MenuItem value="DISPATCHED">Dispatched</MenuItem>
            <MenuItem value="IN TRANSIT">In Transit</MenuItem>
            <MenuItem value="OUT FOR DELIVERY">Out for Delivery</MenuItem>
            <MenuItem value="DELIVERED">Delivered</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
            <MenuItem value="RTO">RTO</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell padding="checkbox" />
                <TableCell sx={{ fontWeight: 600 }}>AWB / Order</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Created</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : shipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No shipments found
                  </TableCell>
                </TableRow>
              ) : (
                shipments.map(s => (
                  <TableRow
                    key={s.id}
                    hover
                    selected={!!(s.waybill && selectedWaybills.includes(s.waybill))}
                    sx={{ '&:last-child td': { borderBottom: 0 } }}
                  >
                    <TableCell padding="checkbox">
                      {s.waybill && (
                        <input
                          type="checkbox"
                          checked={selectedWaybills.includes(s.waybill)}
                          onChange={() => toggleSelect(s.waybill!)}
                          style={{ cursor: 'pointer' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                        {s.waybill || '—'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {s.order.user.firstName} {s.order.user.lastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {s.order.user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={s.status}
                        color={STATUS_COLORS[s.status] || 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        ₹{Number(s.order.total).toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(s.createdAt).toLocaleDateString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        {s.waybill && (
                          <>
                            <Tooltip title="Sync tracking">
                              <IconButton size="small" onClick={() => handleSync(s.waybill!)}>
                                <Sync fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Download label">
                              <IconButton size="small" onClick={() => handleLabel(s.waybill!)}>
                                <Label fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Public tracking page">
                              <IconButton
                                size="small"
                                component={Link}
                                href={`/track/${s.waybill}`}
                                target="_blank"
                              >
                                <OpenInNew fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title="View order">
                          <IconButton
                            size="small"
                            component={Link}
                            href={`/admin/orders/${s.order.id}`}
                          >
                            <LocalShipping fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {total > LIMIT && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <Pagination
              count={Math.ceil(total / LIMIT)}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Paper>

      {/* Schedule Pickup Dialog */}
      <Dialog open={pickupDlg} onClose={() => setPickupDlg(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Schedule Pickup</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Scheduling pickup for <strong>{selectedWaybills.length}</strong> shipment(s).
            </Typography>
            <TextField
              fullWidth
              label="Pickup Date"
              type="date"
              value={pickupDate}
              onChange={e => setPickupDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Pickup Time"
              type="time"
              value={pickupTime}
              onChange={e => setPickupTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickupDlg(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePickup} disabled={!pickupDate}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
