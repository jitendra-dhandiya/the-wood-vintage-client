'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, IconButton, Chip, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Avatar, Skeleton, Stack, InputAdornment,
} from '@mui/material';
import { Add, Edit, Delete, Search, Close } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { artisanApi } from '../../../../services/api.service';
import { toast } from 'react-hot-toast';
import type { Artisan } from '../../../../types';

/**
 * Artisans admin — list + create/edit (name, bio, photo, region). Unlike
 * Material/Style/Room, there is no slug and no sortOrder on this model, and
 * no public list endpoint — only `GET /artisans/:id` for a future bio page
 * linked from a product. Deliberately unseeded (no real artisan data exists
 * yet), so an empty list here is the correct, common state.
 * See documentation/docs/architecture/phase-2-handicraft-domain-spec.md.
 */

const schema = Yup.object({
  name: Yup.string().required('Name required'),
  bio: Yup.string(),
  photo: Yup.string(),
  region: Yup.string(),
  isActive: Yup.boolean(),
});

export default function ArtisansPage() {
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Artisan | null>(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    artisanApi.getAllAdmin()
      .then(({ data }) => setArtisans(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const formik = useFormik({
    initialValues: { name: '', bio: '', photo: '', region: '', isActive: true },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (editItem) {
          await artisanApi.update(editItem.id, values);
          toast.success('Artisan updated');
        } else {
          await artisanApi.create(values);
          toast.success('Artisan created');
        }
        closeDialog();
        fetchAll();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Save failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const openCreate = () => {
    setEditItem(null);
    formik.resetForm({ values: { name: '', bio: '', photo: '', region: '', isActive: true } });
    setDialogOpen(true);
  };

  const openEdit = (a: Artisan) => {
    setEditItem(a);
    formik.resetForm({
      values: {
        name: a.name || '', bio: a.bio || '', photo: a.photo || '',
        region: a.region || '', isActive: a.isActive ?? true,
      },
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditItem(null);
    formik.resetForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this artisan? Products crediting them keep their record but lose the link.')) return;
    try {
      await artisanApi.delete(id);
      toast.success('Deleted');
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const handleActiveToggle = async (a: Artisan) => {
    const next = !a.isActive;
    setArtisans(prev => prev.map(x => x.id === a.id ? { ...x, isActive: next } : x));
    try {
      await artisanApi.update(a.id, { isActive: next });
    } catch {
      setArtisans(prev => prev.map(x => x.id === a.id ? { ...x, isActive: !next } : x));
      toast.error('Update failed');
    }
  };

  const filtered = artisans.filter(a => !search || a.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
            Artisans
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Makers and workshops credited on product pages (MASTER-PROMPT §33). No artisan is
            attached to any product yet — this is expected until real data is added.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, borderRadius: 1.5, fontWeight: 700, fontSize: '0.8rem' }}>
          Add Artisan
        </Button>
      </Box>

      <TextField size="small" placeholder="Search artisans…" sx={{ width: 260, mb: 2.5 }}
        value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />

      {loading ? (
        <Stack spacing={1.5}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} height={64} sx={{ borderRadius: 2 }} />)}
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map(a => (
            <Card key={a.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, opacity: a.isActive ? 1 : 0.6 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={a.photo || undefined} sx={{ width: 48, height: 48, bgcolor: '#f0f0f0' }}>
                  {a.name.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={700}>{a.name}</Typography>
                    {!a.isActive && <Chip label="Inactive" size="small" sx={{ fontSize: '0.62rem', height: 18 }} />}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {a.region || 'No region set'}{a.bio ? ` · ${a.bio.slice(0, 60)}${a.bio.length > 60 ? '…' : ''}` : ''}
                  </Typography>
                </Box>
                <Switch size="small" color="success" checked={a.isActive} onChange={() => handleActiveToggle(a)} />
                <IconButton size="small" onClick={() => openEdit(a)}><Edit sx={{ fontSize: 16 }} /></IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(a.id)}><Delete sx={{ fontSize: 16 }} /></IconButton>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
              No artisans yet — add the first maker or workshop to credit on a product page.
            </Typography>
          )}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editItem ? `Edit: ${editItem.name}` : 'Add Artisan'}
          <IconButton size="small" onClick={closeDialog}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField label="Name *" size="small" fullWidth
              {...formik.getFieldProps('name')}
              error={formik.touched.name && !!formik.errors.name}
              helperText={formik.touched.name && formik.errors.name} />
            <TextField label="Region" size="small" fullWidth {...formik.getFieldProps('region')}
              placeholder="e.g. Jodhpur, Rajasthan" />
            <TextField label="Bio" size="small" fullWidth multiline rows={3} {...formik.getFieldProps('bio')} />
            <TextField label="Photo URL" size="small" fullWidth {...formik.getFieldProps('photo')}
              helperText="Full URL to a photo — no upload for this list yet." />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={formik.values.isActive} onChange={e => formik.setFieldValue('isActive', e.target.checked)} />
              <Typography variant="body2">Active</Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting}
              sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, fontWeight: 700 }}>
              {formik.isSubmitting ? 'Saving…' : editItem ? 'Save Changes' : 'Create Artisan'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
