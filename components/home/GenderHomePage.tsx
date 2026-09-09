'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useAppSelector } from '../../store';
import HeroSlider from './HeroSlider';
import ProductSection from './ProductSection';
import ShopLatestSection from './ShopLatestSection';
import CollectionBanners from './CollectionBanners';
import CategoryShowcase from './CategoryShowcase';
import TestimonialsSection from './TestimonialsSection';
import PromoBanners from './PromoBanners';
import StoreLocations from './StoreLocations';
import MarqueeStrip from './MarqueeStrip';
import InstagramReels from './InstagramReels';
import { productApi, bannerApi, instagramReelsApi } from '../../services/api.service';
import type { GenderType } from '../../lib/genderPreference';

// ── Promo strip ────────────────────────────────────────────────
function PromoStrip() {
  const ITEMS = [
    { label: 'Free Shipping', desc: 'On orders above ₹999' },
    { label: 'Easy Exchanges', desc: 'Size exchange available' },
    { label: 'Secure Payments', desc: 'Razorpay · UPI · COD' },
  ];
  return (
    <Box sx={{
      bgcolor: '#fff',
      borderTop: '1px solid #f0f0f0',
      borderBottom: '1px solid #f0f0f0',
      py: { xs: 2.5, md: 3 },
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
      gap: 1,
      px: { xs: 3, md: 8 },
      textAlign: 'center',
    }}>
      {ITEMS.map((item) => (
        <Box key={item.label} sx={{ py: 0.5 }}>
          {/* The pair used to be 12px over 11.5px. Uppercase with this much
              letter-spacing reads smaller than its size, and the grey line
              under it was the smallest text anywhere on the storefront. */}
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '0.8125rem', md: '0.9375rem' }, letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', mb: 0.5, color: '#111' }}>
            {item.label}
          </Typography>
          <Typography sx={{ fontSize: { xs: '0.8125rem', md: '0.875rem' }, color: '#666' }}>
            {item.desc}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// ── Types ──────────────────────────────────────────────────────
interface ProductData {
  featured: any[];
  newArrivals: any[];
  trending: any[];
  bestSellers: any[];
}

interface Props {
  sections: any[];
  /** Gender the server rendered `initialData` for, from the preference cookie. */
  initialGender: GenderType;
  initialData: {
    heroBanners: any[];
    promoBanners: any[];
    featured: any[];
    newArrivals: any[];
    trending: any[];
    bestSellers: any[];
    categories: any[];
    testimonials: any[];
    stores: any[];
    reels: any[];
  };
}

// ── Main component ─────────────────────────────────────────────
export default function GenderHomePage({ sections, initialGender, initialData }: Props) {
  const gender = useAppSelector((s) => s.gender.selected);
  const genderReady = useAppSelector((s) => s.gender.initialized);

  // The Redux store is a module singleton, so it cannot be seeded per SSR
  // request — on the server it always starts at the WOMEN default. Stay on the
  // gender the server actually rendered until the stored preference has been
  // applied, otherwise a MEN shopper flashes the WOMEN default for a render and
  // triggers a needless refetch.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);
  const displayGender = hasMounted && genderReady ? gender : initialGender;

  // Strict gender filter for homepage sections:
  // UNISEX → always visible; null/Unset → never visible; WOMEN/MEN → only when that gender is active
  const genderFilteredCategories = useMemo(() => {
    return (initialData.categories as any[]).filter((cat) => {
      if (cat.gender === 'UNISEX') return true;
      if (!cat.gender) return false;
      return cat.gender === displayGender;
    });
  }, [initialData.categories, displayGender]);

  const [products, setProducts] = useState<ProductData>({
    featured: initialData.featured,
    newArrivals: initialData.newArrivals,
    trending: initialData.trending,
    bestSellers: initialData.bestSellers,
  });
  const [heroBanners, setHeroBanners] = useState<any[]>(initialData.heroBanners);
  const [promoBanners, setPromoBanners] = useState<any[]>(initialData.promoBanners);
  // Reels are gender-targeted like banners, so they move with the toggle
  // instead of staying on whatever the server first rendered.
  const [reels, setReels] = useState<any[]>(initialData.reels);
  const [fetching, setFetching] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  /**
   * Which gender the data currently in state belongs to.
   *
   * This used to be a one-shot "skip the first run after mount" boolean, which
   * could not tell apart the two things that happen on that first run: the SSR
   * data already matching the active gender (skipping is right) and the stored
   * preference restoring a *different* gender (skipping drops the refetch). The
   * second case is why refreshing as MEN left the toggle on MEN while the
   * products stayed as the server had sent them.
   */
  const loadedGender = useRef<GenderType>(initialGender);

  useEffect(() => {
    if (!hasMounted || !genderReady) return;
    // Already showing this gender — the normal reload, where the server
    // rendered exactly what the cookie asked for.
    if (loadedGender.current === displayGender) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const target = displayGender;
    setFetching(true);
    const opts = { limit: 10, gender: target };

    Promise.all([
      bannerApi.getByType('hero', target),
      bannerApi.getByType('promotional', target),
      productApi.getFeatured(opts),
      productApi.getNewArrivals(opts),
      productApi.getTrending(opts),
      productApi.getBestSellers(opts),
      instagramReelsApi.getActive(target),
    ]).then(([bRes, promoRes, f, n, t, b, reelRes]) => {
      if (controller.signal.aborted) return;
      loadedGender.current = target;
      setHeroBanners((bRes.data as any)?.data || []);
      setPromoBanners((promoRes.data as any)?.data || []);
      setReels((reelRes.data as any)?.data || []);
      setProducts({
        featured: (f.data as any)?.data || [],
        newArrivals: (n.data as any)?.data || [],
        trending: (t.data as any)?.data || [],
        bestSellers: (b.data as any)?.data || [],
      });
    }).catch(() => {
      // Keep existing content on error
    }).finally(() => {
      if (!controller.signal.aborted) setFetching(false);
    });

    return () => { controller.abort(); };
  }, [displayGender, hasMounted, genderReady]); // eslint-disable-line react-hooks/exhaustive-deps

  const genderLabel = displayGender === 'MEN' ? ' for Men' : ' for Women';

  // ── Dynamic section renderer (when admin configures sections) ─
  function renderSection(section: any) {
    const { type, title, subtitle } = section;
    switch (type) {
      case 'HERO_SLIDER':
        return <HeroSlider key={section.id} banners={heroBanners} />;
      case 'PROMO_STRIP':
        return <PromoStrip key={section.id} />;
      case 'SHOP_LATEST':
        return (
          <ShopLatestSection
            key={section.id}
            gender={displayGender}
            fetching={fetching}
            {...products}
          />
        );
      case 'COLLECTION_BANNERS':
      case 'COLLECTION_BANNER':
      case 'COLLECTION_SHOWCASE':
        return (
          <CollectionBanners
            key={section.id}
            categories={genderFilteredCategories}
            gender={displayGender}
            title={title}
          />
        );
      case 'FEATURED_PRODUCTS':
        return (
          <Box key={section.id} sx={{ opacity: fetching ? 0.5 : 1, transition: 'opacity 0.25s' }}>
            <ProductSection
              title={(title || 'Featured Products') + genderLabel}
              subtitle={subtitle || 'Curated for You'}
              products={products.featured}
              viewAllLink={`/shop?isFeatured=true&gender=${displayGender}`}
            />
          </Box>
        );
      case 'NEW_ARRIVALS':
        return (
          <Box key={section.id} sx={{ opacity: fetching ? 0.5 : 1, transition: 'opacity 0.25s' }}>
            <ProductSection
              title={(title || 'New Arrivals') + genderLabel}
              subtitle={subtitle || 'Fresh Drops'}
              products={products.newArrivals}
              viewAllLink={`/shop?isNewArrival=true&gender=${displayGender}`}
            />
          </Box>
        );
      case 'TRENDING_PRODUCTS':
        return (
          <Box key={section.id} sx={{ opacity: fetching ? 0.5 : 1, transition: 'opacity 0.25s' }}>
            <ProductSection
              title={(title || 'Trending Now') + genderLabel}
              subtitle={subtitle || "Everyone's Talking About"}
              products={products.trending}
              viewAllLink={`/shop?isTrending=true&gender=${displayGender}`}
            />
          </Box>
        );
      case 'BEST_SELLERS':
        return (
          <Box key={section.id} sx={{ opacity: fetching ? 0.5 : 1, transition: 'opacity 0.25s' }}>
            <ProductSection
              title={(title || 'Best Sellers') + genderLabel}
              subtitle={subtitle || 'Fan Favourites'}
              products={products.bestSellers}
              viewAllLink={`/shop?isBestSeller=true&gender=${displayGender}`}
              bgColor="#f8f4ef"
            />
          </Box>
        );
      case 'FEATURED_CATEGORIES':
      case 'CATEGORY_SHOWCASE':
        return <CategoryShowcase key={section.id} initialCategories={genderFilteredCategories} />;
      case 'PROMOTIONAL_BANNERS':
      case 'CUSTOM_BANNER':
        return <PromoBanners key={section.id} banners={promoBanners} title={title} />;
      case 'TESTIMONIALS':
        return <TestimonialsSection key={section.id} testimonials={initialData.testimonials} />;
      case 'STORE_LOCATOR':
        return <StoreLocations key={section.id} stores={initialData.stores} title={title} subtitle={section.subtitle} />;
      case 'MARQUEE':
        return <MarqueeStrip key={section.id} config={section.config || {}} />;
      case 'INSTAGRAM_REELS':
        return <InstagramReels key={section.id} reels={reels} sectionTitle={section.title} />;
      default:
        return null;
    }
  }

  // ── If admin has configured sections, render them ──────────────
  if (sections.length > 0) {
    return <>{sections.map(renderSection)}</>;
  }

  // ── Default layout (Off Duty–inspired, premium feel) ──────────
  return (
    <>
      {/* 1. Hero */}
      <HeroSlider banners={heroBanners} />

      {/* 2. Trust strip */}
      <PromoStrip />

      {/* 3. Shop the Latest — filter tabs + product grid */}
      <ShopLatestSection
        gender={displayGender}
        fetching={fetching}
        {...products}
      />

      {/* 4. Collection banners — horizontal scroll editorial cards */}
      <CollectionBanners
        categories={genderFilteredCategories}
        gender={displayGender}
      />

      {/* 5. New Arrivals carousel */}
      <Box sx={{ opacity: fetching ? 0.5 : 1, transition: 'opacity 0.25s' }}>
        <ProductSection
          title={`New Arrivals${genderLabel}`}
          subtitle="Fresh Drops"
          products={products.newArrivals}
          viewAllLink={`/shop?isNewArrival=true&gender=${displayGender}`}
        />
      </Box>

      {/* 6. Trending carousel */}
      <Box sx={{ opacity: fetching ? 0.5 : 1, transition: 'opacity 0.25s' }}>
        <ProductSection
          title={`Trending Now${genderLabel}`}
          subtitle="Everyone's Talking About"
          products={products.trending}
          viewAllLink={`/shop?isTrending=true&gender=${displayGender}`}
          bgColor="#fafafa"
        />
      </Box>

      {/* 7. Category grid */}
      <CategoryShowcase initialCategories={genderFilteredCategories} />

      {/* 8. Best Sellers carousel */}
      <Box sx={{ opacity: fetching ? 0.5 : 1, transition: 'opacity 0.25s' }}>
        <ProductSection
          title={`Best Sellers${genderLabel}`}
          subtitle="Fan Favourites"
          products={products.bestSellers}
          viewAllLink={`/shop?isBestSeller=true&gender=${displayGender}`}
          bgColor="#f5f0e8"
        />
      </Box>

      {/* 9. Instagram Reels */}
      {reels?.length > 0 && (
        <InstagramReels reels={reels} />
      )}

      {/* 10. Social proof */}
      <TestimonialsSection testimonials={initialData.testimonials} />
    </>
  );
}
