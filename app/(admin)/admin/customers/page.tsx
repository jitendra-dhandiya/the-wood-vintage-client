'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Avatar, Chip, TextField,
  InputAdornment, IconButton, Table, TableBody, TableCell, TableHead,
  TableRow, TablePagination, Skeleton, Button, Dialog, DialogTitle,
  DialogContent, DialogActions,
} from '@mui/material';
import { Search, Visibility, Block, CheckCircle } from '@mui/icons-material';
import { userApi } from '../../../../services/api.service';
import { formatDate, formatPrice } from '../../../../utils/format';
import { toast } from 'react-hot-toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [viewCustomer, setViewCustomer] = useState<any>(null);
  const [confirmBlock, setConfirmBlock] = useState<any>(null);

  const fetchCustomers = useCallback(() => {
    setLoading(true);
    userApi.getAll({ page: page + 1, limit: rowsPerPage, search, role: 'CUSTOMER' })
      .then(({ data }) => {
        setCustomers(data.data || []);
        setTotal(data.meta?.total || 0);
      }).finally(() => setLoading(false));
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchCustomers, search]);

  const handleToggleBlock = async () => {
    if (!confirmBlock) return;
    try {
      await userApi.update(confirmBlock.id, { isActive: !confirmBlock.isActive });
      toast.success(confirmBlock.isActive ? 'Customer blocked' : 'Customer unblocked');
      setConfirmBlock(null);
      fetchCustomers();
    } catch {
      toast.error('Action failed');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 3 }}>
        Customers
      </Typography>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <TextField
              size="small" placeholder="Search customers..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
              sx={{ width: 280 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
            />
            <Typography variant="body2" color="text.secondary">{total} customers</Typography>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                {['Customer', 'Email', 'Phone', 'Orders', 'Joined', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}
                  </TableRow>
                ))
              ) : customers.map(c => (
                <TableRow key={c.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={c.avatar} sx={{ width: 32, height: 32, fontSize: 13 }}>
                        {c.firstName?.[0]}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {c.firstName} {c.lastName}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{c.email}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{c.phone || '—'}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{c._count?.orders ?? 0}</TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(c.createdAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={c.isActive ? 'Active' : 'Blocked'}
                      color={c.isActive ? 'success' : 'error'}
                      size="small"
                      sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => setViewCustomer(c)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color={c.isActive ? 'error' : 'success'}
                        onClick={() => setConfirmBlock(c)}>
                        {c.isActive ? <Block fontSize="small" /> : <CheckCircle fontSize="small" />}
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <TablePagination
            component="div" count={total} page={page} rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 20, 50]}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
          />
        </CardContent>
      </Card>

      {/* Customer detail dialog */}
      <Dialog open={!!viewCustomer} onClose={() => setViewCustomer(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Customer Details</DialogTitle>
        <DialogContent>
          {viewCustomer && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={viewCustomer.avatar} sx={{ width: 64, height: 64, fontSize: 24 }}>
                  {viewCustomer.firstName?.[0]}
                </Avatar>
                <Box>
                  <Typography fontWeight={700}>{viewCustomer.firstName} {viewCustomer.lastName}</Typography>
                  <Typography variant="body2" color="text.secondary">{viewCustomer.email}</Typography>
                  {viewCustomer.phone && <Typography variant="body2">{viewCustomer.phone}</Typography>}
                </Box>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box><Typography variant="caption" color="text.secondary">Total Orders</Typography>
                  <Typography fontWeight={700}>{viewCustomer._count?.orders ?? 0}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Joined</Typography>
                  <Typography fontWeight={700}>{formatDate(viewCustomer.createdAt)}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Role</Typography>
                  <Typography fontWeight={700}>{viewCustomer.role}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip label={viewCustomer.isActive ? 'Active' : 'Blocked'}
                    color={viewCustomer.isActive ? 'success' : 'error'} size="small" /></Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setViewCustomer(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Block/Unblock confirmation */}
      <Dialog open={!!confirmBlock} onClose={() => setConfirmBlock(null)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>
          {confirmBlock?.isActive ? 'Block Customer' : 'Unblock Customer'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmBlock?.isActive
              ? `Block ${confirmBlock?.firstName} ${confirmBlock?.lastName}? They will not be able to log in.`
              : `Unblock ${confirmBlock?.firstName} ${confirmBlock?.lastName}? They will regain access.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setConfirmBlock(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleToggleBlock} variant="contained"
            sx={{ bgcolor: confirmBlock?.isActive ? '#d32f2f' : '#2e7d32', '&:hover': { bgcolor: confirmBlock?.isActive ? '#b71c1c' : '#1b5e20' } }}>
            {confirmBlock?.isActive ? 'Block' : 'Unblock'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
