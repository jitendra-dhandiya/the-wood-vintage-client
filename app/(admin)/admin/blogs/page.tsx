'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Chip, IconButton, Avatar,
  Table, TableBody, TableCell, TableHead, TableRow, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem,
  FormControlLabel, Switch, Skeleton, Grid,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { blogApi } from '../../../../services/api.service';
import { formatDate } from '../../../../utils/format';
import { toast } from 'react-hot-toast';
import { useImageCropper } from '../../../../components/common/ImageCropperProvider';

const schema = Yup.object({
  title: Yup.string().required('Title required'),
  content: Yup.string().required('Content required'),
  excerpt: Yup.string(),
  category: Yup.string(),
  metaTitle: Yup.string(),
  metaDescription: Yup.string(),
});

export default function BlogsPage() {
  const cropImage = useImageCropper();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editBlog, setEditBlog] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const fetchBlogs = useCallback(() => {
    setLoading(true);
    blogApi.getAll({ page: page + 1, limit: 15 })
      .then(({ data }) => { setBlogs(data.data || []); setTotal(data.meta?.total || 0); })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => { fetchBlogs(); }, [fetchBlogs]);

  const formik = useFormik({
    initialValues: {
      title: '', excerpt: '', content: '', category: 'Fashion',
      isPublished: false, metaTitle: '', metaDescription: '',
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => fd.append(k, String(v)));
        if (imageFile) fd.append('image', imageFile);
        if (editBlog) {
          await blogApi.update(editBlog.id, fd);
          toast.success('Blog updated');
        } else {
          await blogApi.create(fd);
          toast.success('Blog created');
        }
        closeDialog();
        fetchBlogs();
      } catch {
        toast.error('Save failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const openCreate = () => { setEditBlog(null); setImageFile(null); setImagePreview(''); formik.resetForm(); setDialogOpen(true); };
  const openEdit = (b: any) => {
    setEditBlog(b);
    setImagePreview(b.coverImage || '');
    formik.setValues({ title: b.title, excerpt: b.excerpt || '', content: b.content, category: b.category || 'Fashion', isPublished: b.isPublished, metaTitle: b.seoMeta?.metaTitle || '', metaDescription: b.seoMeta?.metaDescription || '' });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditBlog(null); formik.resetForm(); };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>Blog Posts</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}
          sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>Write Post</Button>
      </Box>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <CardContent sx={{ p: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {['Post', 'Category', 'Status', 'Date', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.secondary', textTransform: 'uppercase' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? [...Array(6)].map((_, i) => (
                <TableRow key={i}>{[...Array(5)].map((_, j) => <TableCell key={j}><Skeleton /></TableCell>)}</TableRow>
              )) : blogs.map(b => (
                <TableRow key={b.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar src={b.coverImage} variant="rounded" sx={{ width: 48, height: 40, bgcolor: '#f5f5f5' }} />
                      <Box>
                        <Typography variant="body2" fontWeight={600} sx={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {b.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>/{b.slug}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{b.category}</TableCell>
                  <TableCell>
                    <Chip label={b.isPublished ? 'Published' : 'Draft'} size="small"
                      color={b.isPublished ? 'success' : 'default'}
                      sx={{ fontSize: '0.65rem', fontWeight: 700, height: 20 }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.8rem' }}>{formatDate(b.createdAt)}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(b)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={async () => {
                      if (!confirm('Delete post?')) return;
                      await blogApi.delete(b.id);
                      fetchBlogs();
                    }}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div" count={total} page={page} rowsPerPage={15}
            rowsPerPageOptions={[15]} onPageChange={(_, p) => setPage(p)} />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>{editBlog ? 'Edit Post' : 'New Blog Post'}</DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <Box>
              {imagePreview && (
                <Box component="img" src={imagePreview} alt="cover"
                  sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 1, mb: 1 }} />
              )}
              <Button variant="outlined" component="label" size="small">
                {imagePreview ? 'Change Cover' : 'Upload Cover Image'}
                <input type="file" hidden accept="image/*" onChange={async e => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (!f) return;
                  const cropped = await cropImage(f, 'blog');
                  if (cropped) { setImageFile(cropped); setImagePreview(URL.createObjectURL(cropped)); }
                }} />
              </Button>
            </Box>
            <TextField label="Title" size="small" fullWidth required
              {...formik.getFieldProps('title')}
              error={formik.touched.title && !!formik.errors.title} />
            <TextField label="Category" size="small" fullWidth {...formik.getFieldProps('category')} />
            <TextField label="Excerpt" size="small" fullWidth multiline rows={2} {...formik.getFieldProps('excerpt')} />
            <TextField label="Content (HTML or Markdown)" size="small" fullWidth multiline rows={10} required
              {...formik.getFieldProps('content')}
              error={formik.touched.content && !!formik.errors.content} />
            <TextField label="Meta Title" size="small" fullWidth {...formik.getFieldProps('metaTitle')} />
            <TextField label="Meta Description" size="small" fullWidth multiline rows={2} {...formik.getFieldProps('metaDescription')} />
            <FormControlLabel
              control={<Switch checked={formik.values.isPublished}
                onChange={e => formik.setFieldValue('isPublished', e.target.checked)} />}
              label="Published"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={formik.isSubmitting}
              sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
              {editBlog ? 'Save' : 'Publish'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
