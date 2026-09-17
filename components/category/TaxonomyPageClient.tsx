'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Grid, Breadcrumbs, Link as MuiLink,
  MenuItem, Select, FormControl, InputLabel, Skeleton, Pagination,
} from '@mui/material';
import Link from 'next/link';
import { NavigateNext } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { productApi } from '../../services/api.service';
import ProductCard from '../product/ProductCard';
import { useCountry } from '../../contexts/CountryContext';
import { withCountry } from '../../lib/withCountry';

const SORT_OPTIONS = [
  { value: 'createdAt:desc', label: 'Newest' },
  { value: 'basePrice:asc', label: 'Price: Low to High' },
  { value: 'basePrice:desc', label: 'Price: High to Low' },
  { value: 'rating:desc', label: 'Top Rated' },
];

export type TaxonomyType = 'material' | 'room' | 'style';

/** Material/Style/Room all mirror Category's shape (Phase 2 handicraft taxonomy). */
export interface TaxonomyItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
}

interface Props {
  type: TaxonomyType;
  item: TaxonomyItem;
}

/** The `GET /products` filter param each taxonomy type maps to (product.service.ts). */
const FILTER_PARAM: Record<TaxonomyType, string> = {
  material: 'materialSlug',
  room: 'roomSlug',
  style: 'styleSlug',
};

/**
 * Landing page for one Material/Room/Style ("wooden dining tables", "teak
 * furniture", ...) — one component parameterized by `type` rather than three
 * near-duplicates, closely following `CategoryPageClient`'s structure/filter/
 * sort/pagination pattern, just filtering products by `materialSlug`/
 * `roomSlug`/`styleSlug` instead of `categoryId`.
 */
export default function TaxonomyPageClient({ type, item }: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('createdAt:desc');
  const { country } = useCountry();
  const limit = 24;

  const fetchProducts = useCallback(() => {
    setLoading(true);
    const [sortBy, sortOrder] = sort.split(':');
    productApi.getAll({
      [FILTER_PARAM[type]]: item.slug,
      page, limit, sortBy, sortOrder, country: country || undefined,
    })
      .then(({ data }) => {
        setProducts(data.data || []);
        setTotal(data.meta?.total || 0);
      }).finally(() => setLoading(false));
  }, [type, item.slug, page, sort, country]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalPages = Math.ceil(total / limit);

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
        <MuiLink component={Link} href={withCountry('/', country)} underline="hover" color="text.secondary" variant="body2">Home</MuiLink>
        <MuiLink component={Link} href={withCountry('/shop', country)} underline="hover" color="text.secondary" variant="body2">Shop</MuiLink>
        <Typography variant="body2" color="text.primary" fontWeight={600}>{item.name}</Typography>
      </Breadcrumbs>

      {/* Hero */}
      {item.image ? (
        <Box sx={{ position: 'relative', height: { xs: 200, md: 280 }, borderRadius: 3, overflow: 'hidden', mb: 4 }}>
          <Box component="img" src={item.image} alt={item.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <Box sx={{
            position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 100%)',
            display: 'flex', alignItems: 'center', pl: { xs: 3, md: 5 },
          }}>
            <Box>
              <Typography variant="h3" sx={{ color: '#fff', fontFamily: 'var(--font-playfair)', fontWeight: 800 }}>
                {item.name}
              </Typography>
              {item.description && (
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', mt: 1, maxWidth: 400 }}>
                  {item.description}
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      ) : (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800 }}>
            {item.name}
          </Typography>
          {item.description && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1, maxWidth: 700 }}>
              {item.description}
            </Typography>
          )}
        </Box>
      )}

      {/* Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {total} {total === 1 ? 'product' : 'products'}
        </Typography>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Sort by</InputLabel>
          <Select value={sort} label="Sort by" onChange={e => { setSort(e.target.value); setPage(1); }}>
            {SORT_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {/* Products grid */}
      <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
        {loading ? (
          [...Array(12)].map((_, i) => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Skeleton variant="rectangular" height={360} sx={{ borderRadius: 2 }} />
            </Grid>
          ))
        ) : products.length === 0 ? (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary">No products found for {item.name}</Typography>
            </Box>
          </Grid>
        ) : products.map((product, i) => (
          <Grid item xs={6} sm={4} md={3} key={product.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
            >
              <ProductCard product={product} />
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
          <Pagination
            count={totalPages} page={page} onChange={(_, p) => setPage(p)}
            color="primary" shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}
