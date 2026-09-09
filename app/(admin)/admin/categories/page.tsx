'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Card, CardContent, IconButton, Chip, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Avatar, Skeleton, Stack, TablePagination, InputAdornment,
  Select, MenuItem, FormControl, InputLabel, FormControlLabel,
  Tooltip, Badge, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import { Add, Edit, Delete, Search, CloudUpload, Close, Man, Woman, AllInclusive, HelpOutline } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { categoryApi } from '../../../../services/api.service';
import { toast } from 'react-hot-toast';
import { useImageCropper } from '../../../../components/common/ImageCropperProvider';

const PAGE_SIZE = 20;

// Gender colour palette
const GENDER_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  WOMEN:  { label: 'Women',   color: '#c2185b', bg: '#fce4ec', icon: <Woman sx={{ fontSize: 13 }} /> },
  MEN:    { label: 'Men',     color: '#1565c0', bg: '#e3f2fd', icon: <Man  sx={{ fontSize: 13 }} /> },
  UNISEX: { label: 'Unisex',  color: '#6a1b9a', bg: '#f3e5f5', icon: <AllInclusive sx={{ fontSize: 13 }} /> },
  '':     { label: 'All',     color: '#555',    bg: '#f5f5f5', icon: <HelpOutline sx={{ fontSize: 13 }} /> },
};

const schema = Yup.object({
  name:            Yup.string().required('Name required'),
  slug:            Yup.string().matches(
                     /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                     { excludeEmptyString: true, message: 'Lowercase letters, numbers and single hyphens only' },
                   ),
  description:     Yup.string(),
  parentId:        Yup.string(),
  sortOrder:       Yup.number(),
  isActive:        Yup.boolean(),
  showInNav:       Yup.boolean(),
  showOnHome:      Yup.boolean(),
  isFeatured:      Yup.boolean(),
  gender:          Yup.string(),
  metaTitle:       Yup.string(),
  metaDescription: Yup.string(),
});

