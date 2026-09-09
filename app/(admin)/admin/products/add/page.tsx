'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Button, Card, CardContent, Grid, TextField,
  MenuItem, FormControlLabel, Switch, Chip, IconButton, Divider,
} from '@mui/material';
import { Add, Remove, ArrowBack } from '@mui/icons-material';
import { useFormik, FieldArray, FormikProvider } from 'formik';
import * as Yup from 'yup';
import { productApi, categoryApi } from '../../../../../services/api.service';
import { GENDERS } from '../../../../../constants';
import { toast } from 'react-hot-toast';
import SortableImageGrid, { type SortableImage } from '../../../../../components/admin/SortableImageGrid';
import { parseSizeInput, SIZE_PRESETS } from '../../../../../lib/sizeInput';

/**
 * Offered as quick-add chips only. Sizes are free text — a catalogue carries
 * waist sizes (26-36), 'Free Size', UK numbers — so a fixed list cannot cover
 * it and must not be the only way in.
 */
const SIZE_SUGGESTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

/**
 * Stock a newly added size row starts at.
 *
 * Was 10, which was a placeholder that quietly became real inventory whenever
 * an admin did not overwrite it. 2 matches the figure the catalogue is
 * currently stocked at, so a new size lines up with everything else by default.
 */
const DEFAULT_SIZE_STOCK = 2;

const schema = Yup.object({
  name: Yup.string().required('Product name required'),
  description: Yup.string().required('Description required'),
  basePrice: Yup.number().positive().required('Price required'),
  categoryId: Yup.string().required('Category required'),
  sku: Yup.string().required('SKU required'),
});

