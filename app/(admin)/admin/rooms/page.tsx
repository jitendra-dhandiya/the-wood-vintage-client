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
import { roomApi } from '../../../../services/api.service';
import { toast } from 'react-hot-toast';
import type { Room } from '../../../../types';

/**
 * Rooms admin — same shape as the Categories screen (name, slug,
 * description, image, sortOrder, isActive), trimmed to what the backend
 * model actually has: no parent, no gender, no nav/home toggles, no SEO
 * fields, and `image` is a plain URL string — the Room model has no file
 * upload, unlike Category. See
 * documentation/docs/architecture/phase-2-handicraft-domain-spec.md.
 */

const schema = Yup.object({
  name: Yup.string().required('Name required'),
  slug: Yup.string().matches(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    { excludeEmptyString: true, message: 'Lowercase letters, numbers and single hyphens only' },
  ),
  description: Yup.string(),
  image: Yup.string(),
  sortOrder: Yup.number(),
  isActive: Yup.boolean(),
});

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<Room | null>(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    roomApi.getAllAdmin()
      .then(({ data }) => setRooms(data.data || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const formik = useFormik({
    initialValues: { name: '', slug: '', description: '', image: '', sortOrder: 0, isActive: true },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const payload: any = { ...values };
        // A blank slug means "leave it as it is" / "derive from name" — the
        // backend already treats an absent key that way, same as Categories.
        if (!payload.slug.trim()) delete payload.slug;
        if (editItem) {
          await roomApi.update(editItem.id, payload);
          toast.success('Room updated');
        } else {
          await roomApi.create(payload);
          toast.success('Room created');
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
    formik.resetForm({ values: { name: '', slug: '', description: '', image: '', sortOrder: 0, isActive: true } });
    setDialogOpen(true);
  };

  const openEdit = (m: Room) => {
    setEditItem(m);
    formik.resetForm({
      values: {
        name: m.name || '', slug: m.slug || '', description: m.description || '',
        image: m.image || '', sortOrder: m.sortOrder ?? 0, isActive: m.isActive ?? true,
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
    if (!confirm('Delete this room? Products using it keep their record but lose the link.')) return;
    try {
      await roomApi.delete(id);
      toast.success('Deleted');
      fetchAll();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const handleActiveToggle = async (m: Room) => {
    const next = !m.isActive;
    setRooms(prev => prev.map(x => x.id === m.id ? { ...x, isActive: next } : x));
    try {
      await roomApi.update(m.id, { isActive: next });
    } catch {
      setRooms(prev => prev.map(x => x.id === m.id ? { ...x, isActive: !next } : x));
      toast.error('Update failed');
    }
  };

  const filtered = rooms.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
            Rooms
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            The room taxonomy shoppers filter by and products are tagged with (e.g. Living Room, Bedroom, Outdoor).
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ bgcolor: '#3B2314', '&:hover': { bgcolor: '#333' }, borderRadius: 1.5, fontWeight: 700, fontSize: '0.8rem' }}>
          Add Room
        </Button>
      </Box>

      <TextField size="small" placeholder="Search rooms…" sx={{ width: 260, mb: 2.5 }}
        value={search} onChange={e => setSearch(e.target.value)}
        InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }} />

      {loading ? (
        <Stack spacing={1.5}>
          {[...Array(5)].map((_, i) => <Skeleton key={i} height={64} sx={{ borderRadius: 2 }} />)}
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          {filtered.map(m => (
            <Card key={m.id} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, opacity: m.isActive ? 1 : 0.6 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar src={m.image || undefined} variant="rounded" sx={{ width: 48, height: 48, bgcolor: '#f0f0f0' }}>
                  {m.name.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={700}>{m.name}</Typography>
                    {!m.isActive && <Chip label="Inactive" size="small" sx={{ fontSize: '0.62rem', height: 18 }} />}
                  </Box>
                  <Typography variant="caption" color="text.secondary">/{m.slug} · order {m.sortOrder}</Typography>
                </Box>
                <Switch size="small" color="success" checked={m.isActive} onChange={() => handleActiveToggle(m)} />
                <IconButton size="small" onClick={() => openEdit(m)}><Edit sx={{ fontSize: 16 }} /></IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(m.id)}><Delete sx={{ fontSize: 16 }} /></IconButton>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>No rooms found</Typography>
          )}
        </Stack>
      )}

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {editItem ? `Edit: ${editItem.name}` : 'Add Room'}
          <IconButton size="small" onClick={closeDialog}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField label="Name *" size="small" fullWidth
              {...formik.getFieldProps('name')}
              error={formik.touched.name && !!formik.errors.name}
              helperText={formik.touched.name && formik.errors.name} />
            <TextField
              label="URL slug" size="small" fullWidth name="slug"
              value={formik.values.slug}
              onBlur={formik.handleBlur}
              onChange={(e) => formik.setFieldValue(
                'slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+/, ''),
              )}
              error={formik.touched.slug && !!formik.errors.slug}
              helperText={formik.touched.slug && formik.errors.slug ? formik.errors.slug : 'Leave blank to build one from the name.'}
            />
            <TextField label="Description" size="small" fullWidth multiline rows={2} {...formik.getFieldProps('description')} />
            <TextField label="Image URL" size="small" fullWidth {...formik.getFieldProps('image')}
              helperText="Full URL to an image — no upload for this list yet." />
            <TextField label="Sort Order" size="small" type="number" fullWidth {...formik.getFieldProps('sortOrder')}
              helperText="Lower = shown first" />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={formik.values.isActive} onChange={e => formik.setFieldValue('isActive', e.target.checked)} />
              <Typography variant="body2">Active</Typography>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting}
              sx={{ bgcolor: '#3B2314', '&:hover': { bgcolor: '#333' }, fontWeight: 700 }}>
              {formik.isSubmitting ? 'Saving…' : editItem ? 'Save Changes' : 'Create Room'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
