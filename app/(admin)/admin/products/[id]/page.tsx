'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField,
  MenuItem, FormControlLabel, Switch, Chip, IconButton, Divider,
  Skeleton, CircularProgress, Alert, Table, TableHead, TableBody,
  TableRow, TableCell, Dialog, DialogTitle, DialogContent,
  DialogActions, DialogContentText,
} from '@mui/material';
import { Add, Remove, ArrowBack, Delete, Edit } from '@mui/icons-material';
import { useFormik, FormikProvider } from 'formik';
import * as Yup from 'yup';
import { productApi, categoryApi, variantApi } from '../../../../../services/api.service';
import { GENDERS } from '../../../../../constants';
import { toast } from 'react-hot-toast';
import SortableImageGrid, { type SortableImage } from '../../../../../components/admin/SortableImageGrid';

const schema = Yup.object({
  name: Yup.string().required('Product name required'),
  description: Yup.string().required('Description required'),
  basePrice: Yup.number().positive().required('Price required'),
  categoryId: Yup.string().required('Category required'),
});

/** Matches the add-product default. A new variant at 0 would be created
  * already hidden from customers, since zero-stock sizes are not listed. */
const DEFAULT_VARIANT_STOCK = 2;

const emptyVariantForm = () => ({ color: '', colorHex: '', size: '', stockQuantity: DEFAULT_VARIANT_STOCK, price: '', isActive: true });

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loadError, setLoadError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  // Ordered grid keys: existing image ids and `new:<n>` upload placeholders.
  const [imageOrder, setImageOrder] = useState<string[]>([]);
  // Colour tag per grid key. Keyed, not positional, because this form never
  // moves the underlying arrays — only the order of the keys.
  const [imageColors, setImageColors] = useState<Record<string, string | null>>({});
  const [tagInput, setTagInput] = useState('');

  // Variant CRUD state
  const [variants, setVariants] = useState<any[]>([]);
  const [variantDialog, setVariantDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; data?: any }>({ open: false, mode: 'add' });
  const [variantForm, setVariantForm] = useState(emptyVariantForm());
  const [variantSaving, setVariantSaving] = useState(false);
  const [deleteVariantId, setDeleteVariantId] = useState<string | null>(null);

  useEffect(() => {
    categoryApi.getAll({ limit: 100 }).then(({ data }) => setCategories((data as any).data || data || []));
  }, []);

  useEffect(() => {
    if (!id) return;
    productApi.getById(id)
      .then(({ data }) => {
        const p = (data as any).data;
        setProduct(p);
        setVariants(p?.variants || []);
        // Server returns images already sorted by position.
        setImageOrder((p?.images || []).map((img: any) => img.id));
        setImageColors(
          Object.fromEntries((p?.images || []).map((img: any) => [img.id, img.color ?? null]))
        );
      })
      .catch(() => setLoadError('Product not found'));
  }, [id]);

  const reloadVariants = async () => {
    try {
      const { data } = await variantApi.getAll(id);
      setVariants((data as any).data || []);
    } catch {}
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: product?.name || '',
      description: product?.description || '',
      shortDesc: product?.shortDesc || '',
      basePrice: product?.basePrice || '',
      salePrice: product?.salePrice || '',
      sku: product?.sku || '',
      brand: product?.brand || '',
      categoryId: product?.categoryId || '',
      gender: product?.gender || 'UNISEX',
      stockQuantity: product?.stockQuantity ?? 0,
      isActive: product?.isActive ?? true,
      isFeatured: product?.isFeatured ?? false,
      sortOrder: product?.sortOrder ?? 0,
      isTrending: product?.isTrending ?? false,
      isNewArrival: product?.isNewArrival ?? true,
      isBestSeller: product?.isBestSeller ?? false,
      fabric: product?.fabric || '',
      careInstructions: product?.careInstructions || '',
      metaTitle: product?.metaTitle || '',
      metaDesc: product?.metaDesc || '',
      tags: (product?.tags?.map((t: any) => t.tag) || []) as string[],
      standardShippingCharge: product?.standardShippingCharge ?? '',
      codShippingCharge: product?.codShippingCharge ?? '',
      expressShippingCharge: product?.expressShippingCharge ?? '',
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const fd = new FormData();
        fd.append('name', values.name);
        fd.append('description', values.description);
        if (values.shortDesc) fd.append('shortDesc', values.shortDesc);
        fd.append('basePrice', String(values.basePrice));
        if (values.salePrice) fd.append('salePrice', String(values.salePrice));
        if (values.sku) fd.append('sku', values.sku);
        if (values.brand) fd.append('brand', values.brand);
        fd.append('categoryId', values.categoryId);
        fd.append('stockQuantity', String(values.stockQuantity));
        fd.append('gender', values.gender);
        fd.append('isActive', String(values.isActive));
        fd.append('sortOrder', String(values.sortOrder === '' ? 0 : values.sortOrder));
        fd.append('isFeatured', String(values.isFeatured));
        fd.append('isTrending', String(values.isTrending));
        fd.append('isNewArrival', String(values.isNewArrival));
        fd.append('isBestSeller', String(values.isBestSeller));
        if (values.fabric) fd.append('fabric', values.fabric);
        if (values.careInstructions) fd.append('careInstructions', values.careInstructions);
        if (values.metaTitle) fd.append('metaTitle', values.metaTitle);
        if (values.metaDesc) fd.append('metaDesc', values.metaDesc);
        fd.append('tags', JSON.stringify(values.tags));
        if (values.standardShippingCharge !== '') fd.append('standardShippingCharge', String(values.standardShippingCharge));
        if (values.codShippingCharge !== '') fd.append('codShippingCharge', String(values.codShippingCharge));
        if (values.expressShippingCharge !== '') fd.append('expressShippingCharge', String(values.expressShippingCharge));
        if (removedImageIds.length) fd.append('removeImageIds', JSON.stringify(removedImageIds));

        // Compact the tombstoned uploads, then remap the `new:<n>` tokens so
        // each one points at the file's index in what actually gets sent —
        // that index is how the backend resolves the token.
        const tokenRemap = new Map<string, string>();
        let sent = 0;
        newImages.forEach((file, i) => {
          if (!file) return;
          fd.append('images', file);
          tokenRemap.set(`new:${i}`, `new:${sent}`);
          sent += 1;
        });

        fd.append(
          'imageOrder',
          JSON.stringify(imageOrder.map(k => tokenRemap.get(k) ?? k)),
        );

        // Same remap: a pending file's token shifts when an earlier pending
        // file was removed, and its colour has to travel with it.
        fd.append(
          'imageColors',
          JSON.stringify(
            Object.fromEntries(
              Object.entries(imageColors)
                .filter(([key]) => imageOrder.includes(key))
                .map(([key, color]) => [tokenRemap.get(key) ?? key, color])
            )
          ),
        );

        await productApi.update(id, fd);
        toast.success('Product updated!');
        router.push('/admin/products');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to update product');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleNewImages = (files: File[]) => {
    if (!files.length) return;
    setNewImages(prev => [...prev, ...files]);
    setNewPreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    // New files land at the end of the order; the admin drags them from there.
    setImageOrder(prev => [...prev, ...files.map((_, i) => `new:${newImages.length + i}`)]);
  };

  /**
   * Remove by grid key — an existing image id, or `new:<n>` for a pending file.
   *
   * Pending files are tombstoned rather than spliced out of the array: their
   * index IS the `new:<n>` token the backend resolves against the upload
   * order, so re-indexing here would silently repoint every later token at the
   * wrong file. Nulls are compacted once, at submit.
   */
  const removeImage = (key: string) => {
    if (key.startsWith('new:')) {
      const i = Number(key.slice(4));
      setNewImages(prev => prev.map((f, idx) => (idx === i ? null : f)) as any);
      setNewPreviews(prev => prev.map((src, idx) => (idx === i ? null : src)) as any);
    } else {
      setRemovedImageIds(prev => [...prev, key]);
    }
    setImageOrder(prev => prev.filter(k => k !== key));
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formik.values.tags.includes(tag)) {
      formik.setFieldValue('tags', [...formik.values.tags, tag]);
    }
    setTagInput('');
  };

  // Variant handlers
  const openVariantDialog = (mode: 'add' | 'edit', v?: any) => {
    if (mode === 'edit' && v) {
      setVariantForm({
        color: v.color || '',
        colorHex: v.colorHex || '#000000',
        size: v.size || '',
        stockQuantity: v.stockQuantity ?? 0,
        price: v.price != null ? String(v.price) : '',
        isActive: v.isActive ?? true,
      });
    } else {
      setVariantForm(emptyVariantForm());
    }
    setVariantDialog({ open: true, mode, data: v });
  };

  const saveVariant = async () => {
    setVariantSaving(true);
    try {
      if (variantDialog.mode === 'add') {
        await variantApi.create(id, variantForm);
        toast.success('Variant added');
      } else {
        await variantApi.update(id, variantDialog.data.id, variantForm);
        toast.success('Variant updated');
      }
      setVariantDialog({ open: false, mode: 'add' });
      await reloadVariants();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save variant');
    } finally {
      setVariantSaving(false);
    }
  };

  const confirmDeleteVariant = async () => {
    if (!deleteVariantId) return;
    try {
      await variantApi.delete(id, deleteVariantId);
      setVariants(prev => prev.filter(v => v.id !== deleteVariantId));
      toast.success('Variant deleted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete variant');
    } finally {
      setDeleteVariantId(null);
    }
  };

  const toggleVariantActive = async (variantId: string, isActive: boolean) => {
    try {
      await variantApi.update(id, variantId, { isActive });
      setVariants(prev => prev.map(v => v.id === variantId ? { ...v, isActive } : v));
    } catch {
      toast.error('Failed to update variant');
    }
  };

  if (loadError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{loadError}</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/admin/products')} sx={{ mt: 2 }}>
          Back to Products
        </Button>
      </Box>
    );
  }

  if (!product) {
    return (
      <Box>
        <Skeleton height={48} sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            {[...Array(4)].map((_, i) => <Skeleton key={i} height={160} sx={{ mb: 3, borderRadius: 2 }} />)}
          </Grid>
          <Grid item xs={12} lg={4}>
            <Skeleton height={200} sx={{ borderRadius: 2 }} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  /** Colours this product actually has variants for. */
  const variantColorNames: string[] = [
    ...new Set(
      (variants || []).map((v: any) => (v.color || '').trim()).filter(Boolean)
    ),
  ] as string[];

  const visibleExistingImages = product.images?.filter((img: any) => !removedImageIds.includes(img.id)) || [];
  const pendingCount = newPreviews.filter(Boolean).length;

  // One ordered list mixing saved images and pending uploads, so a file picked
  // seconds ago can be dragged into position 1 in the same save.
  const gridImages: SortableImage[] = imageOrder.flatMap((key): SortableImage[] => {
    if (key.startsWith('new:')) {
      const src = newPreviews[Number(key.slice(4))];
      return src ? [{ key, src, isNew: true }] : [];
    }
    const img = visibleExistingImages.find((i: any) => i.id === key);
    return img ? [{ key, src: img.url }] : [];
  });

  return (
    <FormikProvider value={formik}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => router.push('/admin/products')}><ArrowBack /></IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
              Edit Product
            </Typography>
            <Typography variant="caption" color="text.secondary">SKU: {product.sku} · ID: {id.slice(0, 8)}...</Typography>
          </Box>
          <Chip label={product.isActive ? 'Active' : 'Inactive'} color={product.isActive ? 'success' : 'default'} size="small" />
        </Box>

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Left column */}
            <Grid item xs={12} lg={8}>

              {/* Basic info */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Basic Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField label="Product Name" size="small" fullWidth required
                        {...formik.getFieldProps('name')}
                        error={formik.touched.name && !!formik.errors.name}
                        helperText={formik.touched.name && formik.errors.name as string} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Short Description" size="small" fullWidth multiline rows={2}
                        {...formik.getFieldProps('shortDesc')} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Full Description" size="small" fullWidth multiline rows={5} required
                        {...formik.getFieldProps('description')}
                        error={formik.touched.description && !!formik.errors.description}
                        helperText={formik.touched.description && formik.errors.description as string} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField label="Base Price (₹)" type="number" size="small" fullWidth required
                        {...formik.getFieldProps('basePrice')}
                        error={formik.touched.basePrice && !!formik.errors.basePrice}
                        helperText={formik.touched.basePrice && formik.errors.basePrice as string} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField label="Sale Price (₹)" type="number" size="small" fullWidth
                        {...formik.getFieldProps('salePrice')} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField label="SKU" size="small" fullWidth {...formik.getFieldProps('sku')} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField label="Brand" size="small" fullWidth {...formik.getFieldProps('brand')} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField select label="Category" size="small" fullWidth required
                        {...formik.getFieldProps('categoryId')}
                        error={formik.touched.categoryId && !!formik.errors.categoryId}
                        helperText={formik.touched.categoryId && formik.errors.categoryId as string}>
                        {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField select label="Gender" size="small" fullWidth {...formik.getFieldProps('gender')}>
                        {GENDERS.map(g => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField label="Stock Quantity" type="number" size="small" fullWidth
                        {...formik.getFieldProps('stockQuantity')} inputProps={{ min: 0 }} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Delivery Charges */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Delivery Charges</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Set custom delivery charges for this product. Leave blank to use the global rate (Standard ₹79 · COD ₹149 · Express ₹249).
                    For orders with multiple products, the highest charge applies.
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Standard Delivery (₹)"
                        type="number"
                        size="small"
                        fullWidth
                        placeholder="Global: ₹79"
                        {...formik.getFieldProps('standardShippingCharge')}
                        inputProps={{ min: 0 }}
                        InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 0.5, color: '#666' }}>₹</Typography> }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="COD Delivery (₹)"
                        type="number"
                        size="small"
                        fullWidth
                        placeholder="Global: ₹149"
                        {...formik.getFieldProps('codShippingCharge')}
                        inputProps={{ min: 0 }}
                        InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 0.5, color: '#666' }}>₹</Typography> }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Express Delivery (₹)"
                        type="number"
                        size="small"
                        fullWidth
                        placeholder="Global: ₹249"
                        {...formik.getFieldProps('expressShippingCharge')}
                        inputProps={{ min: 0 }}
                        InputProps={{ startAdornment: <Typography variant="caption" sx={{ mr: 0.5, color: '#666' }}>₹</Typography> }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Images */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
                    Product Images
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      ({visibleExistingImages.length} existing{pendingCount ? ` + ${pendingCount} new` : ''})
                    </Typography>
                  </Typography>
                  <SortableImageGrid
                    images={gridImages}
                    onReorder={(next) => setImageOrder(next.map(i => i.key))}
                    onRemove={removeImage}
                    onAdd={handleNewImages}
                    colorOptions={variantColorNames}
                    colorByKey={imageColors}
                    onColorChange={(key, color) =>
                      setImageColors(prev => ({ ...prev, [key]: color }))
                    }
                    helperText={
                      variantColorNames.length
                        ? 'Drag to reorder — image 1 is the cover. Tag a photo with a colour to show it when that colour is picked; leave it on "All colours" and it shows for every colour that has no photos of its own.'
                        : 'Drag to reorder — image 1 is the cover. Add colour variants below to tag photos per colour.'
                    }
                  />
                </CardContent>
              </Card>

              {/* Variants CRUD */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>Variants</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Only active variants are shown to customers
                      </Typography>
                    </Box>
                    <Button size="small" variant="outlined" startIcon={<Add />}
                      onClick={() => openVariantDialog('add')}
                      sx={{ borderRadius: 1.5 }}>
                      Add Variant
                    </Button>
                  </Box>

                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.72rem', color: 'text.secondary', py: 1 } }}>
                          <TableCell>Color</TableCell>
                          <TableCell>Size</TableCell>
                          <TableCell align="right">Stock</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="center">Visible</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {variants.map((v: any) => (
                          <TableRow key={v.id} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <TableCell>
                              {/* The name is the colour. Nothing renders a
                                  swatch any more, here or on the storefront. */}
                              <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                                {v.color || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption">{v.size || '—'}</Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption"
                                sx={{ color: v.stockQuantity === 0 ? 'error.main' : 'inherit', fontWeight: v.stockQuantity === 0 ? 700 : 400 }}>
                                {v.stockQuantity}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="caption">
                                {v.price != null ? `₹${v.price}` : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center" sx={{ py: 0 }}>
                              <Switch size="small" checked={v.isActive}
                                onChange={e => toggleVariantActive(v.id, e.target.checked)} />
                            </TableCell>
                            <TableCell align="right" sx={{ py: 0 }}>
                              <IconButton size="small" onClick={() => openVariantDialog('edit', v)}>
                                <Edit sx={{ fontSize: 15 }} />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={() => setDeleteVariantId(v.id)}>
                                <Delete sx={{ fontSize: 15 }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {variants.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                              <Typography variant="caption" color="text.secondary">
                                No variants yet. Add color &amp; size combinations.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </Box>
                </CardContent>
              </Card>

              {/* Product details */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Product Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField label="Fabric / Material" size="small" fullWidth {...formik.getFieldProps('fabric')} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Care Instructions" size="small" fullWidth multiline rows={2}
                        {...formik.getFieldProps('careInstructions')} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* SEO */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>SEO</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField label="Meta Title" size="small" fullWidth {...formik.getFieldProps('metaTitle')} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Meta Description" size="small" fullWidth multiline rows={2}
                        {...formik.getFieldProps('metaDesc')} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Right sidebar */}
            <Grid item xs={12} lg={4}>
              {/* Status */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Status</Typography>
                  <FormControlLabel
                    control={<Switch checked={formik.values.isActive}
                      onChange={e => formik.setFieldValue('isActive', e.target.checked)} />}
                    label={formik.values.isActive ? 'Active (visible on store)' : 'Inactive (hidden)'}
                  />
                </CardContent>
              </Card>

              {/* Flags */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Flags</Typography>
                  {(['isFeatured', 'isTrending', 'isNewArrival', 'isBestSeller'] as const).map(flag => (
                    <FormControlLabel key={flag}
                      control={<Switch size="small" checked={formik.values[flag]}
                        onChange={e => formik.setFieldValue(flag, e.target.checked)} />}
                      label={flag.replace('is', '').replace(/([A-Z])/g, ' $1').trim()}
                      sx={{ display: 'flex', mb: 0.5 }}
                    />
                  ))}
                  <TextField
                    label="Display Priority"
                    type="number"
                    size="small"
                    fullWidth
                    sx={{ mt: 2 }}
                    {...formik.getFieldProps('sortOrder')}
                    helperText="Orders this product inside its category — higher shows first. 0 is the default; a negative number pushes it down."
                  />
                </CardContent>
              </Card>

              {/* Tags */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Tags</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                    <TextField size="small" placeholder="Add tag" fullWidth
                      value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                    <Button size="small" onClick={addTag}><Add /></Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {formik.values.tags.map(tag => (
                      <Chip key={tag} label={tag} size="small" onDelete={() =>
                        formik.setFieldValue('tags', formik.values.tags.filter(t => t !== tag))} />
                    ))}
                  </Box>
                </CardContent>
              </Card>

              {/* Collections */}
              {product.collections?.length > 0 && (
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Collections</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {product.collections.map((pc: any) => (
                        <Chip key={pc.collectionId} label={pc.collection?.name} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              )}

              <Divider sx={{ mb: 3 }} />

              <Button type="submit" variant="contained" fullWidth size="large"
                disabled={formik.isSubmitting}
                sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, py: 1.5, borderRadius: 2 }}>
                {formik.isSubmitting ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} sx={{ color: '#fff' }} />
                    Saving...
                  </Box>
                ) : 'Save Changes'}
              </Button>

              <Button variant="outlined" fullWidth size="large" onClick={() => router.push('/admin/products')}
                sx={{ mt: 1.5, borderRadius: 2 }}>
                Cancel
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>

      {/* Add / Edit Variant Dialog */}
      <Dialog
        open={variantDialog.open}
        onClose={() => !variantSaving && setVariantDialog({ open: false, mode: 'add' })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {variantDialog.mode === 'add' ? 'Add Variant' : 'Edit Variant'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.25 }}>
            <Grid item xs={12}>
              {/* One field, not two. This slot used to hold a hex picker beside
                  the name; when the picker went, its Grid cell was refilled
                  with a second copy of the name field bound to the same state,
                  so the dialog showed the colour twice. */}
              <TextField
                label="Colour Name" size="small" fullWidth
                value={variantForm.color}
                onChange={e => setVariantForm(prev => ({ ...prev, color: e.target.value }))}
                placeholder="e.g. Black, Off White, Sage Green"
                helperText="Shown to customers exactly as typed."
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Size" size="small" fullWidth
                value={variantForm.size}
                onChange={e => setVariantForm(prev => ({ ...prev, size: e.target.value }))}
                placeholder="e.g. S, M, L, XL"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Stock" type="number" size="small" fullWidth
                value={variantForm.stockQuantity}
                onChange={e => setVariantForm(prev => ({ ...prev, stockQuantity: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Price Override (₹)" type="number" size="small" fullWidth
                value={variantForm.price}
                onChange={e => setVariantForm(prev => ({ ...prev, price: e.target.value }))}
                helperText="Leave empty to use product base price"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    size="small"
                    checked={variantForm.isActive}
                    onChange={e => setVariantForm(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                }
                label="Active (visible to customers)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setVariantDialog({ open: false, mode: 'add' })} disabled={variantSaving}>
            Cancel
          </Button>
          <Button
            variant="contained" onClick={saveVariant} disabled={variantSaving}
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}
          >
            {variantSaving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Variant Confirmation */}
      <Dialog open={!!deleteVariantId} onClose={() => setDeleteVariantId(null)} maxWidth="xs">
        <DialogTitle>Delete this variant?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove the variant. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteVariantId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={confirmDeleteVariant}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </FormikProvider>
  );
}
