'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Box, Container, Grid, Typography, Drawer, IconButton,
  FormControl, Select, MenuItem, Slider,
  Chip, Button, Divider, useMediaQuery, useTheme,
  Pagination, CircularProgress,
} from '@mui/material';
import { Close, TuneOutlined } from '@mui/icons-material';
import { motion } from 'framer-motion';
import ProductCard, { ProductCardSkeleton } from '../../../../components/product/ProductCard';
import { productApi, materialApi, styleApi, roomApi } from '../../../../services/api.service';
import { PRODUCT_SIZES, PRODUCT_COLORS, SORT_OPTIONS } from '../../../../constants';
import type { Product, Material, Style, Room } from '../../../../types';
import { useAppSelector } from '../../../../store';
import { useCountry } from '../../../../contexts/CountryContext';

const PRICE_RANGE = [0, 5000];

// ── Filter panel ──────────────────────────────────────────────
// Defined at module level — stable identity, never remounted.
// Slider uses its own local state for smooth drag; only calls
// onPriceCommit when the thumb is released (onChangeCommitted).
interface FilterPanelProps {
  isMobile: boolean;
  priceRange: number[];          // committed value (from parent)
  selectedSizes: string[];
  selectedColors: string[];
  materials: Material[];
  styles: Style[];
  rooms: Room[];
  selectedMaterial: string;
  selectedStyle: string;
  selectedRoom: string;
  activeFilterCount: number;
  onPriceCommit: (v: number[]) => void;
  onToggleSize: (s: string) => void;
  onToggleColor: (c: string) => void;
  onSelectMaterial: (slug: string) => void;
  onSelectStyle: (slug: string) => void;
  onSelectRoom: (slug: string) => void;
  onClear: () => void;
}

