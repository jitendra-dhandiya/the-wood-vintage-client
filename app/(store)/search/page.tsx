'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Grid, TextField, InputAdornment, IconButton,
  Skeleton, Pagination, Chip,
} from '@mui/material';
import { Search, Close } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { productApi } from '../../../services/api.service';
import ProductCard from '../../../components/product/ProductCard';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 24;

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setInputValue(q);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    if (!query) { setProducts([]); setTotal(0); return; }
    setLoading(true);
    productApi.search({ q: query, page, limit })
      .then(({ data }) => { setProducts(data.data || []); setTotal(data.meta?.total || 0); })
      .finally(() => setLoading(false));
  }, [query, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 }, py: 6 }}>
      {/* Search bar */}
      <Box sx={{ maxWidth: 600, mx: 'auto', mb: 6 }}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, textAlign: 'center', mb: 3 }}>
          Search
        </Typography>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth size="medium" placeholder="Search for styles, brands, categories..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              endAdornment: inputValue && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setInputValue(''); router.push('/search'); }}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 3, bgcolor: '#fafafa' },
            }}
          />
        </form>
      </Box>

      {/* Results */}
      {query && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {loading ? 'Searching...' : `${total} results for`}
            </Typography>
            {!loading && <Chip label={`"${query}"`} size="small" onDelete={() => router.push('/search')} />}
          </Box>

          {!loading && products.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 1 }}>
                No results found
              </Typography>
              <Typography color="text.secondary">
                Try different keywords or browse our categories.
              </Typography>
            </Box>
          )}

          <Grid container spacing={2.5}>
            {loading ? (
              [...Array(8)].map((_, i) => (
                <Grid item xs={6} sm={4} md={3} key={i}>
                  <Skeleton variant="rectangular" height={360} sx={{ borderRadius: 2 }} />
                </Grid>
              ))
            ) : products.map((p, i) => (
              <Grid item xs={6} sm={4} md={3} key={p.id}>
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <ProductCard product={p} />
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
      )}

      {/* Empty state */}
      {!query && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">Start typing to search products...</Typography>
        </Box>
      )}
    </Box>
  );
}
