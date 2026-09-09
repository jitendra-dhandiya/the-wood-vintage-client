'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, InputAdornment,
  Chip, IconButton, Tooltip, Select, MenuItem, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  CircularProgress, Stack, TablePagination,
} from '@mui/material';
import { Search, Edit, Visibility, LocalShipping, DirectionsBike } from '@mui/icons-material';
import {
  useReactTable, getCoreRowModel, flexRender,
  createColumnHelper, ColumnDef,
} from '@tanstack/react-table';
import { useRouter } from 'next/navigation';
import { orderApi } from '../../../../services/api.service';
import { formatPrice, formatDate } from '../../../../utils/format';
import { orderAddress } from '../../../../lib/orderAddress';
import toast from 'react-hot-toast';

interface Order {
  id: string; orderNumber: string; status: string; paymentStatus: string;
  total: number; createdAt: string; paymentMethod?: string;
  fulfilmentType?: 'SELF' | 'DELHIVERY';
  deliveryPartnerName?: string | null;
  user: { firstName: string; lastName: string; email: string; phone?: string };
  shippingAddress?: Record<string, unknown> | null;
  address?: Record<string, unknown> | null;
  _count: { items: number };
}

const columnHelper = createColumnHelper<Order>();

const STATUS_OPTIONS = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED',
];

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [updateOrder, setUpdateOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    orderApi.getAll({
      page: page + 1, limit: PAGE_SIZE,
      search: search || undefined,
      status: statusFilter || undefined,
      fulfilmentType: methodFilter || undefined,
    })
      .then(({ data }) => {
        setOrders((data as any).data || []);
        setTotal((data as any).meta?.total || 0);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [page, search, statusFilter, methodFilter]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchOrders, search]);

  const handleUpdateStatus = async () => {
    if (!updateOrder || !newStatus) return;
    setUpdating(true);
    try {
      await orderApi.updateStatus(updateOrder.id, { status: newStatus, trackingNumber: trackingNumber || undefined });
      toast.success('Order status updated');
      setUpdateOrder(null);
      setTrackingNumber('');
      fetchOrders();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const statusColors: Record<string, any> = {
    PENDING: 'warning', CONFIRMED: 'info', PROCESSING: 'info',
    SHIPPED: 'primary', OUT_FOR_DELIVERY: 'primary', DELIVERED: 'success',
    CANCELLED: 'error', RETURNED: 'default', REFUNDED: 'default',
  };

  const columns = useMemo<ColumnDef<Order, any>[]>(() => [
    columnHelper.accessor('orderNumber', {
      header: 'Order',
      cell: ({ getValue }) => (
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
          #{getValue()}
        </Typography>
      ),
    }),
    columnHelper.accessor('user', {
      header: 'Customer',
      cell: ({ row, getValue }) => {
        const u = getValue();
        const phone = u?.phone || orderAddress(row.original)?.phone;
        return (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {[u?.firstName, u?.lastName].filter(Boolean).join(' ') || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap display="block">
              {phone || u?.email || '—'}
            </Typography>
          </Box>
        );
      },
    }),
    columnHelper.display({
      id: 'deliverTo',
      header: 'Deliver to',
      cell: ({ row }) => {
        const a = orderAddress(row.original);
        if (!a) {
          return <Typography variant="caption" color="error.main">No address</Typography>;
        }
        return (
          <Box sx={{ minWidth: 0, maxWidth: 200 }}>
            <Typography variant="body2" noWrap>{a.city}, {a.state}</Typography>
            <Typography variant="caption" color="text.secondary" fontFamily="monospace">{a.pincode}</Typography>
          </Box>
        );
      },
    }),
    columnHelper.accessor('_count', {
      header: 'Items',
      cell: ({ getValue }) => (
        <Typography variant="body2" color="text.secondary">{getValue()?.items} items</Typography>
      ),
    }),
    columnHelper.display({
      id: 'method',
      header: 'Method',
      cell: ({ row }) => {
        const self = row.original.fulfilmentType === 'SELF';
        return (
          <Box>
            <Chip
              size="small"
              icon={self ? <DirectionsBike sx={{ fontSize: 13 }} /> : <LocalShipping sx={{ fontSize: 13 }} />}
              label={self ? 'Self' : 'Delhivery'}
              sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700,
                    bgcolor: self ? '#ede7f6' : '#e3f2fd' }}
            />
            {self && row.original.deliveryPartnerName && (
              <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mt: 0.25 }}>
                {row.original.deliveryPartnerName}
              </Typography>
            )}
          </Box>
        );
      },
    }),
    columnHelper.accessor('total', {
      header: 'Total',
      cell: ({ getValue }) => (
        <Typography variant="body2" fontWeight={700}>{formatPrice(getValue())}</Typography>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => (
        <Chip label={getValue()} size="small" color={statusColors[getValue()] || 'default'}
          sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
      ),
    }),
    columnHelper.accessor('paymentStatus', {
      header: 'Payment',
      cell: ({ getValue }) => (
        <Chip label={getValue()} size="small" variant="outlined"
          color={getValue() === 'PAID' ? 'success' : getValue() === 'FAILED' ? 'error' : 'warning'}
          sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Date',
      cell: ({ getValue }) => (
        <Typography variant="caption" color="text.secondary">{formatDate(getValue())}</Typography>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="View order">
            <IconButton size="small" onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/orders/${row.original.id}`);
            }}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Update Status">
            <IconButton size="small" onClick={(e) => {
              e.stopPropagation();
              setUpdateOrder(row.original);
              setNewStatus(row.original.status);
              setTrackingNumber('');
            }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    }),
  ], [router]);

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / PAGE_SIZE),
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
          Orders ({total})
        </Typography>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2.5 }}>
            <TextField
              placeholder="Search order no., name, phone, email or pincode…" size="small"
              value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              sx={{ maxWidth: 360, flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All Statuses</MenuItem>
                {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel>Delivery</InputLabel>
              <Select value={methodFilter} label="Delivery"
                onChange={(e) => { setMethodFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">All Methods</MenuItem>
                <MenuItem value="SELF">Self delivery</MenuItem>
                <MenuItem value="DELHIVERY">Delhivery</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((h) => (
                      <th key={h.id} style={{
                        padding: '10px 12px', textAlign: 'left',
                        borderBottom: '2px solid #f0f0f0', fontSize: '0.75rem',
                        fontWeight: 700, color: '#666', textTransform: 'uppercase',
                        letterSpacing: '0.06em', whiteSpace: 'nowrap',
                      }}>
                        {flexRender(h.column.columnDef.header, h.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} style={{ padding: 48, textAlign: 'center' }}>
                      <CircularProgress size={28} sx={{ color: '#1a1a1a' }} />
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} style={{ padding: 48, textAlign: 'center', color: '#999' }}>
                      No orders found
                    </td>
                  </tr>
                ) : table.getRowModel().rows.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer' }}
                    onClick={() => router.push(`/admin/orders/${row.original.id}`)}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fafafa')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>

          <TablePagination
            component="div"
            count={total}
            page={page}
            rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
            onPageChange={(_, p) => setPage(p)}
            sx={{ mt: 1, borderTop: '1px solid', borderColor: 'divider' }}
          />
        </CardContent>
      </Card>

      <Dialog open={!!updateOrder} onClose={() => setUpdateOrder(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Update Order Status</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Order: <strong>#{updateOrder?.orderNumber}</strong>
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>New Status</InputLabel>
            <Select value={newStatus} label="New Status" onChange={(e) => setNewStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          {(newStatus === 'SHIPPED' || newStatus === 'OUT_FOR_DELIVERY') && (
            <TextField
              label="Tracking Number" fullWidth size="small"
              value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setUpdateOrder(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained"
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}
            disabled={updating || !newStatus}>
            {updating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
