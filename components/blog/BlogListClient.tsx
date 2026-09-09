'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Grid, Card, CardMedia, CardContent, Chip,
  Skeleton, Pagination, TextField, InputAdornment,
} from '@mui/material';
import Link from 'next/link';
import { Search } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { blogApi } from '../../services/api.service';
import { formatDate } from '../../utils/format';

export default function BlogListClient() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const limit = 12;

  const fetchBlogs = useCallback(() => {
    setLoading(true);
    blogApi.getAll({ page, limit, search })
      .then(({ data }) => { setBlogs(data.data || []); setTotal(data.meta?.total || 0); })
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(fetchBlogs, search ? 400 : 0);
    return () => clearTimeout(t);
  }, [fetchBlogs, search]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 6 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, mb: 1 }}>
          Style Journal
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
          Fashion insights, trend reports, and style guides curated for you.
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <TextField
          size="small" placeholder="Search articles..." sx={{ width: 320, maxWidth: '100%' }}
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
        />
      </Box>

      <Grid container spacing={3}>
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={340} sx={{ borderRadius: 2 }} />
            </Grid>
          ))
        ) : blogs.map((blog, i) => (
          <Grid item xs={12} sm={6} md={4} key={blog.id}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card
                component={Link} href={`/blog/${blog.slug}`}
                elevation={0}
                sx={{
                  border: '1px solid', borderColor: 'divider', borderRadius: 2,
                  textDecoration: 'none', display: 'block', height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)' },
                }}
              >
                <CardMedia
                  component="img" image={blog.coverImage || '/placeholder-blog.jpg'} alt={blog.title}
                  sx={{ height: 200, objectFit: 'cover' }}
                />
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    {blog.category && (
                      <Chip label={blog.category} size="small"
                        sx={{ fontSize: '0.65rem', bgcolor: '#f8f4ef', color: '#c9a84c', fontWeight: 700, height: 20 }} />
                    )}
                  </Box>
                  <Typography variant="body1" fontWeight={700} sx={{ mb: 0.75, fontFamily: 'var(--font-playfair)', lineHeight: 1.4 }}>
                    {blog.title}
                  </Typography>
                  {blog.excerpt && (
                    <Typography variant="body2" color="text.secondary" sx={{
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', mb: 2,
                    }}>
                      {blog.excerpt}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(blog.publishedAt || blog.createdAt)}
                    {blog.author && ` · ${blog.author.firstName} ${blog.author.lastName}`}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {Math.ceil(total / limit) > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <Pagination count={Math.ceil(total / limit)} page={page} onChange={(_, p) => setPage(p)} color="primary" shape="rounded" />
        </Box>
      )}
    </Box>
  );
}
