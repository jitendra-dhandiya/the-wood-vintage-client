'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Avatar, Chip, IconButton,
  Stack, Skeleton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControlLabel, Switch, TablePagination, InputAdornment,
  Divider, List, ListItem, ListItemAvatar, ListItemText, CircularProgress,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Search, Inventory2, Remove, Close } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { collectionApi, productApi } from '../../../../services/api.service';
import { toast } from 'react-hot-toast';
import { useImageCropper } from '../../../../components/common/ImageCropperProvider';

const PAGE_SIZE = 20;
const schema = Yup.object({ name: Yup.string().required('Name required'), description: Yup.string() });

// ── Manage Products Dialog ─────────────────────────────────────────────────────
function ManageProductsDialog({
  collection,
  open,
  onClose,
}: {
  collection: any;
  open: boolean;
  onClose: () => void;
}) {
  const [colProducts, setColProducts] = useState<any[]>([]);
  const [colLoading, setColLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadCollectionProducts = useCallback(async () => {
    if (!collection) return;
    setColLoading(true);
    try {
      const { data } = await collectionApi.getProducts(collection.id, { limit: 100 });
      setColProducts((data as any).data || []);
    } catch { setColProducts([]); }
    finally { setColLoading(false); }
  }, [collection]);

  useEffect(() => {
    if (open && collection) {
      loadCollectionProducts();
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [open, collection, loadCollectionProducts]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const { data } = await productApi.getAll({ search: searchQuery.trim(), limit: 10 });
        const results = (data as any).data || [];
        const colIds = new Set(colProducts.map((p: any) => p.id));
        setSearchResults(results.filter((p: any) => !colIds.has(p.id)));
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 350);
  }, [searchQuery, colProducts]);

  const handleAdd = async (product: any) => {
    setAddingId(product.id);
    try {
      await collectionApi.addProduct(collection.id, product.id);
      toast.success(`"${product.name}" added`);
      await loadCollectionProducts();
      setSearchResults(prev => prev.filter(p => p.id !== product.id));
    } catch { toast.error('Failed to add product'); }
    finally { setAddingId(null); }
  };

  const handleRemove = async (product: any) => {
    setRemovingId(product.id);
    try {
      await collectionApi.removeProduct(collection.id, product.id);
      toast.success(`"${product.name}" removed`);
      setColProducts(prev => prev.filter(p => p.id !== product.id));
    } catch { toast.error('Failed to remove product'); }
    finally { setRemovingId(null); }
  };

  if (!collection) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>{collection.name}</Typography>
          <Typography variant="caption" color="text.secondary">Manage products in this collection</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Search to add */}
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Add Products</Typography>
          <TextField
            size="small" fullWidth
            placeholder="Search by product name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              endAdornment: searchLoading ? <CircularProgress size={14} /> : null,
            }}
          />

          {searchResults.length > 0 && (
            <Box sx={{ mt: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, maxHeight: 200, overflow: 'auto' }}>
              {searchResults.map(p => (
                <Box
                  key={p.id}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1,
                    borderBottom: '1px solid', borderColor: 'divider',
                    '&:last-child': { borderBottom: 'none' },
                  }}
                >
                  <Avatar
                    src={p.images?.[0]?.url}
                    variant="rounded"
                    sx={{ width: 36, height: 44, bgcolor: '#f5f5f5', flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={600} noWrap display="block">{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ₹{p.salePrice || p.basePrice}
                      {p.category?.name && ` · ${p.category.name}`}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={addingId === p.id}
                    onClick={() => handleAdd(p)}
                    sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, flexShrink: 0, minWidth: 56 }}
                  >
                    {addingId === p.id ? <CircularProgress size={14} sx={{ color: 'white' }} /> : 'Add'}
                  </Button>
                </Box>
              ))}
            </Box>
          )}

          {searchQuery.trim().length >= 2 && !searchLoading && searchResults.length === 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              No products found or all matching products are already in this collection.
            </Typography>
          )}
        </Box>

        {/* Current products */}
        <Box sx={{ px: 3, py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700}>
              In this collection
            </Typography>
            <Chip label={colProducts.length} size="small" sx={{ bgcolor: '#f0f0f0', fontWeight: 700 }} />
          </Box>

          {colLoading ? (
            <Stack spacing={1}>
              {[0, 1, 2].map(i => <Skeleton key={i} height={56} sx={{ borderRadius: 1 }} />)}
            </Stack>
          ) : colProducts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Inventory2 sx={{ fontSize: 36, color: '#ddd', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No products yet. Search above to add some.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0.75} sx={{ maxHeight: 320, overflow: 'auto' }}>
              {colProducts.map(p => (
                <Box
                  key={p.id}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 1.5, py: 1, borderRadius: 1,
                    border: '1px solid', borderColor: 'divider',
                    bgcolor: '#fafafa',
                  }}
                >
                  <Avatar
                    src={p.images?.[0]?.url}
                    variant="rounded"
                    sx={{ width: 36, height: 44, bgcolor: '#f5f5f5', flexShrink: 0 }}
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" fontWeight={600} noWrap display="block">{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ₹{p.salePrice || p.basePrice}
                      {p.category?.name && ` · ${p.category.name}`}
                    </Typography>
                  </Box>
                  <Chip
                    label={p.isActive ? 'Active' : 'Inactive'}
                    size="small"
                    color={p.isActive ? 'success' : 'default'}
                    sx={{ fontSize: '0.6rem', height: 18, flexShrink: 0 }}
                  />
                  <Tooltip title="Remove from collection">
                    <IconButton
                      size="small"
                      color="error"
                      disabled={removingId === p.id}
                      onClick={() => handleRemove(p)}
                    >
                      {removingId === p.id
                        ? <CircularProgress size={14} color="error" />
                        : <Remove fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary' }}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CollectionsPage() {
  const cropImage = useImageCropper();
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editCol, setEditCol] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  // The wide artwork behind the collection title on the storefront. Separate
  // from the card image: one is a 4:3 tile in a grid, the other a 3:1 strip.
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [bannerCleared, setBannerCleared] = useState(false);
  const [manageCol, setManageCol] = useState<any>(null);

  const fetchCollections = useCallback(() => {
    setLoading(true);
    collectionApi.getAll({ page: page + 1, limit: PAGE_SIZE, search: search || undefined })
      .then(({ data }) => {
        const d = data as any;
        setCollections(d.data || []);
        setTotal(d.meta?.total || 0);
      }).finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchCollections, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchCollections, search]);

  const formik = useFormik({
    initialValues: { name: '', description: '', isActive: true, isFeatured: false },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => fd.append(k, String(v)));
        if (imageFile) fd.append('image', imageFile);
        if (bannerFile) fd.append('bannerImage', bannerFile);
        // An explicit empty value is how the server is told to clear it.
        else if (bannerCleared) fd.append('bannerImage', '');
        if (editCol) {
          await collectionApi.update(editCol.id, fd);
          toast.success('Collection updated');
        } else {
          await collectionApi.create(fd);
          toast.success('Collection created');
        }
        closeDialog();
        fetchCollections();
      } catch {
        toast.error('Save failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const openCreate = () => {
    setEditCol(null); setImageFile(null); setImagePreview('');
    setBannerFile(null); setBannerPreview(''); setBannerCleared(false);
    formik.resetForm(); setDialogOpen(true);
  };
  const openEdit = (c: any) => {
    setEditCol(c); setImagePreview(c.image || ''); setImageFile(null);
    setBannerPreview(c.bannerImage || ''); setBannerFile(null); setBannerCleared(false);
    formik.setValues({ name: c.name, description: c.description || '', isActive: c.isActive ?? true, isFeatured: c.isFeatured ?? false });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditCol(null); formik.resetForm(); };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection? Products will not be deleted.')) return;
    try {
      await collectionApi.delete(id);
      toast.success('Deleted');
      fetchCollections();
    } catch { toast.error('Delete failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>Collections</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>Add Collection</Button>
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <TextField size="small" placeholder="Search collections..." sx={{ width: 280 }}
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
      </Box>

      {loading ? (
        <Stack spacing={1.5}>{[...Array(6)].map((_, i) => <Skeleton key={i} height={80} sx={{ borderRadius: 2 }} />)}</Stack>
      ) : (
        <>
          <Stack spacing={1.5}>
            {collections.map(c => (
              <Card key={c.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={c.image} variant="rounded" sx={{ width: 60, height: 70, bgcolor: '#f5f5f5' }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                    {c.description && <Typography variant="caption" color="text.secondary" noWrap>{c.description}</Typography>}
                    <Typography variant="caption" color="text.secondary" display="block">
                      Slug: /{c.slug} · {c._count?.products ?? 0} products
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {c.isFeatured && <Chip label="Featured" size="small" color="secondary" sx={{ height: 20, fontSize: '0.6rem' }} />}
                    <Chip label={c.isActive ? 'Active' : 'Inactive'} size="small" color={c.isActive ? 'success' : 'default'} />
                    <Tooltip title="Manage Products">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Inventory2 fontSize="small" />}
                        onClick={() => setManageCol(c)}
                        sx={{ borderColor: '#1a1a1a', color: '#1a1a1a', fontSize: '0.7rem', px: 1.5 }}
                      >
                        Products ({c._count?.products ?? 0})
                      </Button>
                    </Tooltip>
                    <IconButton size="small" onClick={() => openEdit(c)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(c.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
            {collections.length === 0 && (
              <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>No collections found</Typography>
            )}
          </Stack>

          <TablePagination
            component="div" count={total} page={page} rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
            onPageChange={(_, p) => setPage(p)}
            sx={{ mt: 2 }}
          />
        </>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editCol ? 'Edit Collection' : 'Add Collection'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Box>
              {imagePreview && <Box component="img" src={imagePreview} sx={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 1, mb: 1 }} />}
              <Button variant="outlined" component="label" size="small">
                {imagePreview ? 'Change Image' : 'Upload Image'}
                <input type="file" hidden accept="image/*" onChange={async e => {
                  const f = e.target.files?.[0];
                  // Cleared before the await so re-picking the same file after
                  // cancelling the cropper still fires onChange.
                  e.target.value = '';
                  if (!f) return;
                  const cropped = await cropImage(f, 'collection');
                  if (cropped) { setImageFile(cropped); setImagePreview(URL.createObjectURL(cropped)); }
                }} />
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                The card shown in the collections grid. 4:3.
              </Typography>
            </Box>

            {/* Wide hero artwork */}
            <Box>
              <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.75, color: 'text.secondary' }}>
                COLLECTION PAGE BANNER
              </Typography>
              {bannerPreview && (
                <Box component="img" src={bannerPreview}
                  sx={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 1, mb: 1 }} />
              )}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="outlined" component="label" size="small">
                  {bannerPreview ? 'Change Banner' : 'Upload Banner'}
                  <input type="file" hidden accept="image/*" onChange={async e => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    const cropped = await cropImage(f, 'collectionBanner');
                    if (cropped) {
                      setBannerFile(cropped);
                      setBannerPreview(URL.createObjectURL(cropped));
                      setBannerCleared(false);
                    }
                  }} />
                </Button>
                {bannerPreview && (
                  <Button
                    size="small"
                    onClick={() => { setBannerFile(null); setBannerPreview(''); setBannerCleared(true); }}
                    sx={{ color: '#d32f2f' }}
                  >
                    Remove
                  </Button>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                Sits behind the collection title. Without one the card image is used, and without
                that the plain dark header — so this is optional.
              </Typography>
            </Box>

            <TextField label="Name" size="small" fullWidth required
              {...formik.getFieldProps('name')}
              error={formik.touched.name && !!formik.errors.name}
              helperText={formik.touched.name && formik.errors.name} />
            <TextField label="Description" size="small" fullWidth multiline rows={2} {...formik.getFieldProps('description')} />
            <FormControlLabel control={<Switch checked={formik.values.isActive} onChange={e => formik.setFieldValue('isActive', e.target.checked)} />} label="Active" />
            <FormControlLabel control={<Switch checked={formik.values.isFeatured} onChange={e => formik.setFieldValue('isFeatured', e.target.checked)} />} label="Featured" />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting}
              sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
              {editCol ? 'Save' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Manage Products dialog */}
      <ManageProductsDialog
        collection={manageCol}
        open={Boolean(manageCol)}
        onClose={() => { setManageCol(null); fetchCollections(); }}
      />
    </Box>
  );
}