export default function CategoriesPage() {
  const cropImage = useImageCropper();
  const [categories, setCategories]     = useState<any[]>([]);
  const [parents, setParents]           = useState<any[]>([]);
  const [loading, setLoading]           = useState(true);
  const [page, setPage]                 = useState(0);
  const [total, setTotal]               = useState(0);
  const [search, setSearch]             = useState('');
  const [genderFilter, setGenderFilter] = useState<string>('ALL');
  /**
   * Menu positions the admin has typed but not saved.
   *
   * Staged rather than saved per keystroke: reordering a menu means touching
   * several rows at once, and a request per digit would fire a save for "1"
   * on the way to "12".
   */
  const [orderEdits, setOrderEdits] = useState<Record<string, string>>({});
  const [savingOrder, setSavingOrder] = useState(false);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editCat, setEditCat]           = useState<any>(null);
  const [imageFile, setImageFile]       = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileRef                         = useRef<HTMLInputElement>(null);

  const fetchCategories = useCallback(() => {
    setLoading(true);
    categoryApi.getAll({ page: page + 1, limit: PAGE_SIZE, search: search || undefined })
      .then(({ data }) => {
        setCategories((data as any).data || []);
        setTotal((data as any).meta?.total || 0);
      }).finally(() => setLoading(false));
  }, [page, search]);

  // Quick-toggle gender on a category row
  const handleGenderToggle = async (cat: any, newGender: string) => {
    const val = newGender || null;
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, gender: val } : c));
    const fd = new FormData();
    fd.append('gender', newGender);
    try {
      await categoryApi.update(cat.id, fd);
      toast.success(`Gender set to ${newGender || 'Unspecified'}`);
    } catch {
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, gender: cat.gender } : c));
      toast.error('Update failed');
    }
  };

  const fetchParents = useCallback(() => {
    categoryApi.getParents().then(({ data }) => setParents((data as any).data || []));
  }, []);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  useEffect(() => {
    const t = setTimeout(fetchCategories, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchCategories, search]);

  const formik = useFormik({
    initialValues: {
      name: '', slug: '', description: '', parentId: '', sortOrder: 0,
      isActive: true, showInNav: true, showOnHome: false, isFeatured: false,
      gender: '',
      metaTitle: '', metaDescription: '',
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => {
          // A blank slug means "leave it as it is". The field has to be skipped
          // rather than sent empty: on create the backend builds one from the
          // name only when the value is absent or falsy, and on update it writes
          // whatever it is given straight through — an empty string there would
          // blank the live URL of the category.
          if (k === 'slug' && !String(v).trim()) return;
          fd.append(k, String(v));
        });
        if (imageFile) fd.append('image', imageFile);
        if (editCat) {
          await categoryApi.update(editCat.id, fd);
          toast.success('Category updated');
        } else {
          await categoryApi.create(fd);
          toast.success('Category created');
        }
        closeDialog();
        fetchCategories();
        fetchParents();
      } catch {
        toast.error('Save failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const openCreate = () => {
    setEditCat(null); setImageFile(null); setImagePreview('');
    formik.resetForm({
      values: {
        name: '', slug: '', description: '', parentId: '', sortOrder: 0,
        isActive: true, showInNav: true, showOnHome: false, isFeatured: false,
        gender: '',
        metaTitle: '', metaDescription: '',
      },
    });
    setDialogOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditCat(cat);
    setImagePreview(cat.image || '');
    setImageFile(null);
    formik.resetForm({
      values: {
        name:            cat.name || '',
        slug:            cat.slug || '',
        description:     cat.description || '',
        parentId:        cat.parentId || '',
        sortOrder:       cat.sortOrder ?? 0,
        isActive:        cat.isActive ?? true,
        showInNav:       cat.showInNav ?? true,
        showOnHome:      cat.showOnHome ?? false,
        isFeatured:      cat.isFeatured ?? false,
        gender:          cat.gender || '',
        metaTitle:       cat.metaTitle || '',
        metaDescription: cat.metaDesc || '',
      },
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditCat(null);
    formik.resetForm();
    setImageFile(null);
    setImagePreview('');
  };

  /** Rows whose typed position differs from what is stored. */
  const dirtyOrders = Object.entries(orderEdits).filter(([id, value]) => {
    const cat = categories.find((c: any) => c.id === id);
    if (!cat) return false;
    const n = Number(value);
    return value.trim() !== '' && Number.isFinite(n) && n !== (cat.sortOrder ?? 0);
  });

  const handleSaveOrder = async () => {
    if (!dirtyOrders.length) return;
    setSavingOrder(true);
    try {
      const items = dirtyOrders.map(([id, value]) => ({ id, sortOrder: Math.trunc(Number(value)) }));
      await categoryApi.updatePositions(items);
      toast.success(`Menu order updated for ${items.length} ${items.length === 1 ? 'category' : 'categories'}`);
      setOrderEdits({});
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save the menu order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? This cannot be undone.')) return;
    try {
      await categoryApi.delete(id);
      toast.success('Deleted');
      fetchCategories();
      fetchParents();
    } catch {
      toast.error('Delete failed');
    }
  };

  // Quick-toggle showInNav
  const handleNavToggle = async (cat: any) => {
    const next = !cat.showInNav;
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, showInNav: next } : c));
    const fd = new FormData();
    fd.append('showInNav', String(next));
    try {
      await categoryApi.update(cat.id, fd);
      toast.success(next ? 'Shown in nav' : 'Hidden from nav');
    } catch {
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, showInNav: !next } : c));
      toast.error('Update failed');
    }
  };

  // Quick-toggle showOnHome
  const handleHomeToggle = async (cat: any) => {
    const next = !cat.showOnHome;
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, showOnHome: next } : c));
    const fd = new FormData();
    fd.append('showOnHome', String(next));
    try {
      await categoryApi.update(cat.id, fd);
      toast.success(next ? 'Shown on homepage' : 'Hidden from homepage');
    } catch {
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, showOnHome: !next } : c));
      toast.error('Update failed');
    }
  };

  const parentMap = Object.fromEntries(parents.map(p => [p.id, p.name]));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
            Categories
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage categories and subcategories. Toggle "Show in Nav" to control the mega menu.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, borderRadius: 1.5, fontWeight: 700, fontSize: '0.8rem' }}>
          Add Category
        </Button>
      </Box>

      <Box sx={{ mb: 2.5, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search categories…" sx={{ width: 260 }}
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />

        {/* Gender filter tabs */}
        <ToggleButtonGroup
          size="small"
          exclusive
          value={genderFilter}
          onChange={(_, v) => { if (v !== null) { setGenderFilter(v); setPage(0); } }}
          sx={{ '& .MuiToggleButton-root': { px: 1.5, py: 0.6, fontSize: '0.72rem', fontWeight: 700, textTransform: 'none' } }}
        >
          <ToggleButton value="ALL">All</ToggleButton>
          <ToggleButton value="WOMEN" sx={{ color: '#c2185b', '&.Mui-selected': { bgcolor: '#fce4ec', color: '#c2185b' } }}>
            <Woman sx={{ fontSize: 15, mr: 0.5 }} /> Women
          </ToggleButton>
          <ToggleButton value="MEN" sx={{ color: '#1565c0', '&.Mui-selected': { bgcolor: '#e3f2fd', color: '#1565c0' } }}>
            <Man sx={{ fontSize: 15, mr: 0.5 }} /> Men
          </ToggleButton>
          <ToggleButton value="UNISEX" sx={{ color: '#6a1b9a', '&.Mui-selected': { bgcolor: '#f3e5f5', color: '#6a1b9a' } }}>
            <AllInclusive sx={{ fontSize: 15, mr: 0.5 }} /> Unisex
          </ToggleButton>
          <ToggleButton value="UNSET" sx={{ color: '#888', '&.Mui-selected': { bgcolor: '#f5f5f5', color: '#555' } }}>
            Unset
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Count summary */}
        <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
          {(() => {
            const filtered = genderFilter === 'ALL' ? categories
              : genderFilter === 'UNSET' ? categories.filter(c => !c.gender)
              : categories.filter(c => c.gender === genderFilter);
            return `${filtered.length} of ${categories.length} categories`;
          })()}
        </Typography>
      </Box>

      {/* Staged order changes. Only appears once something is actually
          different, so it never nags. */}
      {dirtyOrders.length > 0 && (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, p: 1.5,
          border: '1px solid #c9a84c', borderRadius: 2, bgcolor: '#fffdf5',
        }}>
          <Typography variant="caption" sx={{ fontWeight: 700, color: '#7a6320', flex: 1 }}>
            {dirtyOrders.length} unsaved menu {dirtyOrders.length === 1 ? 'position' : 'positions'} — lower numbers show first in the Shop menu.
          </Typography>
          <Button size="small" onClick={() => setOrderEdits({})} sx={{ color: '#7a6320' }}>
            Discard
          </Button>
          <Button
            size="small"
            variant="contained"
            onClick={handleSaveOrder}
            disabled={savingOrder}
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, fontWeight: 700 }}
          >
            {savingOrder ? 'Saving…' : `Save order (${dirtyOrders.length})`}
          </Button>
        </Box>
      )}

      {loading ? (
        <Stack spacing={1.5}>
          {[...Array(6)].map((_, i) => <Skeleton key={i} height={72} sx={{ borderRadius: 2 }} />)}
        </Stack>
      ) : (
        <>
          <Stack spacing={1.5}>
            {categories
              .filter(cat => {
                if (genderFilter === 'ALL') return true;
                if (genderFilter === 'UNSET') return !cat.gender;
                return cat.gender === genderFilter;
              })
              .map((cat) => (
              <Card key={cat.id} elevation={0} sx={{
                border: '1px solid', borderRadius: 2,
                borderColor: cat.isActive ? (GENDER_META[cat.gender || '']?.color + '44' || 'divider') : '#f5f5f5',
                opacity: cat.isActive ? 1 : 0.65,
              }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar src={cat.image} variant="rounded" sx={{ width: 56, height: 56, bgcolor: '#f0f0f0' }}>
                    {cat.name?.charAt(0)}
                  </Avatar>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant="body2" fontWeight={700}>{cat.name}</Typography>
                      {cat.parentId && (
                        <Chip
                          label={`↳ ${parentMap[cat.parentId] || 'Sub'}`}
                          size="small"
                          sx={{ fontSize: '0.62rem', height: 18, bgcolor: '#f0f4ff', color: '#3366cc' }}
                        />
                      )}
                      {!cat.isActive && <Chip label="Inactive" size="small" sx={{ fontSize: '0.62rem', height: 18 }} />}
                      {cat.isFeatured && (
                        <Chip label="Featured" size="small" color="warning" sx={{ fontSize: '0.62rem', height: 18 }} />
                      )}
                      {/* Gender chip */}
                      {cat.gender ? (
                        <Chip
                          icon={GENDER_META[cat.gender]?.icon as any}
                          label={GENDER_META[cat.gender]?.label || cat.gender}
                          size="small"
                          sx={{
                            fontSize: '0.62rem', height: 20,
                            bgcolor: GENDER_META[cat.gender]?.bg,
                            color: GENDER_META[cat.gender]?.color,
                            fontWeight: 700,
                            '& .MuiChip-icon': { color: 'inherit', ml: 0.5 },
                          }}
                        />
                      ) : (
                        <Chip label="Unset" size="small" sx={{ fontSize: '0.62rem', height: 20, bgcolor: '#f5f5f5', color: '#999' }} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      /{cat.slug} · {cat._count?.products ?? 0} products
                      {cat.children?.length > 0 && ` · ${cat.children.length} sub-categories`}
                      {cat.sortOrder ? ` · order ${cat.sortOrder}` : ''}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>

                    {/* Menu position. Lower shows first — the same direction as
                        every other sortOrder, and the order the nav reads. */}
                    <Tooltip title="Position in the Shop menu — lower shows first" arrow>
                      <TextField
                        size="small"
                        type="number"
                        value={orderEdits[cat.id] ?? String(cat.sortOrder ?? 0)}
                        onChange={(e) =>
                          setOrderEdits(prev => ({ ...prev, [cat.id]: e.target.value }))
                        }
                        inputProps={{ style: { textAlign: 'center', padding: '4px 6px', fontSize: '0.75rem', fontWeight: 700 } }}
                        sx={{ width: 62, '& .MuiOutlinedInput-root': { height: 28 } }}
                      />
                    </Tooltip>

                    {/* Quick gender select */}
                    <Tooltip title="Set gender for this category" arrow>
                      <Select
                        size="small"
                        value={cat.gender || ''}
                        onChange={(e) => handleGenderToggle(cat, e.target.value as string)}
                        displayEmpty
                        sx={{
                          fontSize: '0.7rem', height: 28, minWidth: 88,
                          bgcolor: GENDER_META[cat.gender || '']?.bg || '#f5f5f5',
                          color: GENDER_META[cat.gender || '']?.color || '#888',
                          fontWeight: 700,
                          '& .MuiOutlinedInput-notchedOutline': { borderColor: GENDER_META[cat.gender || '']?.color + '55' || '#e0e0e0' },
                          '& .MuiSelect-icon': { color: GENDER_META[cat.gender || '']?.color || '#aaa', fontSize: 16 },
                        }}
                      >
                        <MenuItem value=""><em style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.7rem' }}>Unset</em></MenuItem>
                        <MenuItem value="WOMEN" sx={{ fontSize: '0.78rem', color: '#c2185b', fontWeight: 700 }}>♀ Women</MenuItem>
                        <MenuItem value="MEN"   sx={{ fontSize: '0.78rem', color: '#1565c0', fontWeight: 700 }}>♂ Men</MenuItem>
                        <MenuItem value="UNISEX" sx={{ fontSize: '0.78rem', color: '#6a1b9a', fontWeight: 700 }}>⚥ Unisex</MenuItem>
                      </Select>
                    </Tooltip>

                    <Tooltip title={cat.showInNav ? 'Shown in nav mega menu' : 'Hidden from nav'} arrow>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Switch
                          size="small"
                          color="success"
                          checked={cat.showInNav ?? true}
                          onChange={() => handleNavToggle(cat)}
                        />
                        <Typography variant="caption" sx={{ color: cat.showInNav ? '#4caf50' : '#bbb', fontSize: '0.65rem', mr: 0.5 }}>
                          Nav
                        </Typography>
                      </Box>
                    </Tooltip>
                    <Tooltip title={cat.showOnHome ? 'Shown on homepage' : 'Hidden from homepage'} arrow>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Switch
                          size="small"
                          color="warning"
                          checked={cat.showOnHome ?? false}
                          onChange={() => handleHomeToggle(cat)}
                        />
                        <Typography variant="caption" sx={{ color: cat.showOnHome ? '#ff9800' : '#bbb', fontSize: '0.65rem', mr: 0.5 }}>
                          Home
                        </Typography>
                      </Box>
                    </Tooltip>
                    <IconButton size="small" onClick={() => openEdit(cat)}>
                      <Edit sx={{ fontSize: 16 }} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(cat.id)}>
                      <Delete sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
            {categories.filter(cat => {
              if (genderFilter === 'ALL') return true;
              if (genderFilter === 'UNSET') return !cat.gender;
              return cat.gender === genderFilter;
            }).length === 0 && (
              <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
                No {genderFilter !== 'ALL' ? genderFilter.toLowerCase() : ''} categories found
              </Typography>
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

      {/* ── Add / Edit Dialog ──────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editCat ? `Edit: ${editCat.name}` : 'Add Category'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>

            {/* Image uploader */}
            <Box>
              <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Category Image
              </Typography>
              {imagePreview ? (
                <Box sx={{ position: 'relative', mb: 1 }}>
                  <Box component="img" src={imagePreview} alt="preview"
                    sx={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 1, display: 'block' }} />
                  <IconButton
                    size="small"
                    onClick={() => { setImageFile(null); setImagePreview(''); if (fileRef.current) fileRef.current.value = ''; }}
                    sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(0,0,0,0.55)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' } }}
                  >
                    <Close sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box
                  onClick={() => fileRef.current?.click()}
                  sx={{
                    height: 100, border: '1.5px dashed #d0d0d0', borderRadius: 1,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 0.5, cursor: 'pointer', bgcolor: '#fafafa',
                    '&:hover': { borderColor: '#1a1a1a', bgcolor: '#f5f5f5' },
                    mb: 1,
                  }}
                >
                  <CloudUpload sx={{ fontSize: 28, color: '#bbb' }} />
                  <Typography variant="caption" color="text.secondary">Click to upload · JPG, PNG, WebP</Typography>
                </Box>
              )}
              <input ref={fileRef} type="file" hidden accept="image/*" onChange={async e => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (!f) return;
                const cropped = await cropImage(f, 'category');
                if (cropped) { setImageFile(cropped); setImagePreview(URL.createObjectURL(cropped)); }
              }} />
              {imagePreview && (
                <Button size="small" variant="outlined" onClick={() => fileRef.current?.click()} sx={{ fontSize: '0.72rem', borderColor: '#ddd', color: '#555' }}>
                  Change Image
                </Button>
              )}
            </Box>

            <TextField
              label="Category Name *" size="small" fullWidth
              {...formik.getFieldProps('name')}
              error={formik.touched.name && !!formik.errors.name}
              helperText={formik.touched.name && formik.errors.name}
            />

            {/* Renaming a category never used to touch its slug, so four of them
                ended up advertising a department they no longer sell — Shirts
                living at /category/streetwear. There was no way to correct that
                from here at all. Retiring a slug is safe: the old address keeps
                working and forwards permanently. */}
            <TextField
              label="URL slug" size="small" fullWidth name="slug"
              value={formik.values.slug}
              onBlur={formik.handleBlur}
              onChange={(e) => formik.setFieldValue(
                'slug',
                e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+/, ''),
              )}
              error={formik.touched.slug && !!formik.errors.slug}
              helperText={
                formik.touched.slug && formik.errors.slug
                  ? formik.errors.slug
                  : editCat
                    ? `Lives at /category/${formik.values.slug || '…'} — changing it changes the public address. The old one forwards here.`
                    : 'Leave blank to build one from the name.'
              }
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Parent Category (leave blank for top-level)</InputLabel>
              <Select
                label="Parent Category (leave blank for top-level)"
                value={formik.values.parentId}
                onChange={e => formik.setFieldValue('parentId', e.target.value)}
              >
                <MenuItem value=""><em>— None (top-level) —</em></MenuItem>
                {parents
                  .filter(p => p.id !== editCat?.id) // don't allow self-reference
                  .map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)
                }
              </Select>
            </FormControl>

            <TextField
              label="Description" size="small" fullWidth multiline rows={2}
              {...formik.getFieldProps('description')}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <TextField
                label="Sort Order" size="small" type="number" fullWidth
                {...formik.getFieldProps('sortOrder')}
                helperText="Lower = shown first"
              />
              <Box>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                  Gender Audience
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  {[
                    { value: '', label: 'Unset', color: '#777', bg: '#f5f5f5' },
                    { value: 'WOMEN', label: '♀ Women', color: '#c2185b', bg: '#fce4ec' },
                    { value: 'MEN',   label: '♂ Men',   color: '#1565c0', bg: '#e3f2fd' },
                    { value: 'UNISEX',label: '⚥ Unisex',color: '#6a1b9a', bg: '#f3e5f5' },
                  ].map(opt => (
                    <Box
                      key={opt.value}
                      onClick={() => formik.setFieldValue('gender', opt.value)}
                      sx={{
                        flex: 1, textAlign: 'center',
                        py: 0.75, px: 0.5,
                        borderRadius: 1.5,
                        border: '2px solid',
                        borderColor: formik.values.gender === opt.value ? opt.color : 'transparent',
                        bgcolor: formik.values.gender === opt.value ? opt.bg : '#f9f9f9',
                        color: formik.values.gender === opt.value ? opt.color : '#888',
                        fontWeight: formik.values.gender === opt.value ? 800 : 500,
                        fontSize: '0.72rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        '&:hover': { bgcolor: opt.bg, borderColor: opt.color + '88', color: opt.color },
                        userSelect: 'none',
                      }}
                    >
                      {opt.label}
                    </Box>
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Controls which gender's homepage/nav this category appears in
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <FormControlLabel
                control={<Switch size="small" color="success" checked={formik.values.isActive} onChange={e => formik.setFieldValue('isActive', e.target.checked)} />}
                label={<Typography variant="caption" fontWeight={600}>Active</Typography>}
              />
              <FormControlLabel
                control={<Switch size="small" color="primary" checked={formik.values.showInNav} onChange={e => formik.setFieldValue('showInNav', e.target.checked)} />}
                label={<Typography variant="caption" fontWeight={600}>Show in Mega Menu (Nav)</Typography>}
              />
              <FormControlLabel
                control={<Switch size="small" color="warning" checked={formik.values.showOnHome} onChange={e => formik.setFieldValue('showOnHome', e.target.checked)} />}
                label={<Typography variant="caption" fontWeight={600}>Show on Homepage</Typography>}
              />
              <FormControlLabel
                control={<Switch size="small" color="secondary" checked={formik.values.isFeatured} onChange={e => formik.setFieldValue('isFeatured', e.target.checked)} />}
                label={<Typography variant="caption" fontWeight={600}>Featured</Typography>}
              />
            </Box>

            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mt: 0.5 }}>
              SEO (optional)
            </Typography>
            <TextField label="Meta Title" size="small" fullWidth {...formik.getFieldProps('metaTitle')} />
            <TextField label="Meta Description" size="small" fullWidth multiline rows={2}
              {...formik.getFieldProps('metaDescription')} />
          </DialogContent>

          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting}
              sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, fontWeight: 700 }}>
              {formik.isSubmitting ? 'Saving…' : editCat ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
