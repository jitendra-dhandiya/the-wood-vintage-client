'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, CardMedia,
  CardActions, Chip, IconButton, Dialog, DialogContent, TextField,
  InputAdornment, Skeleton, TablePagination, Snackbar,
} from '@mui/material';
import { CloudUpload, Delete, ContentCopy, Search, Close } from '@mui/icons-material';
import { mediaApi } from '../../../../services/api.service';
import { formatDate } from '../../../../utils/format';
import { toast } from 'react-hot-toast';
import { useImageCropperBatch } from '../../../../components/common/ImageCropperProvider';

export default function MediaPage() {
  const cropImages = useImageCropperBatch();
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [preview, setPreview] = useState<any>(null);
  const rowsPerPage = 24;

  const fetchMedia = useCallback(() => {
    setLoading(true);
    mediaApi.getAll({ page: page + 1, limit: rowsPerPage, search })
      .then(({ data }) => { setMedia(data.data || []); setTotal(data.meta?.total || 0); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchMedia, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchMedia, search]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (!picked.length) return;
    // One dialog per file, in order. Anything cancelled is dropped rather than
    // uploaded raw — a cancel means "not this one", not "skip the crop".
    const files = await cropImages(picked, 'media');
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      await mediaApi.upload(fd);
      toast.success(`${files.length} file(s) uploaded`);
      fetchMedia();
    } catch {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this file?')) return;
    try {
      await mediaApi.delete(id);
      fetchMedia();
    } catch {
      toast.error('Delete failed');
    }
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied!');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>Media Library</Typography>
        <Button variant="contained" startIcon={<CloudUpload />} component="label" disabled={uploading}
          sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
          {uploading ? 'Uploading...' : 'Upload Files'}
          <input type="file" hidden multiple accept="image/*" onChange={handleUpload} />
        </Button>
      </Box>

      <Box sx={{ mb: 2.5 }}>
        <TextField
          size="small" placeholder="Search files..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
          sx={{ width: 300 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
      </Box>

      <Grid container spacing={2}>
        {loading ? [...Array(12)].map((_, i) => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={i}>
            <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
          </Grid>
        )) : media.map(m => (
          <Grid item xs={6} sm={4} md={3} lg={2} key={m.id}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5, overflow: 'hidden' }}>
              <Box
                sx={{ height: 130, bgcolor: '#f5f5f5', cursor: 'pointer', overflow: 'hidden' }}
                onClick={() => setPreview(m)}
              >
                <CardMedia
                  component="img" image={m.url} alt={m.name}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              <CardContent sx={{ p: 1, pb: '4px !important' }}>
                <Typography variant="caption" fontWeight={600} noWrap display="block">
                  {m.name || m.originalName}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem' }}>
                  {m.size ? `${(m.size / 1024).toFixed(0)} KB` : ''} · {formatDate(m.createdAt)}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 0.5, pt: 0 }}>
                <IconButton size="small" onClick={() => copyUrl(m.url)}>
                  <ContentCopy sx={{ fontSize: 14 }} />
                </IconButton>
                <IconButton size="small" color="error" onClick={() => handleDelete(m.id)}>
                  <Delete sx={{ fontSize: 14 }} />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TablePagination
        component="div" count={total} page={page} rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[rowsPerPage]}
        onPageChange={(_, p) => setPage(p)}
        sx={{ mt: 2 }}
      />

      {/* Preview dialog */}
      <Dialog open={!!preview} onClose={() => setPreview(null)} maxWidth="md">
        <DialogContent sx={{ p: 0, position: 'relative' }}>
          <IconButton onClick={() => setPreview(null)}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff' }}>
            <Close />
          </IconButton>
          {preview && (
            <Box>
              <Box component="img" src={preview.url} alt={preview.name}
                sx={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', display: 'block' }} />
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Typography variant="body2" fontWeight={700}>{preview.name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                  {preview.url}
                </Typography>
                <Button size="small" startIcon={<ContentCopy />} onClick={() => copyUrl(preview.url)} sx={{ mt: 1 }}>
                  Copy URL
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
