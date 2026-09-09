'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Grid, Button, Card, CardContent, Skeleton, Alert,
} from '@mui/material';
import { FavoriteBorder, Refresh } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../../../../components/product/ProductCard';
import { wishlistApi } from '../../../../services/api.service';
import { useAppSelector } from '../../../../store';
import type { Product } from '../../../../types';

interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
}

export default function WishlistPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAppSelector((s) => s.auth);

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await wishlistApi.getMyWishlist();
      // Rows whose product was since deleted would render as an empty tile.
      setItems(((data as any).data || []).filter((i: WishlistItem) => i.product));
    } catch (e: any) {
      setError(
        e?.response?.status === 401
          ? 'Please sign in to see your wishlist.'
          : 'We could not load your wishlist just now.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // The layout renders before auth rehydrates, so this waits rather than
  // bouncing a signed-in customer to the login page on a slow refresh.
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login?redirect=/account/wishlist');
    }
  }, [authLoading, isAuthenticated, router]);

  /** Dropped locally the moment the heart is turned off — no refetch needed. */
  const handleRemoved = (productId: string) => (stillSaved: boolean) => {
    if (!stillSaved) setItems(prev => prev.filter(i => i.productId !== productId));
  };

  const Header = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800 }}>
        My Wishlist
      </Typography>
      {!loading && items.length > 0 && (
        <Typography variant="body2" color="text.secondary">
          ({items.length} {items.length === 1 ? 'item' : 'items'})
        </Typography>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box>
        {Header}
        <Grid container spacing={2}>
          {[...Array(8)].map((_, i) => (
            <Grid item xs={6} sm={4} md={4} lg={3} key={i}>
              <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
              <Skeleton height={22} sx={{ mt: 1 }} />
              <Skeleton height={20} width="55%" />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        {Header}
        <Alert
          severity="error"
          action={<Button size="small" startIcon={<Refresh />} onClick={load}>Retry</Button>}
        >
          {error}
        </Alert>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box>
        {Header}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: { xs: 6, md: 9 } }}>
            <FavoriteBorder sx={{ fontSize: 56, color: '#e0e0e0', mb: 2 }} />
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 1 }}>
              Your wishlist is empty
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, px: 2 }}>
              Tap the heart on anything you like and it will be waiting here.
            </Typography>
            <Button
              variant="contained" component={Link} href="/shop"
              sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, px: 4 }}
            >
              Start shopping
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {Header}
      <Grid container spacing={2}>
        <AnimatePresence mode="popLayout">
          {items.map(item => (
            <Grid item xs={6} sm={4} md={4} lg={3} key={item.id}>
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.18 }}
              >
                {/* The canonical tile, so the wishlist looks and behaves like
                    every other product grid on the site. */}
                <ProductCard
                  product={item.product}
                  initialInWishlist
                  onWishlistChange={handleRemoved(item.productId)}
                />
              </motion.div>
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>
    </Box>
  );
}
