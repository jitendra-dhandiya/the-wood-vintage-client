'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Button, Card, CardContent, IconButton, Switch,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Stack, Skeleton, Chip,
} from '@mui/material';
import { Add, Edit, Delete, CloudUpload, Close } from '@mui/icons-material';
import { storeApi } from '../../../../services/api.service';
import { toast } from 'react-hot-toast';
import { useImageCropper } from '../../../../components/common/ImageCropperProvider';

interface Store {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  email?: string;
  hours?: string;
  image?: string;
  mapLink?: string;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY_FORM = {
  name: '', address: '', city: '', phone: '', email: '', hours: '', mapLink: '', isActive: true,
};

export default function StoresAdminPage() {
  const cropImage = useImageCropper();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Store | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStores = () => {
    setLoading(true);
    storeApi.getAllAdmin()
      .then(({ data }) => setStores((data as any).data || []))
      .catch(() => toast.error('Failed to load stores'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStores(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setImageFile(null);
    setImagePreview('');
    setDialogOpen(true);
  };

  const openEdit = (store: Store) => {
    setEditing(store);
    setForm({
      name: store.name, address: store.address, city: store.city || '',
      phone: store.phone || '', email: store.email || '', hours: store.hours || '',
      mapLink: store.mapLink || '', isActive: store.isActive,
    });
    setImageFile(null);
    setImagePreview(store.image || '');
    setDialogOpen(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    // The size check moved behind the cropper: cropping re-encodes to fit the
    // 2 MB store cap, so a heavy original is now recoverable rather than
    // rejected outright.
    const cropped = await cropImage(file, 'store');
    if (!cropped) return;
    if (cropped.size > 2 * 1024 * 1024) {
      toast.error('Image must be 2 MB or smaller');
      return;
    }
    setImageFile(cropped);
    setImagePreview(URL.createObjectURL(cropped));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      toast.error('Name and address are required');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('address', form.address);
      if (form.city)    fd.append('city', form.city);
      if (form.phone)   fd.append('phone', form.phone);
      if (form.email)   fd.append('email', form.email);
      if (form.hours)   fd.append('hours', form.hours);
      if (form.mapLink) fd.append('mapLink', form.mapLink);
      fd.append('isActive', String(form.isActive));
      if (imageFile)    fd.append('image', imageFile);

      if (editing) {
        await storeApi.update(editing.id, fd);
        toast.success('Store updated');
      } else {
        fd.append('sortOrder', String(stores.length));
        await storeApi.create(fd);
        toast.success('Store added');
      }
      setDialogOpen(false);
      fetchStores();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (store: Store) => {
    const next = !store.isActive;
    setStores(prev => prev.map(s => s.id === store.id ? { ...s, isActive: next } : s));
    const fd = new FormData();
    fd.append('isActive', String(next));
    try {
      await storeApi.update(store.id, fd);
      toast.success(next ? 'Store visible' : 'Store hidden');
    } catch {
      setStores(prev => prev.map(s => s.id === store.id ? { ...s, isActive: !next } : s));
      toast.error('Update failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await storeApi.delete(deleteTarget.id);
      toast.success('Store deleted');
      setDeleteTarget(null);
      fetchStores();
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const f = (key: keyof typeof form) => ({
    value: form[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
            Store Locations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage physical store locations shown on the home page.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}
          sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, borderRadius: 1.5, fontWeight: 700, fontSize: '0.8rem' }}>
          Add Store
        </Button>
      </Box>

      {/* List */}
      {loading ? (
        <Stack spacing={1.5}>
          {[...Array(3)].map((_, i) => <Skeleton key={i} height={80} sx={{ borderRadius: 2 }} />)}
        </Stack>
      ) : stores.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, border: '1.5px dashed #e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>No stores yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add your first store location to show it on the home page.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={openAdd}
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
            Add Store
          </Button>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {stores.map((store) => (
            <Card key={store.id} elevation={0} sx={{
              border: '1px solid', borderColor: store.isActive ? 'success.main' : 'divider', borderRadius: 2,
            }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', alignItems: 'center', gap: 2 }}>
                {/* Thumbnail */}
                <Box sx={{
                  width: 60, height: 60, borderRadius: 1, overflow: 'hidden', flexShrink: 0,
                  bgcolor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {store.image
                    ? <img src={store.image} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <Typography sx={{ fontSize: '1.4rem', color: '#ccc', fontWeight: 700 }}>{store.name.charAt(0)}</Typography>
                  }
                </Box>

                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2" fontWeight={700}>{store.name}</Typography>
                    {store.city && <Chip label={store.city} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />}
                    {!store.isActive && <Chip label="Hidden" size="small" sx={{ fontSize: '0.6rem', height: 18, bgcolor: '#f5f5f5', color: 'text.disabled' }} />}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }} noWrap>
                    {store.address}
                  </Typography>
                  {(store.phone || store.hours) && (
                    <Typography variant="caption" color="text.disabled">
                      {[store.phone, store.hours].filter(Boolean).join(' · ')}
                    </Typography>
                  )}
                </Box>

                {/* Controls */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                  <IconButton size="small" onClick={() => openEdit(store)}><Edit sx={{ fontSize: 16 }} /></IconButton>
                  <IconButton size="small" onClick={() => setDeleteTarget(store)} sx={{ color: 'error.main' }}>
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                  <Switch size="small" color="success" checked={store.isActive} onChange={() => handleToggle(store)} />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* ── Add / Edit dialog ──────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editing ? 'Edit Store' : 'Add Store'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>

          {/* Image uploader */}
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
              Store Photo
            </Typography>

            {imagePreview ? (
              <Box sx={{ position: 'relative', mb: 1 }}>
                <Box
                  component="img"
                  src={imagePreview}
                  alt="Preview"
                  sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 1, display: 'block' }}
                />
                <IconButton
                  size="small"
                  onClick={clearImage}
                  sx={{
                    position: 'absolute', top: 6, right: 6,
                    bgcolor: 'rgba(0,0,0,0.55)', color: 'white',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' },
                  }}
                >
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ) : (
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  height: 130, border: '1.5px dashed #d0d0d0', borderRadius: 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 0.75, cursor: 'pointer', mb: 1,
                  bgcolor: '#fafafa',
                  transition: 'border-color 0.2s, bgcolor 0.2s',
                  '&:hover': { borderColor: '#1a1a1a', bgcolor: '#f5f5f5' },
                }}
              >
                <CloudUpload sx={{ fontSize: 32, color: '#bbb' }} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  Click to upload store photo
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  JPG, PNG, WebP · Max 2 MB
                </Typography>
              </Box>
            )}

            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageSelect}
            />

            {imagePreview && (
              <Button
                size="small"
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                sx={{ fontSize: '0.75rem', borderColor: '#ddd', color: '#555' }}
              >
                Change Photo
              </Button>
            )}
          </Box>

          <TextField label="Store Name *" size="small" fullWidth {...f('name')} />
          <TextField label="Full Address *" size="small" fullWidth multiline rows={2} {...f('address')} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
            <TextField label="City" size="small" {...f('city')} />
            <TextField label="Phone" size="small" {...f('phone')} />
          </Box>
          <TextField label="Opening Hours" size="small" fullWidth placeholder="e.g. Mon–Sun: 11:30AM – 9:30PM" {...f('hours')} />
          <TextField label="Google Maps Link" size="small" fullWidth placeholder="https://maps.google.com/..." {...f('mapLink')} />
          <TextField label="Email (optional)" size="small" fullWidth {...f('email')} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
            {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Store'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirm ─────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Store?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will permanently remove <strong>"{deleteTarget?.name}"</strong>. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
