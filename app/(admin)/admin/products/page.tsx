'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Box, Typography, Button, Card, CardContent, TextField, InputAdornment,
  Chip, IconButton, Tooltip, Select, MenuItem, FormControl, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Avatar, Pagination, Stack,
} from '@mui/material';
import { Search, Add, Edit, Delete, FilterList, Refresh, FileDownload } from '@mui/icons-material';
import {
  useReactTable, getCoreRowModel, flexRender,
  createColumnHelper, ColumnDef,
} from '@tanstack/react-table';
import { productApi, categoryApi } from '../../../../services/api.service';
import { formatPrice, formatDate } from '../../../../utils/format';
import type { Product } from '../../../../types';
import toast from 'react-hot-toast';

const columnHelper = createColumnHelper<Product>();

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'WOMEN' | 'MEN' | 'UNISEX'>('all');
  // Priority orders products *within a category*, so arranging it means
  // filtering to one category first — the list is then exactly what a shopper
  // browsing that category sees.
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  // Priority edits are staged rather than saved per keystroke, so renumbering a
  // page of products is one request instead of one per digit typed.
  const [priorityEdits, setPriorityEdits] = useState<Record<string, number>>({});
  const [savingPriority, setSavingPriority] = useState(false);
  const [exporting, setExporting] = useState(false);
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    categoryApi.getAll({ limit: 200 })
      .then(({ data }) => setCategories(((data as any).data || data || []) as any))
      .catch(() => setCategories([]));
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Admin endpoint: includes drafts. The public /products hides everything
      // inactive, which made deactivated and imported products unreachable.
      const { data } = await productApi.getAllAdmin({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
        gender: genderFilter === 'all' ? undefined : genderFilter,
      });
      setProducts(data.data || []);
      setTotal(data.meta?.total || 0);
      setPriorityEdits({});
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Downloads every product matching the current filters, not the page on
   * screen — the server builds the file, so the browser never has to hold the
   * whole catalogue. The same filters go over as the listing uses.
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await productApi.exportAdmin({
        search: debouncedSearch || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
        gender: genderFilter === 'all' ? undefined : genderFilter,
      });

      // The server names the file after the filters and the date; honour it
      // rather than inventing a name here that would say less.
      const disposition = (res.headers as any)?.['content-disposition'] || '';
      const match = /filename="?([^"]+)"?/.exec(disposition);
      const filename = match?.[1] || 'products.xlsx';

      const url = URL.createObjectURL(res.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${filename}`);
    } catch {
      toast.error('Could not build the export');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, debouncedSearch, statusFilter, categoryFilter, genderFilter]);
  // Any filter change invalidates the current page number.
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, categoryFilter, genderFilter]);

  const dirtyPriorities = Object.entries(priorityEdits).filter(([id, value]) => {
    const current = products.find(p => p.id === id)?.sortOrder ?? 0;
    return value !== current;
  });

  const handleSavePriorities = async () => {
    if (!dirtyPriorities.length) return;
    setSavingPriority(true);
    try {
      await productApi.updatePositions(
        dirtyPriorities.map(([id, sortOrder]) => ({ id, sortOrder }))
      );
      toast.success(`Order updated for ${dirtyPriorities.length} product${dirtyPriorities.length > 1 ? 's' : ''}`);
      // Refetch rather than patch in place: the new priorities change which
      // products belong on this page of the sorted list.
      fetchProducts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update order');
    } finally {
      setSavingPriority(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await productApi.delete(deleteId);
      toast.success('Product deleted');
      setDeleteId(null);
      fetchProducts();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<ColumnDef<Product, any>[]>(() => [
    columnHelper.display({
      id: 'image',
      header: '',
      cell: ({ row }) => (
        <Avatar
          src={row.original.images?.[0]?.url}
          variant="rounded"
          sx={{ width: 44, height: 59, bgcolor: '#f5f5f5' }}
        />
      ),
    }),
    columnHelper.display({
      id: 'priority',
      header: 'Priority',
      cell: ({ row }) => {
        const id = row.original.id;
        const value = priorityEdits[id] ?? row.original.sortOrder ?? 0;
        const changed = value !== (row.original.sortOrder ?? 0);
        return (
          <TextField
            type="number"
            size="small"
            value={value}
            onChange={(e) => {
              const n = e.target.value === '' ? 0 : Math.trunc(Number(e.target.value));
              if (Number.isNaN(n)) return;
              setPriorityEdits((prev) => ({ ...prev, [id]: n }));
            }}
            // The row is a link target in places; keep clicks on the input local.
            onClick={(e) => e.stopPropagation()}
            inputProps={{ style: { padding: '6px 8px', width: 52, textAlign: 'center', fontWeight: 700 } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: changed ? '#fff8e1' : 'transparent',
                '& fieldset': { borderColor: changed ? '#c9a84c' : 'rgba(0,0,0,0.15)' },
              },
            }}
          />
        );
      },
    }),
    columnHelper.accessor('name', {
      header: 'Product',
      cell: ({ getValue, row }) => (
        <Box>
          <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 220 }}>
            {getValue()}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {row.original.sku && `SKU: ${row.original.sku}`}
          </Typography>
        </Box>
      ),
    }),
    columnHelper.accessor('category', {
      header: 'Category',
      cell: ({ getValue }) => (
        <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', px: 1, py: 0.5, borderRadius: 1 }}>
          {getValue()?.name || '—'}
        </Typography>
      ),
    }),
    columnHelper.accessor('basePrice', {
      header: 'Price',
      cell: ({ getValue, row }) => (
        <Box>
          <Typography variant="body2" fontWeight={700}>{formatPrice(row.original.salePrice || getValue())}</Typography>
          {row.original.salePrice && (
            <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
              {formatPrice(getValue())}
            </Typography>
          )}
        </Box>
      ),
    }),
    columnHelper.accessor('stockQuantity', {
      header: 'Stock',
      cell: ({ getValue }) => (
        <Chip
          label={getValue()}
          size="small"
          color={getValue() === 0 ? 'error' : getValue() < 10 ? 'warning' : 'default'}
          sx={{ fontWeight: 700 }}
        />
      ),
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: ({ getValue }) => (
        <Chip
          label={getValue() ? 'Active' : 'Inactive'}
          size="small"
          color={getValue() ? 'success' : 'default'}
          sx={{ fontWeight: 700 }}
        />
      ),
    }),
    columnHelper.display({
      id: 'flags',
      header: 'Flags',
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {row.original.isFeatured && <Chip label="Featured" size="small" sx={{ bgcolor: '#c9a84c', color: 'white', height: 18, fontSize: '0.6rem' }} />}
          {row.original.isTrending && <Chip label="Trending" size="small" sx={{ bgcolor: '#1976d2', color: 'white', height: 18, fontSize: '0.6rem' }} />}
          {row.original.isNewArrival && <Chip label="New" size="small" sx={{ bgcolor: '#2e7d32', color: 'white', height: 18, fontSize: '0.6rem' }} />}
        </Box>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: ({ getValue }) => (
        <Typography variant="caption" color="text.secondary">{formatDate(getValue())}</Typography>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton size="small" component={Link} href={`/admin/products/${row.original.id}`}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setDeleteId(row.original.id)} sx={{ color: '#d32f2f' }}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    }),
  ], [priorityEdits]);

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / limit),
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
            Products ({total})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Priority orders products inside a category — higher shows first, 0 is the default.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
          {dirtyPriorities.length > 0 && (
            <Button
              onClick={handleSavePriorities}
              disabled={savingPriority}
              variant="contained"
              sx={{ bgcolor: '#c9a84c', color: '#111', fontWeight: 700, '&:hover': { bgcolor: '#a8872a' } }}
            >
              {savingPriority ? 'Saving…' : `Save order (${dirtyPriorities.length})`}
            </Button>
          )}
          <Button startIcon={<Refresh />} onClick={fetchProducts} variant="outlined" sx={{ borderColor: '#e0e0e0' }}>
            Refresh
          </Button>
          <Button
            startIcon={exporting ? <CircularProgress size={16} /> : <FileDownload />}
            onClick={handleExport}
            disabled={exporting}
            variant="outlined"
            sx={{ borderColor: '#e0e0e0' }}
          >
            {exporting ? 'Preparing…' : 'Export Excel'}
          </Button>
          <Button startIcon={<Add />} component={Link} href="/admin/products/add" variant="contained" sx={{ bgcolor: '#1a1a1a' }}>
            Add Product
          </Button>
        </Stack>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
            <TextField
              placeholder="Search products..."
              size="small"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
              sx={{ maxWidth: 360, flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                startAdornment={<InputAdornment position="start"><FilterList fontSize="small" /></InputAdornment>}
              >
                <MenuItem value="all">All categories</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 130 }}>
              <Select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value as any)}>
                <MenuItem value="all">All genders</MenuItem>
                <MenuItem value="WOMEN">Women</MenuItem>
                <MenuItem value="MEN">Men</MenuItem>
                <MenuItem value="UNISEX">Unisex</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'draft')}
              >
                <MenuItem value="all">All statuses</MenuItem>
                <MenuItem value="active">Active only</MenuItem>
                <MenuItem value="draft">Drafts only</MenuItem>
              </Select>
            </FormControl>
            {(categoryFilter !== 'all' || genderFilter !== 'all' || statusFilter !== 'all' || search) && (
              <Button
                size="small"
                onClick={() => { setCategoryFilter('all'); setGenderFilter('all'); setStatusFilter('all'); setSearch(''); }}
                sx={{ color: '#888', whiteSpace: 'nowrap' }}
              >
                Clear
              </Button>
            )}
          </Box>

          {/* Priority is only meaningful within one category, so say so where
              the admin is about to type numbers into it. */}
          <Box sx={{
            mb: 2.5, px: 2, py: 1.25, borderRadius: 1,
            bgcolor: categoryFilter === 'all' ? '#fff8e1' : '#f1f8e9',
            border: '1px solid',
            borderColor: categoryFilter === 'all' ? '#ffe082' : '#c5e1a5',
          }}>
            <Typography variant="caption" sx={{ color: '#5d4037' }}>
              {categoryFilter === 'all'
                ? 'Priority orders products within a category. Pick a category above to arrange it — the list will then match what shoppers see on that category page.'
                : `Showing this category in shopper order. Highest priority first; edit the numbers and press Save order.`}
            </Typography>
          </Box>

          {/* Table */}
          <Box sx={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th key={header.id} style={{
                        padding: '10px 12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0',
                        fontSize: '0.75rem', fontWeight: 700, color: '#666', letterSpacing: '0.06em',
                        textTransform: 'uppercase', whiteSpace: 'nowrap',
                      }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={columns.length} style={{ padding: '48px', textAlign: 'center' }}>
                      <CircularProgress size={28} sx={{ color: '#1a1a1a' }} />
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} style={{ padding: '48px', textAlign: 'center', color: '#999' }}>
                      No products found
                    </td>
                  </tr>
                ) : table.getRowModel().rows.map((row) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #f5f5f5' }}
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

          {/* Pagination */}
          {total > limit && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(total / limit)}
                page={page}
                onChange={(_, v) => setPage(v)}
                sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#1a1a1a', color: 'white' } }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Delete dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Product</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this product? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteId(null)} variant="outlined">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" sx={{ bgcolor: '#d32f2f' }} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
