'use client';
import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Grid, TextField, InputAdornment, IconButton,
  Skeleton, Pagination, Chip, Drawer, Button, FormControl, Select, MenuItem,
  useMediaQuery, useTheme,
} from '@mui/material';
import { Search, Close, TuneOutlined } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { productApi, materialApi, styleApi, roomApi } from '../../../../services/api.service';
import { FilterPanel, PRICE_RANGE, type FilterPanelProps } from '../../../../components/shop/FilterPanel';
import ProductCard from '../../../../components/product/ProductCard';
import { SORT_OPTIONS } from '../../../../constants';
import type { Material, Style, Room } from '../../../../types';
import { useCountry } from '../../../../contexts/CountryContext';
import { withCountry } from '../../../../lib/withCountry';

export default function SearchPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchParams = useSearchParams();
  const router = useRouter();
  const { country } = useCountry();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('featured');
  const [filterOpen, setFilterOpen] = useState(false);
  const limit = 24;

  // Phase 4 §6 — the same Material/Style/Room/price filters `/shop` offers,
  // via the same `FilterPanel` component. Size/Color are kept only because
  // `FilterPanel` itself renders them unconditionally (tracked separately —
  // see tasks/TASKS.md — as a furniture-relabeling gap, out of scope here).
  const [materials, setMaterials] = useState<Material[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>(PRICE_RANGE);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  useEffect(() => {
    materialApi.getAll().then(({ data }) => setMaterials(data.data || [])).catch(() => setMaterials([]));
    styleApi.getAll().then(({ data }) => setStyles(data.data || [])).catch(() => setStyles([]));
    roomApi.getAll().then(({ data }) => setRooms(data.data || [])).catch(() => setRooms([]));
  }, []);

  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setInputValue(q);
    setPage(1);
  }, [searchParams]);

  const fetchResults = useCallback(async () => {
    if (!query) { setProducts([]); setTotal(0); return; }
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        search: query, page, limit, sortBy, country: country || undefined,
      };
      if (selectedSizes.length) params.sizes = selectedSizes.join(',');
      if (selectedColors.length) params.colors = selectedColors.join(',');
      if (priceRange[0] > 0) params.minPrice = priceRange[0];
      if (priceRange[1] < PRICE_RANGE[1]) params.maxPrice = priceRange[1];
      if (selectedMaterial) params.materialSlug = selectedMaterial;
      if (selectedStyle) params.styleSlug = selectedStyle;
      if (selectedRoom) params.roomSlug = selectedRoom;

      const { data } = await productApi.getAll(params);
      setProducts(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [query, page, sortBy, selectedSizes, selectedColors, priceRange, selectedMaterial, selectedStyle, selectedRoom, country]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      router.push(withCountry(`/search?q=${encodeURIComponent(inputValue.trim())}`, country));
    }
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    setPage(1);
  };
  const toggleColor = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
    setPage(1);
  };
  const selectMaterial = (slug: string) => { setSelectedMaterial(prev => (prev === slug ? '' : slug)); setPage(1); };
  const selectStyle = (slug: string) => { setSelectedStyle(prev => (prev === slug ? '' : slug)); setPage(1); };
  const selectRoom = (slug: string) => { setSelectedRoom(prev => (prev === slug ? '' : slug)); setPage(1); };
  const handlePriceCommit = (v: number[]) => { setPriceRange(v); setPage(1); };
  const clearFilters = () => {
    setSelectedSizes([]); setSelectedColors([]); setPriceRange(PRICE_RANGE);
    setSelectedMaterial(''); setSelectedStyle(''); setSelectedRoom(''); setPage(1);
  };

  const activeFilterCount = selectedSizes.length + selectedColors.length +
    (priceRange[0] > 0 || priceRange[1] < PRICE_RANGE[1] ? 1 : 0) +
    (selectedMaterial ? 1 : 0) + (selectedStyle ? 1 : 0) + (selectedRoom ? 1 : 0);

  const filterProps: FilterPanelProps = {
    isMobile, priceRange, selectedSizes, selectedColors,
    materials, styles, rooms, selectedMaterial, selectedStyle, selectedRoom,
    activeFilterCount, onPriceCommit: handlePriceCommit,
    onToggleSize: toggleSize, onToggleColor: toggleColor,
    onSelectMaterial: selectMaterial, onSelectStyle: selectStyle, onSelectRoom: selectRoom,
    onClear: clearFilters,
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 }, py: 6 }}>
      {/* Search bar */}
      <Box sx={{ maxWidth: 600, mx: 'auto', mb: 5 }}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, textAlign: 'center', mb: 3 }}>
          Search
        </Typography>
        <form onSubmit={handleSearch}>
          <TextField
            fullWidth size="medium" placeholder="Search for furniture, materials, rooms..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
              endAdornment: inputValue && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setInputValue(''); router.push(withCountry('/search', country)); }}>
                    <Close fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: { borderRadius: 3, bgcolor: '#FFFCF5' },
            }}
          />
        </form>
      </Box>

      {/* Results */}
      {query && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" color="text.secondary">
                {loading ? 'Searching...' : `${total} results for`}
              </Typography>
              {!loading && <Chip label={`"${query}"`} size="small" onDelete={() => router.push(withCountry('/search', country))} />}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {isMobile && (
                <Button
                  startIcon={<TuneOutlined />}
                  onClick={() => setFilterOpen(true)}
                  variant="outlined" size="small"
                  sx={{ borderColor: '#3B2314' }}
                >
                  Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
                </Button>
              )}
              <FormControl size="small" sx={{ minWidth: { xs: 140, sm: 160 } }}>
                <Select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
                  {SORT_OPTIONS.map(opt => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
              {selectedSizes.map(s => (
                <Chip key={s} label={s} size="small" onDelete={() => toggleSize(s)} sx={{ bgcolor: '#3B2314', color: 'white' }} />
              ))}
              {selectedColors.map(c => (
                <Chip key={c} label={c} size="small" onDelete={() => toggleColor(c)} sx={{ bgcolor: '#3B2314', color: 'white' }} />
              ))}
              {selectedMaterial && (
                <Chip
                  label={materials.find(m => m.slug === selectedMaterial)?.name || selectedMaterial}
                  size="small" onDelete={() => selectMaterial(selectedMaterial)}
                  sx={{ bgcolor: '#3B2314', color: 'white' }}
                />
              )}
              {selectedStyle && (
                <Chip
                  label={styles.find(s => s.slug === selectedStyle)?.name || selectedStyle}
                  size="small" onDelete={() => selectStyle(selectedStyle)}
                  sx={{ bgcolor: '#3B2314', color: 'white' }}
                />
              )}
              {selectedRoom && (
                <Chip
                  label={rooms.find(r => r.slug === selectedRoom)?.name || selectedRoom}
                  size="small" onDelete={() => selectRoom(selectedRoom)}
                  sx={{ bgcolor: '#3B2314', color: 'white' }}
                />
              )}
            </Box>
          )}

          <Grid container spacing={3}>
            {/* Filters stay visible even with zero results — a shopper whose
                search + filter combination is too narrow needs to be able to
                relax a filter, not just the search term. */}
            {!isMobile && (
              <Grid item md={2.5} lg={2}>
                <Box sx={{ position: 'sticky', top: 88 }}>
                  <FilterPanel {...filterProps} />
                </Box>
              </Grid>
            )}
            <Grid item xs={12} md={9.5} lg={10}>
              {!loading && products.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 1 }}>
                    No results found
                  </Typography>
                  <Typography color="text.secondary">
                    Try different keywords, or adjust the filters.
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
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Empty state */}
      {!query && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography color="text.secondary">Start typing to search our furniture and décor...</Typography>
        </Box>
      )}

      {/* Mobile filter drawer */}
      <Drawer anchor="left" open={filterOpen} onClose={() => setFilterOpen(false)}>
        <Box sx={{ width: 280, height: '100%', overflow: 'auto' }}>
          <Box sx={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            p: 2, borderBottom: '1px solid', borderColor: 'divider',
          }}>
            <Typography fontWeight={700}>Filters</Typography>
            <IconButton onClick={() => setFilterOpen(false)}><Close /></IconButton>
          </Box>

          <FilterPanel {...filterProps} />

          <Box sx={{ p: 2 }}>
            <Button fullWidth variant="contained" sx={{ bgcolor: '#3B2314' }}
              onClick={() => setFilterOpen(false)}>
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
