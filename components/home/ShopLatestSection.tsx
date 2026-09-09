'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Box, Typography, Container, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import ProductCard, { ProductCardSkeleton } from '../product/ProductCard';
import { categoryApi, productApi } from '../../services/api.service';
import { useAppDispatch } from '../../store';
import { setGender } from '../../store/slices/genderSlice';
import type { Product, Category } from '../../types';

type GenderType = 'MEN' | 'WOMEN';

// Static filter chips that map to product flags
const STATIC_CHIPS = [
  { key: 'new-arrivals', label: 'New Arrivals' },
  { key: 'trending', label: 'Trending' },
  { key: 'best-sellers', label: 'Best Sellers' },
  { key: 'featured', label: 'Featured' },
] as const;
type StaticKey = typeof STATIC_CHIPS[number]['key'];

interface Props {
  gender: GenderType;
  newArrivals?: Product[];
  trending?: Product[];
  bestSellers?: Product[];
  featured?: Product[];
  fetching?: boolean;
}

export default function ShopLatestSection({
  gender,
  newArrivals = [],
  trending = [],
  bestSellers = [],
  featured = [],
  fetching = false,
}: Props) {
  const dispatch = useAppDispatch();

  const [activeChip, setActiveChip] = useState<string>('new-arrivals');
  const [categories, setCategories] = useState<Category[]>([]);
  const [catProducts, setCatProducts] = useState<Product[]>([]);
  const [catTotal, setCatTotal] = useState<number | null>(null);
  const [catLoading, setCatLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load category chips once on mount
  useEffect(() => {
    categoryApi.getAll({ limit: 12, isActive: true })
      .then(({ data }) => setCategories((data as any).data || []))
      .catch(() => {});
  }, []);

  // Fetch products when a category chip is selected or gender changes
  useEffect(() => {
    const isStatic = STATIC_CHIPS.some(c => c.key === activeChip);
    if (isStatic) { setCatProducts([]); setCatTotal(null); return; }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setCatLoading(true);
    productApi.getAll({ categorySlug: activeChip, gender, limit: 8, isActive: true })
      .then(({ data }: any) => {
        if (controller.signal.aborted) return;
        setCatProducts(data?.data || []);
        setCatTotal(data?.total ?? null);
      })
      .catch(() => { if (!controller.signal.aborted) setCatProducts([]); })
      .finally(() => { if (!controller.signal.aborted) setCatLoading(false); });

    return () => controller.abort();
  }, [activeChip, gender]);

  // Resolve displayed products
  const staticMap: Record<StaticKey, Product[]> = {
    'new-arrivals': newArrivals,
    'trending': trending,
    'best-sellers': bestSellers,
    'featured': featured,
  };
  const isStaticChip = STATIC_CHIPS.some(c => c.key === activeChip);
  const displayProducts = isStaticChip
    ? (staticMap[activeChip as StaticKey] || []).slice(0, 8)
    : catProducts;
  const isLoading = fetching || catLoading;

  const staticTotals: Record<StaticKey, number | null> = {
    'new-arrivals': newArrivals.length || null,
    trending: trending.length || null,
    'best-sellers': bestSellers.length || null,
    featured: featured.length || null,
  };
  const total = isStaticChip ? staticTotals[activeChip as StaticKey] : catTotal;

  const viewAllLink = () => {
    if (activeChip === 'new-arrivals') return `/shop?isNewArrival=true&gender=${gender}`;
    if (activeChip === 'trending') return `/shop?isTrending=true&gender=${gender}`;
    if (activeChip === 'best-sellers') return `/shop?isBestSeller=true&gender=${gender}`;
    if (activeChip === 'featured') return `/shop?isFeatured=true&gender=${gender}`;
    return `/category/${activeChip}`;
  };

  return (
    <Box sx={{ py: { xs: 7, md: 11 }, bgcolor: '#fff' }}>
      <Container maxWidth="xl">

        {/* ── Header row: heading + gender tabs ─────────────────── */}
        <Box sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'flex-end' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 },
          mb: { xs: 3, md: 4 },
        }}>
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.75rem', sm: '2.2rem', md: '2.75rem' },
                color: '#111',
                letterSpacing: '-0.025em',
                lineHeight: 1.1,
              }}
            >
              Shop the latest
            </Typography>
          </motion.div>

          {/* Woman / Man tabs */}
          <Box sx={{ display: 'flex', borderBottom: '2px solid #e8e8e8' }}>
            {(['WOMEN', 'MEN'] as const).map((g) => {
              const active = gender === g;
              return (
                <Box
                  key={g}
                  component="button"
                  onClick={() => dispatch(setGender(g))}
                  sx={{
                    px: { xs: 2.5, md: 3 },
                    py: 1,
                    bgcolor: 'transparent',
                    border: 'none',
                    borderBottom: active ? '2px solid #111' : '2px solid transparent',
                    mb: '-2px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: active ? 700 : 400,
                    color: active ? '#111' : '#aaa',
                    letterSpacing: '0.02em',
                    transition: 'all 0.2s',
                    outline: 'none',
                    whiteSpace: 'nowrap',
                    '&:hover': { color: '#111' },
                  }}
                >
                  {g === 'WOMEN' ? 'Woman' : 'Man'}
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ── Filter chips ───────────────────────────────────────── */}
        {/* h-scroll re-allows horizontal panning inside this strip; body-level
            touch-action rules it out, which left the chips past the right edge
            reachable by mouse but not by finger. */}
        <Box className="h-scroll" sx={{
          display: 'flex',
          gap: { xs: 0.75, md: 1 },
          mb: { xs: 4, md: 5 },
          overflowX: 'auto',
          pb: 0.5,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}>
          {/* Static chips */}
          {STATIC_CHIPS.map((chip) => (
            <Chip key={chip.key} label={chip.label} active={activeChip === chip.key} onClick={() => setActiveChip(chip.key)} />
          ))}

          {/* Divider dot */}
          {categories.length > 0 && (
            <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', px: 0.5 }}>
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#ddd' }} />
            </Box>
          )}

          {/* Dynamic category chips */}
          {categories.map((cat) => (
            <Chip key={cat.id} label={cat.name} active={activeChip === cat.slug} onClick={() => setActiveChip(cat.slug)} />
          ))}
        </Box>

        {/* ── Product grid ───────────────────────────────────────── */}
        <Box sx={{ opacity: isLoading ? 0.45 : 1, transition: 'opacity 0.25s' }}>
          <Grid container spacing={{ xs: 1.5, sm: 2, md: 2.5 }}>
            {isLoading || displayProducts.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Grid key={i} item xs={6} sm={4} md={3}>
                    <ProductCardSkeleton />
                  </Grid>
                ))
              : displayProducts.map((product) => (
                  <Grid key={product.id} item xs={6} sm={4} md={3}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
          </Grid>
        </Box>

        {/* ── View All pill button ───────────────────────────────── */}
        {!isLoading && displayProducts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Box sx={{ mt: { xs: 5, md: 6 }, textAlign: 'center' }}>
              <Box
                component={Link}
                href={viewAllLink()}
                sx={{
                  display: 'inline-block',
                  px: { xs: 4, md: 5.5 },
                  py: { xs: 1.35, md: 1.55 },
                  borderRadius: '100px',
                  bgcolor: '#111',
                  color: 'white',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  transition: 'background 0.22s, transform 0.18s',
                  '&:hover': { bgcolor: '#333', transform: 'translateY(-1px)' },
                }}
              >
                View All{total ? ` (${total})` : ''}
              </Box>
            </Box>
          </motion.div>
        )}

      </Container>
    </Box>
  );
}

// ── Reusable chip ─────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <Box
      component="button"
      onClick={onClick}
      sx={{
        flexShrink: 0,
        px: { xs: 2, md: 2.5 },
        py: { xs: 0.8, md: 0.9 },
        borderRadius: '100px',
        border: '1.5px solid',
        borderColor: active ? '#111' : '#e0e0e0',
        bgcolor: active ? '#111' : 'transparent',
        color: active ? 'white' : '#555',
        fontSize: { xs: '0.78rem', md: '0.82rem' },
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        letterSpacing: '0.01em',
        transition: 'all 0.18s ease',
        outline: 'none',
        whiteSpace: 'nowrap',
        '&:hover': {
          borderColor: '#111',
          color: active ? 'white' : '#111',
          bgcolor: active ? '#111' : '#f5f5f5',
        },
      }}
    >
      {label}
    </Box>
  );
}