export default function AddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [images, setImages] = useState<File[]>([]);
  /**
   * Colour tag per picked file, held as a parallel array rather than a map.
   * The grid reorders the files themselves on this form, so any key built from
   * an index would point at the wrong photo the moment something is dragged.
   */
  const [imageColors, setImageColors] = useState<(string | null)[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    categoryApi.getAll({ page: 1, limit: 100 }).then(({ data }) => setCategories((data as any).data || data || []));
  }, []);

  const formik = useFormik({
    initialValues: {
      name: '', description: '', basePrice: '', salePrice: '', sku: '',
      categoryId: '', collectionId: '', gender: 'UNISEX',
      // Product-level stock. Omitting this on create used to leave the column
      // at its schema default of 0, and order validation checks THIS field
      // (not the variant totals) — so every newly added product was
      // unbuyable until someone opened it in the edit screen.
      // Blank means "derive from the variant stock below".
      stockQuantity: '' as string | number,
      isFeatured: false, isTrending: false, isNewArrival: true, isBestSeller: false,
      // Display priority: higher shows first. 0 keeps a new product in its
      // natural place rather than jumping it to the top of every section.
      sortOrder: 0 as string | number,
      material: '', careInstructions: '', fit: '', style: '',
      metaTitle: '', metaDescription: '',
      tags: [] as string[],
      standardShippingCharge: '' as string | number,
      codShippingCharge: '' as string | number,
      expressShippingCharge: '' as string | number,
      // Starts empty: the admin adds only the sizes this product actually has.
      variants: [{ color: '', colorHex: '', sizes: [] as { size: string; stock: number; price: string }[] }],
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        // Sum of every colour/size combination entered below.
        const variantStockTotal = (values.variants || []).reduce(
          (sum: number, v: any) =>
            sum + (v.sizes || []).reduce((s: number, sz: any) => s + (Number(sz.stock) || 0), 0),
          0
        );

        const fd = new FormData();
        fd.append('name', values.name);
        fd.append('description', values.description);
        fd.append('basePrice', String(values.basePrice));
        if (values.salePrice) fd.append('salePrice', String(values.salePrice));
        fd.append('sku', values.sku);
        // Left blank → send the sum of per-size variant stock, so the product
        // is immediately orderable rather than silently defaulting to 0.
        fd.append('stockQuantity', String(
          values.stockQuantity === '' ? variantStockTotal : values.stockQuantity
        ));
        fd.append('categoryId', values.categoryId);
        if (values.collectionId) fd.append('collectionId', values.collectionId);
        fd.append('gender', values.gender);
        fd.append('sortOrder', String(values.sortOrder === '' ? 0 : values.sortOrder));
        fd.append('isFeatured', String(values.isFeatured));
        fd.append('isTrending', String(values.isTrending));
        fd.append('isNewArrival', String(values.isNewArrival));
        fd.append('isBestSeller', String(values.isBestSeller));
        fd.append('material', values.material);
        fd.append('careInstructions', values.careInstructions);
        fd.append('fit', values.fit);
        fd.append('style', values.style);
        fd.append('metaTitle', values.metaTitle);
        fd.append('metaDescription', values.metaDescription);
        fd.append('tags', JSON.stringify(values.tags));
        fd.append('variants', JSON.stringify(values.variants));
        if (values.standardShippingCharge !== '') fd.append('standardShippingCharge', String(values.standardShippingCharge));
        if (values.codShippingCharge !== '') fd.append('codShippingCharge', String(values.codShippingCharge));
        if (values.expressShippingCharge !== '') fd.append('expressShippingCharge', String(values.expressShippingCharge));
        images.forEach(img => fd.append('images', img));
        // Keyed by upload position, which is exactly how the server names them.
        fd.append(
          'imageColors',
          JSON.stringify(
            Object.fromEntries(images.map((_, i) => [`new:${i}`, imageColors[i] || null]))
          )
        );

        await productApi.create(fd);
        toast.success('Product created!');
        router.push('/admin/products');
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Failed to create product');
      } finally {
        setSubmitting(false);
      }
    },
  });

  /**
   * Live total of the per-colour/per-size stock entered in the Variants
   * section. Shown as the placeholder for the product-level field and used as
   * its value when the admin leaves it blank.
   */
  const variantStockTotal = useMemo(
    () =>
      (formik.values.variants || []).reduce(
        (sum: number, v: any) =>
          sum + (v.sizes || []).reduce((s: number, sz: any) => s + (Number(sz.stock) || 0), 0),
        0
      ),
    [formik.values.variants]
  );

  /**
   * Add several sizes to one colour at once, skipping any already there.
   *
   * Every entry point funnels through here — the preset runs, the typed list
   * and the copy-from-colour button — so "already added" behaves identically
   * whichever way the admin works.
   */
  const addSizes = (vi: number, incoming: { size: string; stock: number; price: string }[]) => {
    const current = formik.values.variants[vi]?.sizes || [];
    const have = new Set(current.map((x: any) => String(x.size).toLowerCase()));
    const fresh = incoming.filter(x => x.size && !have.has(x.size.toLowerCase()));
    if (!fresh.length) {
      toast('Those sizes are already added', { icon: 'ℹ️' });
      return;
    }
    formik.setFieldValue(`variants.${vi}.sizes`, [...current, ...fresh]);
    toast.success(`Added ${fresh.length} size${fresh.length === 1 ? '' : 's'}`);
  };

  /** One stock figure across every size of a colour — the usual case. */
  const setAllStock = (vi: number, stock: number) => {
    const current = formik.values.variants[vi]?.sizes || [];
    if (!current.length) return;
    formik.setFieldValue(
      `variants.${vi}.sizes`,
      current.map((x: any) => ({ ...x, stock })),
    );
    toast.success(`All ${current.length} sizes set to ${stock}`);
  };

  /** Clone a colour's whole size run, which is nearly always identical. */
  const copySizesFrom = (targetIndex: number, sourceIndex: number) => {
    const source = formik.values.variants[sourceIndex]?.sizes || [];
    if (!source.length) {
      toast.error('That colour has no sizes to copy yet');
      return;
    }
    formik.setFieldValue(
      `variants.${targetIndex}.sizes`,
      source.map((x: any) => ({ ...x })),
    );
    toast.success(`Copied ${source.length} sizes`);
  };

  const handleImages = (files: File[]) => {
    if (!files.length) return;
    setImages(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
    setImageColors(prev => [...prev, ...files.map(() => null)]);
  };

  const removeImage = (key: string) => {
    const i = Number(key.slice(4));
    setImages(prev => prev.filter((_, idx) => idx !== i));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
    setImageColors(prev => prev.filter((_, idx) => idx !== i));
  };

  // On create the backend assigns sortOrder from the upload index, so putting
  // the files in the chosen order is all the ordering this form needs.
  const gridImages: SortableImage[] = imagePreviews.map((src, i) => ({
    key: `new:${i}`,
    src,
  }));

  const reorderImages = (next: SortableImage[]) => {
    const order = next.map(item => Number(item.key.slice(4)));
    setImages(prev => order.map(i => prev[i]));
    setImagePreviews(prev => order.map(i => prev[i]));
    setImageColors(prev => order.map(i => prev[i] ?? null));
  };

  /** Colour names entered in the Variants section below, in entry order. */
  const variantColorNames = useMemo(
    () => [
      ...new Set(
        (formik.values.variants || [])
          .map((v: any) => (v.color || '').trim())
          .filter(Boolean)
      ),
    ] as string[],
    [formik.values.variants]
  );

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formik.values.tags.includes(tag)) {
      formik.setFieldValue('tags', [...formik.values.tags, tag]);
    }
    setTagInput('');
  };

  return (
    <FormikProvider value={formik}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <IconButton onClick={() => router.push('/admin/products')}><ArrowBack /></IconButton>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
            Add Product
          </Typography>
        </Box>

        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Main details */}
            <Grid item xs={12} lg={8}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Basic Information</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField label="Product Name" size="small" fullWidth required
                        {...formik.getFieldProps('name')}
                        error={formik.touched.name && !!formik.errors.name}
                        helperText={formik.touched.name && formik.errors.name} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField label="Description" size="small" fullWidth multiline rows={4} required
                        {...formik.getFieldProps('description')}
                        error={formik.touched.description && !!formik.errors.description}
                        helperText={formik.touched.description && formik.errors.description} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField label="Base Price (₹)" type="number" size="small" fullWidth required
                        {...formik.getFieldProps('basePrice')}
                        error={formik.touched.basePrice && !!formik.errors.basePrice}
                        helperText={formik.touched.basePrice && formik.errors.basePrice} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField label="Sale Price (₹)" type="number" size="small" fullWidth
                        {...formik.getFieldProps('salePrice')} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField label="SKU" size="small" fullWidth required
                        {...formik.getFieldProps('sku')}
                        error={formik.touched.sku && !!formik.errors.sku}
                        helperText={formik.touched.sku && formik.errors.sku} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField select label="Category" size="small" fullWidth required
                        {...formik.getFieldProps('categoryId')}
                        error={formik.touched.categoryId && !!formik.errors.categoryId}
                        helperText={formik.touched.categoryId && formik.errors.categoryId}>
                        {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField select label="Gender" size="small" fullWidth {...formik.getFieldProps('gender')}>
                        {GENDERS.map(g => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Stock Quantity"
                        type="number"
                        size="small"
                        fullWidth
                        placeholder={String(variantStockTotal)}
                        {...formik.getFieldProps('stockQuantity')}
                        inputProps={{ min: 0 }}
                        helperText={
                          formik.values.stockQuantity === ''
                            ? `Leave blank to use the variant total (${variantStockTotal})`
                            : 'Checkout validates against this figure'
                        }
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Images */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Product Images</Typography>
                  <SortableImageGrid
                    images={gridImages}
                    onReorder={reorderImages}
                    onRemove={removeImage}
                    onAdd={handleImages}
                    colorOptions={variantColorNames}
                    colorByKey={Object.fromEntries(
                      imageColors.map((c, i) => [`new:${i}`, c])
                    )}
                    onColorChange={(key, color) => {
                      const i = Number(key.slice(4));
                      setImageColors(prev => prev.map((c, idx) => (idx === i ? color : c)));
                    }}
                    helperText={
                      variantColorNames.length
                        ? 'Drag to reorder — image 1 is the cover. Tag a photo with a colour to show it when that colour is picked; leave it on "All colours" and it shows for every colour that has no photos of its own.'
                        : 'Drag to reorder — image 1 is the cover shown on listings and first in the gallery. Add colours under Variants to tag photos per colour.'
                    }
                  />
                </CardContent>
              </Card>

              {/* Variants */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Variants (Colors & Sizes)</Typography>
                    <Button size="small" startIcon={<Add />} onClick={() => {
                      formik.setFieldValue('variants', [...formik.values.variants, {
                        color: '', colorHex: '',
                        sizes: [] as { size: string; stock: number; price: string }[],
                      }]);
                    }}>
                      Add Color
                    </Button>
                  </Box>

                  {formik.values.variants.map((variant, vi) => (
                    <Box key={vi} sx={{ mb: 3, p: 2, bgcolor: '#fafafa', borderRadius: 1 }}>
                      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                        {/* Colour is a NAME, not a spectrum pick. Nobody
                            merchandises "#8B4513" — they merchandise "Tan", and
                            that is also what the customer reads. The swatch hex
                            is derived from the name on the server. */}
                        <TextField label="Colour Name" size="small" sx={{ flex: 1 }}
                          placeholder="e.g. Black, Off White, Sage Green"
                          value={variant.color}
                          onChange={e => formik.setFieldValue(`variants.${vi}.color`, e.target.value)} />
                        {formik.values.variants.length > 1 && (
                          <IconButton size="small" color="error" onClick={() =>
                            formik.setFieldValue('variants', formik.values.variants.filter((_, i) => i !== vi))}>
                            <Remove fontSize="small" />
                          </IconButton>
                        )}
                      </Box>

                      {/* Sizes stay free text — a fixed XS-XXL grid cannot
                          express a denim catalogue (waist 26-36), "Free Size"
                          or UK numbering. What changed is the speed: a whole
                          run goes in with one click, because adding six waists
                          across two colours used to be twelve separate clicks
                          before a single stock figure had been typed. */}

                      {/* Whole runs, one click each. */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mb: 1.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#888', mr: 0.5 }}>
                          ADD A SET:
                        </Typography>
                        {SIZE_PRESETS.map(preset => (
                          <Chip
                            key={preset.label}
                            label={preset.label}
                            size="small"
                            onClick={() => addSizes(vi, preset.sizes.map(size => ({
                              size, stock: DEFAULT_SIZE_STOCK, price: '',
                            })))}
                            sx={{
                              fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                              bgcolor: '#1a1a1a', color: '#fff',
                              '&:hover': { bgcolor: '#333' },
                            }}
                          />
                        ))}
                        {vi > 0 && (
                          <Chip
                            label={`Copy sizes from ${formik.values.variants[0]?.color?.trim() || 'first colour'}`}
                            size="small"
                            variant="outlined"
                            onClick={() => copySizesFrom(vi, 0)}
                            sx={{ fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                          />
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
                        {SIZE_SUGGESTIONS.filter(sz => !variant.sizes.some(x => x.size === sz)).map(sz => (
                          <Chip
                            key={sz}
                            label={`+ ${sz}`}
                            size="small"
                            variant="outlined"
                            onClick={() => formik.setFieldValue(`variants.${vi}.sizes`, [
                              ...variant.sizes, { size: sz, stock: DEFAULT_SIZE_STOCK, price: '' },
                            ])}
                          />
                        ))}
                        <TextField
                          size="small"
                          placeholder="26, 28, 30 or 26-36 + Enter"
                          sx={{ width: 230 }}
                          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key !== 'Enter') return;
                            e.preventDefault();
                            const el = e.target as HTMLInputElement;
                            // One entry can carry a list or a range — see
                            // parseSizeInput. Typing them one at a time was the
                            // slow part.
                            const parsed = parseSizeInput(el.value);
                            if (!parsed.length) return;
                            addSizes(vi, parsed.map(size => ({
                              size, stock: DEFAULT_SIZE_STOCK, price: '',
                            })));
                            el.value = '';
                          }}
                        />
                      </Box>

                      {variant.sizes.length === 0 ? (
                        <Typography variant="caption" color="text.secondary">
                          No sizes yet — add the ones this colour actually comes in.
                        </Typography>
                      ) : (
                        <>
                        {/* Stock is usually the same across a run, so setting
                            it once beats typing it into every box. */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#888' }}>
                            SET STOCK FOR ALL {variant.sizes.length} SIZES:
                          </Typography>
                          {[2, 5, 10, 25].map(n => (
                            <Chip
                              key={n}
                              label={n}
                              size="small"
                              variant="outlined"
                              onClick={() => setAllStock(vi, n)}
                              sx={{ fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', minWidth: 42 }}
                            />
                          ))}
                          <TextField
                            size="small"
                            type="number"
                            placeholder="Other"
                            sx={{ width: 92 }}
                            inputProps={{ min: 0 }}
                            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                              if (e.key !== 'Enter') return;
                              e.preventDefault();
                              const el = e.target as HTMLInputElement;
                              const n = Number(el.value);
                              if (!Number.isFinite(n) || n < 0) return;
                              setAllStock(vi, Math.trunc(n));
                              el.value = '';
                            }}
                          />
                        </Box>
                        <Grid container spacing={1.5}>
                          {variant.sizes.map((sv, si) => (
                            <Grid item xs={6} sm={3} md={2} key={`${sv.size}-${si}`}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                                <Typography variant="caption" fontWeight={700} noWrap sx={{ flex: 1 }}>
                                  {sv.size}
                                </Typography>
                                <IconButton
                                  size="small"
                                  sx={{ p: 0.2, color: '#d32f2f' }}
                                  onClick={() => formik.setFieldValue(
                                    `variants.${vi}.sizes`,
                                    variant.sizes.filter((_, i) => i !== si)
                                  )}
                                >
                                  <Remove sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Box>
                              <TextField
                                label="Stock" type="number" size="small" fullWidth
                                value={sv.stock}
                                onChange={e => formik.setFieldValue(`variants.${vi}.sizes.${si}.stock`, Number(e.target.value))}
                                inputProps={{ min: 0 }}
                                helperText={Number(sv.stock) === 0 ? 'Hidden from customers' : undefined}
                              />
                            </Grid>
                          ))}
                        </Grid>
                        </>
                      )}
                    </Box>
                  ))}
                </CardContent>
              </Card>

              {/* Additional details */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Product Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}><TextField label="Material" size="small" fullWidth {...formik.getFieldProps('material')} /></Grid>
                    <Grid item xs={6}><TextField label="Fit" size="small" fullWidth {...formik.getFieldProps('fit')} /></Grid>
                    <Grid item xs={6}><TextField label="Style" size="small" fullWidth {...formik.getFieldProps('style')} /></Grid>
                    <Grid item xs={12}><TextField label="Care Instructions" size="small" fullWidth multiline rows={2} {...formik.getFieldProps('careInstructions')} /></Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* SEO */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>SEO</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}><TextField label="Meta Title" size="small" fullWidth {...formik.getFieldProps('metaTitle')} /></Grid>
                    <Grid item xs={12}><TextField label="Meta Description" size="small" fullWidth multiline rows={2} {...formik.getFieldProps('metaDescription')} /></Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Delivery Charges */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Delivery Charges</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                    Custom charges for this product. Leave blank to use global rates (Standard ₹79 · COD ₹149 · Express ₹249).
                    For multi-product orders, the highest charge applies.
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField label="Standard (₹)" type="number" size="small" fullWidth
                        placeholder="₹79" inputProps={{ min: 0 }}
                        {...formik.getFieldProps('standardShippingCharge')} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField label="COD (₹)" type="number" size="small" fullWidth
                        placeholder="₹149" inputProps={{ min: 0 }}
                        {...formik.getFieldProps('codShippingCharge')} />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField label="Express (₹)" type="number" size="small" fullWidth
                        placeholder="₹249" inputProps={{ min: 0 }}
                        {...formik.getFieldProps('expressShippingCharge')} />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Sidebar */}
            <Grid item xs={12} lg={4}>
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

              <Button type="submit" variant="contained" fullWidth size="large" disabled={formik.isSubmitting}
                sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, py: 1.5, borderRadius: 2 }}>
                {formik.isSubmitting ? 'Creating...' : 'Create Product'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Box>
    </FormikProvider>
  );
}
