'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Grid, Chip, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, FormControlLabel, IconButton, Skeleton, Avatar,
  TablePagination, InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { bannerApi } from '../../../../services/api.service';
import { formatDate } from '../../../../utils/format';
import { toast } from 'react-hot-toast';
import { useImageCropper } from '../../../../components/common/ImageCropperProvider';

/**
 * Exactly the BannerType enum, no more and no less.
 *
 * The list previously offered POPUP, which is not a value the database accepts
 * — saving one failed — while omitting COLLECTION and OFFER, which it does.
 * COLLECTION is what the /collections page header reads.
 */
const BANNER_TYPES = ['HERO', 'PROMOTIONAL', 'COLLECTION', 'CATEGORY', 'OFFER', 'ANNOUNCEMENT'];

/** What each type actually drives, so the choice is not guesswork. */
const TYPE_HINTS: Record<string, string> = {
  HERO: 'The homepage slider.',
  PROMOTIONAL: 'The promo strip on the homepage.',
  COLLECTION: 'The header artwork on the /collections page.',
  CATEGORY: 'Category page artwork.',
  OFFER: 'Offer placements.',
  ANNOUNCEMENT: 'Announcement placements.',
};
/** The destinations a banner usually points at. */
const LINK_PRESETS = [
  { label: 'All products', url: '/shop' },
  { label: 'New arrivals', url: '/shop?isNewArrival=true' },
  { label: 'On sale', url: '/shop?discount=true' },
  { label: 'Collections', url: '/collections' },
];

const PAGE_SIZE = 12;

const schema = Yup.object({
  title: Yup.string().required('Title required'),
  type: Yup.string().required('Type required'),
  /**
   * A destination on this site, or a full external URL.
   *
   * Yup's .url() rejects "/shop" outright, so the only thing this field would
   * accept was an absolute URL — which meant hardcoding the domain into a
   * banner and breaking every link if it ever changes. Paths are the normal
   * case and are now the easy one.
   */
  linkUrl: Yup.string()
    .nullable()
    .test(
      'internal-path-or-url',
      'Use a path like /shop, or a full https:// address',
      (value) => {
        if (!value || !value.trim()) return true;
        const v = value.trim();
        if (v.startsWith('//')) return false;          // protocol-relative: ambiguous host
        if (v.startsWith('/')) return true;            // on this site
        return /^https?:\/\/\S+\.\S+/i.test(v);      // somewhere else
      }
    ),
  sortOrder: Yup.number().min(0),
});