function FilterPanel({
  isMobile, priceRange, selectedSizes, selectedColors,
  materials, styles, rooms, selectedMaterial, selectedStyle, selectedRoom,
  activeFilterCount, onPriceCommit, onToggleSize, onToggleColor,
  onSelectMaterial, onSelectStyle, onSelectRoom, onClear,
}: FilterPanelProps) {
  // Local state drives slider visuals smoothly — no API call on every drag
  const [localPrice, setLocalPrice] = useState<number[]>(priceRange);

  // Sync when parent resets filters (e.g. "Clear All")
  useEffect(() => { setLocalPrice(priceRange); }, [priceRange]);

  return (
    <Box sx={{ p: isMobile ? 2 : 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Filters</Typography>
        {activeFilterCount > 0 && (
          <Button size="small" onClick={onClear} sx={{ color: '#c9a84c' }}>Clear All</Button>
        )}
      </Box>

      {/* Price range */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Price Range</Typography>
      <Box sx={{ px: 1, mb: 2 }}>
        <Slider
          value={localPrice}
          onChange={(_, v) => setLocalPrice(v as number[])}
          onChangeCommitted={(_, v) => onPriceCommit(v as number[])}
          min={0} max={5000} step={100}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => `₹${v}`}
          sx={{ color: '#1a1a1a' }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">₹{localPrice[0]}</Typography>
          <Typography variant="caption">₹{localPrice[1]}</Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Sizes */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Size</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
        {PRODUCT_SIZES.map((size) => (
          <Chip
            key={size} label={size} size="small"
            onClick={() => onToggleSize(size)}
            variant={selectedSizes.includes(size) ? 'filled' : 'outlined'}
            sx={{
              cursor: 'pointer',
              ...(selectedSizes.includes(size) && { bgcolor: '#1a1a1a', color: 'white', '&:hover': { bgcolor: '#333' } }),
            }}
          />
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Colors */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Color</Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
        {PRODUCT_COLORS.map((color) => (
          <Chip
            key={color} label={color} size="small"
            onClick={() => onToggleColor(color)}
            variant={selectedColors.includes(color) ? 'filled' : 'outlined'}
            sx={{
              cursor: 'pointer',
              ...(selectedColors.includes(color) && { bgcolor: '#1a1a1a', color: 'white', '&:hover': { bgcolor: '#333' } }),
            }}
          />
        ))}
      </Box>

      {/* Material / Style / Room — Phase 2 handicraft taxonomy. Single-select
          per facet (a product carries one of each, not many), so these
          render as a toggleable chip row exactly like Size/Color above but
          with click-to-clear on the active one instead of multi-select. Each
          section is absent entirely when the taxonomy list hasn't loaded or
          is empty, rather than showing an empty heading. */}
      {materials.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Material</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {materials.map((m) => (
              <Chip
                key={m.id} label={m.name} size="small"
                onClick={() => onSelectMaterial(m.slug)}
                variant={selectedMaterial === m.slug ? 'filled' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  ...(selectedMaterial === m.slug && { bgcolor: '#1a1a1a', color: 'white', '&:hover': { bgcolor: '#333' } }),
                }}
              />
            ))}
          </Box>
        </>
      )}

      {styles.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Style</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {styles.map((s) => (
              <Chip
                key={s.id} label={s.name} size="small"
                onClick={() => onSelectStyle(s.slug)}
                variant={selectedStyle === s.slug ? 'filled' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  ...(selectedStyle === s.slug && { bgcolor: '#1a1a1a', color: 'white', '&:hover': { bgcolor: '#333' } }),
                }}
              />
            ))}
          </Box>
        </>
      )}

      {rooms.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Room</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {rooms.map((r) => (
              <Chip
                key={r.id} label={r.name} size="small"
                onClick={() => onSelectRoom(r.slug)}
                variant={selectedRoom === r.slug ? 'filled' : 'outlined'}
                sx={{
                  cursor: 'pointer',
                  ...(selectedRoom === r.slug && { bgcolor: '#1a1a1a', color: 'white', '&:hover': { bgcolor: '#333' } }),
                }}
              />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function ShopPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const searchParams = useSearchParams();
  const gender = useAppSelector((s) => s.gender.selected);
  const { country } = useCountry();

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true); // skeleton on first load only
  const [fetching, setFetching] = useState(false);            // dim on filter changes
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>(PRICE_RANGE); // committed value only
  const [sortBy, setSortBy] = useState('featured');

  // Phase 2 handicraft taxonomy — single-select per facet, matching the
  // backend's single-select Material/Style/Room relations on Product.
  const [materials, setMaterials] = useState<Material[]>([]);
  const [styles, setStyles] = useState<Style[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  const limit = 20;

  // Loaded once — these are small, admin-managed lookup lists (11/11/8 rows
  // today), not something that needs to track filter state.
  useEffect(() => {
    materialApi.getAll().then(({ data }) => setMaterials(data.data || [])).catch(() => setMaterials([]));
    styleApi.getAll().then(({ data }) => setStyles(data.data || [])).catch(() => setStyles([]));
    roomApi.getAll().then(({ data }) => setRooms(data.data || [])).catch(() => setRooms([]));
  }, []);

  const fetchProducts = useCallback(async () => {
    setFetching(true);
    try {
      const params: Record<string, unknown> = {
        page, limit, sortBy,
        search: searchParams.get('search') || undefined,
        categorySlug: searchParams.get('category') || undefined,
        collectionSlug: searchParams.get('collection') || undefined,
        isFeatured: searchParams.get('isFeatured') || undefined,
        isTrending: searchParams.get('isTrending') || undefined,
        isNewArrival: searchParams.get('isNewArrival') || undefined,
        isBestSeller: searchParams.get('isBestSeller') || undefined,
        gender: gender || undefined,
        country: country || undefined,
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
      setFetching(false);
      setInitialLoading(false);
    }
  }, [page, sortBy, selectedSizes, selectedColors, priceRange, selectedMaterial, selectedStyle, selectedRoom, searchParams, gender, country]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    setPage(1);
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
    setPage(1);
  };

  // Single-select: clicking the already-active chip clears the facet,
  // clicking another swaps it — there is only ever one Material/Style/Room
  // per product to match against.
  const selectMaterial = (slug: string) => {
    setSelectedMaterial(prev => (prev === slug ? '' : slug));
    setPage(1);
  };
  const selectStyle = (slug: string) => {
    setSelectedStyle(prev => (prev === slug ? '' : slug));
    setPage(1);
  };
  const selectRoom = (slug: string) => {
    setSelectedRoom(prev => (prev === slug ? '' : slug));
    setPage(1);
  };

  const clearFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
    setPriceRange(PRICE_RANGE);
    setSortBy('newest');
    setSelectedMaterial('');
    setSelectedStyle('');
    setSelectedRoom('');
    setPage(1);
  };

  // Only called when slider thumb is released — not on every drag tick
  const handlePriceCommit = (v: number[]) => { setPriceRange(v); setPage(1); };

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
    <Box sx={{ pb: { xs: 8, md: 6 } }}>
      <Container maxWidth="xl" sx={{ pt: 3 }}>
        {/* Page header */}
        {/* Wraps on phones. Without it the title and the Filter+Sort pair sit on one
            unbreakable line whose minimum is ~430px, so Chrome widens the layout
            viewport past the screen and clips the right of every row below. */}
        <Box sx={{
          mb: 3, display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexWrap: 'wrap', gap: 1.5,
        }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{
              fontFamily: 'var(--font-playfair)', fontWeight: 700,
              fontSize: { xs: '1.6rem', sm: '2.125rem' },
              overflowWrap: 'anywhere',
            }}>
              {searchParams.get('search') ? `Search: "${searchParams.get('search')}"` : 'All Products'}
            </Typography>
            {!initialLoading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">{total} products</Typography>
                {fetching && <CircularProgress size={12} sx={{ color: 'text.disabled' }} />}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {isMobile && (
              <Button
                startIcon={<TuneOutlined />}
                onClick={() => setFilterOpen(true)}
                variant="outlined" size="small"
                sx={{ borderColor: '#1a1a1a' }}
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
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {selectedSizes.map(s => (
              <Chip key={s} label={s} size="small" onDelete={() => toggleSize(s)} sx={{ bgcolor: '#1a1a1a', color: 'white' }} />
            ))}
            {selectedColors.map(c => (
              <Chip key={c} label={c} size="small" onDelete={() => toggleColor(c)} sx={{ bgcolor: '#1a1a1a', color: 'white' }} />
            ))}
            {selectedMaterial && (
              <Chip
                label={materials.find(m => m.slug === selectedMaterial)?.name || selectedMaterial}
                size="small" onDelete={() => selectMaterial(selectedMaterial)}
                sx={{ bgcolor: '#1a1a1a', color: 'white' }}
              />
            )}
            {selectedStyle && (
              <Chip
                label={styles.find(s => s.slug === selectedStyle)?.name || selectedStyle}
                size="small" onDelete={() => selectStyle(selectedStyle)}
                sx={{ bgcolor: '#1a1a1a', color: 'white' }}
              />
            )}
            {selectedRoom && (
              <Chip
                label={rooms.find(r => r.slug === selectedRoom)?.name || selectedRoom}
                size="small" onDelete={() => selectRoom(selectedRoom)}
                sx={{ bgcolor: '#1a1a1a', color: 'white' }}
              />
            )}
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Desktop filter sidebar */}
          {!isMobile && (
            <Grid item md={2.5} lg={2}>
              <Box sx={{ position: 'sticky', top: 88 }}>
                <FilterPanel {...filterProps} />
              </Box>
            </Grid>
          )}

          {/* Product grid */}
          <Grid item xs={12} md={9.5} lg={10}>
            {initialLoading ? (
              /* First load — show skeletons */
              <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Grid key={i} item xs={6} sm={4} md={3} lg={3}>
                    <ProductCardSkeleton />
                  </Grid>
                ))}
              </Grid>
            ) : products.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography variant="h6" sx={{ mb: 1 }}>No products found</Typography>
                <Typography variant="body2" color="text.secondary">Try adjusting your filters</Typography>
                <Button onClick={clearFilters} sx={{ mt: 2 }} variant="outlined">Clear Filters</Button>
              </Box>
            ) : (
              <>
                {/* Dim products while re-fetching — no layout shift, no skeleton flash */}
                <Box sx={{
                  transition: 'opacity 0.2s ease',
                  opacity: fetching ? 0.45 : 1,
                  pointerEvents: fetching ? 'none' : 'auto',
                }}>
                  <Grid container spacing={{ xs: 1.5, md: 2.5 }}>
                    {products.map((product, i) => (
                      <Grid key={product.id} item xs={6} sm={4} md={4} lg={3}>
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <ProductCard product={product} />
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {total > limit && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
                    <Pagination
                      count={Math.ceil(total / limit)}
                      page={page}
                      onChange={(_, v) => { setPage(v); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#1a1a1a', color: 'white' } }}
                    />
                  </Box>
                )}
              </>
            )}
          </Grid>
        </Grid>
      </Container>

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
            <Button fullWidth variant="contained" sx={{ bgcolor: '#1a1a1a' }}
              onClick={() => setFilterOpen(false)}>
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
}