export default function BannersPage() {
  const cropImage = useImageCropper();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<any>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  // Optional portrait crop for phones — the desktop hero is ~2.5:1 and gets
  // cut to a sliver on a narrow screen without one.
  const [mobileFile, setMobileFile] = useState<File | null>(null);
  const [mobilePreview, setMobilePreview] = useState<string>('');

  const fetchBanners = useCallback(() => {
    setLoading(true);
    bannerApi.getAll({ page: page + 1, limit: PAGE_SIZE, search: search || undefined })
      .then(({ data }) => {
        setBanners(data.data || []);
        setTotal(data.meta?.total || 0);
      }).finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchBanners, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchBanners, search]);

  const formik = useFormik({
    initialValues: {
      title: '', subtitle: '', type: 'HERO', gender: 'ALL', linkUrl: '', buttonText: '',
      isActive: true, sortOrder: 0,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => fd.append(k, String(v)));
        if (imageFile) fd.append('image', imageFile);
        if (mobileFile) fd.append('mobileImage', mobileFile);
        if (editBanner) {
          await bannerApi.update(editBanner.id, fd);
          toast.success('Banner updated');
        } else {
          await bannerApi.create(fd);
          toast.success('Banner created');
        }
        closeDialog();
        fetchBanners();
      } catch {
        toast.error('Failed to save banner');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const openCreate = () => {
    setEditBanner(null); setImageFile(null); setImagePreview('');
    formik.resetForm(); setDialogOpen(true);
  };

  const openEdit = (banner: any) => {
    setEditBanner(banner); setImagePreview(banner.image || banner.imageUrl || ''); setImageFile(null);
    setMobilePreview((banner as any).mobileImage || ''); setMobileFile(null);
    formik.setValues({
      title: banner.title || '', subtitle: banner.subtitle || '', type: banner.type || 'HERO',
      gender: banner.gender || 'ALL',
      linkUrl: banner.link || banner.linkUrl || '', buttonText: banner.ctaText || banner.buttonText || '',
      isActive: banner.isActive ?? true, sortOrder: banner.sortOrder || 0,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false); setEditBanner(null);
    setImageFile(null); setImagePreview(''); formik.resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    setDeleting(id);
    try {
      await bannerApi.delete(id);
      toast.success('Deleted');
      fetchBanners();
    } catch { toast.error('Delete failed'); } finally { setDeleting(null); }
  };

  const handleToggleActive = async (banner: any) => {
    try {
      await bannerApi.update(banner.id, { isActive: !banner.isActive });
      fetchBanners();
    } catch { toast.error('Update failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
          Banners
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
          Add Banner
        </Button>
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <TextField size="small" placeholder="Search banners..." sx={{ width: 280 }}
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />
      </Box>

      {loading ? (
        <Grid container spacing={2}>
          {[...Array(PAGE_SIZE)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <>
          <Grid container spacing={2}>
            {banners.map((banner) => (
              <Grid item xs={12} sm={6} md={4} key={banner.id}>
                <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Box sx={{ position: 'relative', height: 160, bgcolor: '#f5f5f5', overflow: 'hidden' }}>
                    {(banner.image || banner.imageUrl) ? (
                      <Box component="img" src={banner.image || banner.imageUrl} alt={banner.title}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Typography color="text.secondary" variant="caption">No image</Typography>
                      </Box>
                    )}
                    <Box sx={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 0.5 }}>
                      <Chip label={banner.type} size="small"
                        sx={{ bgcolor: '#1a1a1a', color: '#fff', fontSize: '0.65rem' }} />
                      {banner.gender && banner.gender !== 'ALL' && (
                        <Chip
                          label={banner.gender}
                          size="small"
                          sx={{
                            bgcolor: banner.gender === 'WOMEN' ? '#e91e8c' : '#1565c0',
                            color: '#fff', fontSize: '0.65rem',
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{banner.title}</Typography>
                        {banner.subtitle && (
                          <Typography variant="caption" color="text.secondary" noWrap display="block">
                            {banner.subtitle}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">Order: {banner.sortOrder}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                        <Switch size="small" checked={banner.isActive} onChange={() => handleToggleActive(banner)} />
                        <IconButton size="small" onClick={() => openEdit(banner)}><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(banner.id)}
                          disabled={deleting === banner.id}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <TablePagination
            component="div" count={total} page={page} rowsPerPage={PAGE_SIZE}
            rowsPerPageOptions={[PAGE_SIZE]}
            onPageChange={(_, p) => setPage(p)}
            sx={{ mt: 2 }}
          />
        </>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editBanner ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Box>
              {/* Resolution + size guide */}
              {formik.values.type === 'HERO' && (
                <Box sx={{ mb: 1, p: 1.5, bgcolor: '#f9f4e8', borderRadius: 1, border: '1px solid #e8d89a' }}>
                  <Typography variant="caption" sx={{ color: '#8a6a00', fontWeight: 600, display: 'block' }}>
                    Hero Banner Spec
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8a6a00' }}>
                    Recommended resolution: <strong>1440 × 560 px</strong> &nbsp;|&nbsp; Max file size: <strong>1 MB</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#8a6a00', display: 'block', mt: 0.25 }}>
                    Upload at 2560px wide or more. The original is kept at full quality; visitors are served a viewport-sized AVIF.
                  </Typography>
                </Box>
              )}
              {imagePreview && (
                <Box component="img" src={imagePreview} alt="preview"
                  sx={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 1, mb: 1 }} />
              )}
              <Button variant="outlined" component="label" size="small">
                {imagePreview ? 'Change Image' : 'Upload Image'}
                <input type="file" hidden accept="image/jpeg,image/jpg,image/png,image/webp" onChange={async e => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  if (f.size > 25 * 1024 * 1024) {
                    toast.error('Image must be 25 MB or smaller');
                    return;
                  }
                  // Framed to the hero's own 1440:560, so the storefront has
                  // nothing left to crop off the sides.
                  const cropped = await cropImage(f, 'bannerDesktop');
                  if (cropped) { setImageFile(cropped); setImagePreview(URL.createObjectURL(cropped)); }
                }} />
              </Button>

              {/* Optional portrait crop for phones */}
              <Box sx={{ mt: 2 }}>
                {mobilePreview && (
                  <Box component="img" src={mobilePreview} alt="mobile preview"
                    sx={{ width: 110, height: 160, objectFit: 'cover', borderRadius: 1, mb: 1, display: 'block' }} />
                )}
                <Button variant="outlined" component="label" size="small">
                  {mobilePreview ? 'Change Mobile Image' : 'Upload Mobile Image (optional)'}
                  <input type="file" hidden accept="image/jpeg,image/jpg,image/png,image/webp" onChange={async e => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    if (f.size > 25 * 1024 * 1024) {
                      toast.error('Image must be 25 MB or smaller');
                      return;
                    }
                    const cropped = await cropImage(f, 'bannerMobile');
                    if (cropped) { setMobileFile(cropped); setMobilePreview(URL.createObjectURL(cropped)); }
                  }} />
                </Button>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                  Portrait crop shown on screens under 768px. Without it the wide desktop image is cropped hard on phones.
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                Accepted: JPG, PNG, WebP &nbsp;·&nbsp; Max: 1 MB
              </Typography>
            </Box>
            <TextField label="Title" size="small" fullWidth
              {...formik.getFieldProps('title')}
              error={formik.touched.title && !!formik.errors.title}
              helperText={formik.touched.title && formik.errors.title} />
            <TextField label="Subtitle" size="small" fullWidth {...formik.getFieldProps('subtitle')} />
            <TextField
              select label="Type" size="small" fullWidth {...formik.getFieldProps('type')}
              helperText={TYPE_HINTS[formik.values.type] || 'Where this banner appears.'}
            >
              {BANNER_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </TextField>
            <TextField select label="Target Gender" size="small" fullWidth {...formik.getFieldProps('gender')}
              helperText="ALL = shown for both Women and Men">
              <MenuItem value="ALL">All Genders</MenuItem>
              <MenuItem value="WOMEN">Women only</MenuItem>
              <MenuItem value="MEN">Men only</MenuItem>
            </TextField>
            <Box>
              <TextField label="Where the banner links to" size="small" fullWidth
                placeholder="/shop?isNewArrival=true"
                {...formik.getFieldProps('linkUrl')}
                error={formik.touched.linkUrl && !!formik.errors.linkUrl}
                helperText={
                  (formik.touched.linkUrl && formik.errors.linkUrl)
                  || 'Tapping the banner image goes here. Leave blank and the banner is not clickable.'
                } />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
                {LINK_PRESETS.map(preset => (
                  <Chip
                    key={preset.url}
                    label={preset.label}
                    size="small"
                    variant="outlined"
                    onClick={() => formik.setFieldValue('linkUrl', preset.url)}
                    sx={{ fontSize: '0.68rem', cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
            <TextField label="Button Text (optional)" size="small" fullWidth
              {...formik.getFieldProps('buttonText')}
              helperText="Used by promotional banners only. Hero banners show no button — the whole image is the link." />
            <TextField label="Sort Order" type="number" size="small" fullWidth {...formik.getFieldProps('sortOrder')} />
            <FormControlLabel
              control={<Switch checked={formik.values.isActive}
                onChange={e => formik.setFieldValue('isActive', e.target.checked)} />}
              label="Active" />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting}
              sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
              {editBanner ? 'Save Changes' : 'Create Banner'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
