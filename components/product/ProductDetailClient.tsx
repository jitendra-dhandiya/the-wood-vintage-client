'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Box, Container, Grid, Typography, Button, IconButton,
  Chip, Rating, Tabs, Tab, Accordion, AccordionSummary,
  AccordionDetails, Breadcrumbs, Divider, Stack,
} from '@mui/material';
import {
  FavoriteBorder, Favorite, Share, ExpandMore,
  NavigateNext, LocalShipping, Replay, Security,
  ChevronLeft, ChevronRight,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { Product, ProductVariant } from '../../types';
import { formatPrice, getDiscountPercent } from '../../utils/format';
import { useCart } from '../../hooks/useCart';
import { wishlistApi, productApi } from '../../services/api.service';
import { useAppSelector } from '../../store';
import toast from 'react-hot-toast';
import ProductSection from '../home/ProductSection';
import OptionBox from './OptionBox';
import { galleryFor, groupGalleryByColor, firstIndexOfColor, sameColor } from '../../lib/productImages';
import { sortSizes } from '../../lib/sizeSort';
import { getRecentlyViewed, recordView } from '../../lib/recentlyViewed';

interface Props {
  product: Product;
}

export default function ProductDetailClient({ product }: Props) {
  const { addToCart, isLoading } = useCart();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [inWishlist, setInWishlist] = useState(false);
  const [tab, setTab] = useState(0);

  const displayPrice = product.salePrice || product.basePrice;
  const discount = product.salePrice ? getDiscountPercent(product.basePrice, product.salePrice) : 0;

  /**
   * Only sizes a customer can actually buy.
   *
   * These used to be listed and greyed out, which advertises stock that does
   * not exist and invites a click that cannot succeed. A size with no stock in
   * any colour is now simply absent. Note the check is across ALL variants of
   * that size — XL might be sold out in Black but in stock in White, and that
   * still counts as available.
   */
  const uniqueSizes = sortSizes([
    ...new Set(
      product.variants
        ?.filter((v) => v.size && (v.stockQuantity ?? 0) > 0)
        .map((v) => v.size) ?? []
    ),
  ]);

  const uniqueColors = [
    ...new Set(
      product.variants
        ?.filter((v) => v.color && (v.stockQuantity ?? 0) > 0)
        .map((v) => v.color) ?? []
    ),
  ];

  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const variant = product.variants?.find((v) => v.size === size && (selectedColor ? v.color === selectedColor : true));
    setSelectedVariant(variant || null);
  };

  /**
   * Curated related products where an admin has picked them, otherwise the
   * automatic same-category suggestions the API now returns. Nothing in this
   * catalogue is curated yet, which is why the section never appeared.
   */
  const relatedProducts: any[] = useMemo(() => {
    const curated = (product as any).relatedProducts ?? [];
    if (curated.length) return curated.map((rp: any) => rp.relatedProduct).filter(Boolean);
    return (product as any).suggestedProducts ?? [];
  }, [product]);

  const [featured, setFeatured] = useState<any[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  // Read on mount, before this visit is recorded, so the current product does
  // not immediately appear in its own "recently viewed" row.
  useEffect(() => {
    setRecentlyViewed(
      getRecentlyViewed(product.slug).map(v => ({
        id: v.id,
        slug: v.slug,
        name: v.name,
        basePrice: v.basePrice,
        salePrice: v.salePrice,
        images: v.image ? [{ url: v.image }] : [],
        variants: [],
      }))
    );

    recordView({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0]?.url ?? null,
      basePrice: Number(product.basePrice),
      salePrice: product.salePrice != null ? Number(product.salePrice) : null,
    });
  }, [product.id, product.slug, product.name, product.basePrice, product.salePrice, product.images]);

  // Fetched rather than server-rendered: it is below the fold and must not
  // delay the part of the page the shopper came for.
  useEffect(() => {
    let cancelled = false;
    productApi.getFeatured({ limit: 10 })
      .then(({ data }) => {
        if (cancelled) return;
        const list = ((data as any)?.data || []).filter((p: any) => p.id !== product.id);
        setFeatured(list);
      })
      .catch(() => { if (!cancelled) setFeatured([]); });
    return () => { cancelled = true; };
  }, [product.id]);

  /**
   * Every shot the product has, in catalogue order.
   *
   * This used to be filtered down to the chosen colour, which hid half the
   * photographs: a four-shot product read as a two-shot product, and the other
   * two only existed if you thought to click the other colour. The full set is
   * shown instead, and the colour is expressed by the labelled runs in the
   * thumbnail strip below.
   */
  const gallery = useMemo(() => galleryFor(product.images as any[]), [product.images]);

  /** The same shots split into the labelled colour runs the strip renders. */
  const imageGroups = useMemo(() => groupGalleryByColor(gallery), [gallery]);

  /**
   * Pick a colour, keeping the size row, the variant and the picture in step.
   *
   * A size chosen under the previous colour survives only if this colour
   * carries it as well. Otherwise the page would go on reading "Size: 32" with
   * no such variant behind it, and Add to Bag would post the product with no
   * variant at all.
   */
  const selectColor = (color: string, jumpToItsImage = true) => {
    setSelectedColor(color);

    const keepsSize = !!selectedSize && !!product.variants?.some(
      (v) => v.color === color && v.size === selectedSize && (v.stockQuantity ?? 0) > 0
    );
    const size = keepsSize ? selectedSize : '';
    setSelectedSize(size);
    // On a product that has sizes, a colour on its own does not identify a
    // variant. Picking one arbitrarily made the page claim "Only 2 left"
    // about a size the shopper had not chosen and could not see.
    const needsSize = uniqueSizes.length > 0;
    setSelectedVariant(
      needsSize && !size
        ? null
        : product.variants?.find((v) => v.color === color && (size ? v.size === size : true)) || null
    );

    if (jumpToItsImage) {
      // -1 means this colour was never photographed separately, and the shared
      // default shots are already on screen — moving would be wrong.
      const target = firstIndexOfColor(gallery, color);
      if (target >= 0) setSelectedImage(target);
    }
  };

  /**
   * Move the main image, wrapping at either end, and let the colour selector
   * follow the picture.
   *
   * Arrowing out of the Mid Blue shots into the Vintage Dark Blue ones while
   * the page still says "Color: Mid Blue" is the quiet kind of mismatch that
   * ends in the wrong item being ordered, so what is on screen leads and the
   * selection follows it.
   */
  const goTo = (index: number) => {
    if (!gallery.length) return;
    const next = ((index % gallery.length) + gallery.length) % gallery.length;
    setSelectedImage(next);

    const shotColor = gallery[next]?.color;
    if (!shotColor || sameColor(shotColor, selectedColor)) return;
    // Only follow a colour the customer can actually buy, and use the variant's
    // spelling of it rather than the image's.
    const buyable = uniqueColors.find((c) => sameColor(c, shotColor));
    if (buyable) selectColor(buyable, false);
  };

  /**
   * Remaining stock worth mentioning, or null.
   *
   * Only ever the true figure for the variant in hand, and only once it is low
   * enough to matter — a "5 left" on a line carrying 200 is noise, and anything
   * invented here would be a lie printed on the customer's screen.
   */
  const LOW_STOCK_AT = 5;
  const lowStockLeft: number | null = useMemo(() => {
    const stock = selectedVariant?.stockQuantity;
    if (typeof stock !== 'number' || stock <= 0 || stock > LOW_STOCK_AT) return null;
    return stock;
  }, [selectedVariant]);

  const handleAddToCart = async () => {
    if (uniqueSizes.length > 0 && !selectedSize) {
      toast.error('Please select a size');
      return;
    }
    await addToCart(product.id, selectedVariant?.id);
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Please login to add to wishlist'); return; }
    try {
      const { data } = await wishlistApi.toggle(product.id);
      setInWishlist(data.data.inWishlist);
      toast.success(data.data.inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
    } catch {}
  };

  /**
   * The phone's own share sheet where there is one, the clipboard everywhere
   * else.
   *
   * `navigator.share` exists only on mobile browsers and only in a secure
   * context, so a desktop shopper would be left with a button that does
   * nothing; copying the link is the closest thing that browser can offer.
   *
   * Dismissing the sheet rejects with AbortError. That is the shopper changing
   * their mind, not a failure, and must not raise a toast — every other
   * rejection falls through to the clipboard so the tap still does something.
   *
   * Nothing is awaited before `navigator.share`, deliberately: iOS Safari
   * requires the call to happen inside the tap's user activation, and an await
   * placed above this line would silently spend it.
   */
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (!url) return;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `${product.name} - ${formatPrice(displayPrice)}`,
          url,
        });
        return;
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <Box sx={{ pb: { xs: 10, md: 6 } }}>
      <Container maxWidth="xl" sx={{ pt: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3, fontSize: '0.8rem' }}>
          <Link href="/" style={{ color: '#888', textDecoration: 'none' }}>Home</Link>
          <Link href="/shop" style={{ color: '#888', textDecoration: 'none' }}>Shop</Link>
          {product.category && (
            <Link href={`/category/${product.category.slug}`} style={{ color: '#888', textDecoration: 'none' }}>
              {product.category.name}
            </Link>
          )}
          <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
            {product.name}
          </Typography>
        </Breadcrumbs>

        <Grid container spacing={{ xs: 2, md: 6 }}>
          {/* Images */}
          <Grid item xs={12} md={6}>
            <Box sx={{ position: 'sticky', top: 88 }}>
              {/* Main image */}
              <Box
                tabIndex={0}
                onKeyDown={(e) => {
                  // The arrows are on screen, so the keyboard has to reach them
                  // too once the frame itself is focused.
                  if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(selectedImage - 1); }
                  if (e.key === 'ArrowRight') { e.preventDefault(); goTo(selectedImage + 1); }
                }}
                sx={{
                  position: 'relative', paddingTop: '133%', borderRadius: 2,
                  overflow: 'hidden', bgcolor: '#f8f8f8', mb: 1.5,
                  outline: 'none',
                  '&:focus-visible': { boxShadow: '0 0 0 2px #c9a84c' },
                }}
              >
                {gallery[selectedImage]?.url && (
                  <motion.div
                    key={selectedImage}
                    initial={{ opacity: 0.5, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ position: 'absolute', inset: 0 }}
                  >
                    <Image
                      src={gallery[selectedImage].url}
                      alt={gallery[selectedImage].altText || product.name}
                      fill
                      style={{ objectFit: 'cover' }}
                      priority
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </motion.div>
                )}
                {discount > 0 && (
                  <Chip
                    label={`${discount}% OFF`}
                    size="small"
                    sx={{ position: 'absolute', top: 12, left: 12, bgcolor: '#d32f2f', color: 'white', fontWeight: 700 }}
                  />
                )}

                {/* Prev / next.
                    Stepping through a gallery by aiming at a 64px thumbnail is
                    real work on a phone; these hand that job to the whole left
                    and right edge of the picture. They wrap, so the set never
                    dead-ends. */}
                {gallery.length > 1 && [
                  { key: 'prev', step: -1, icon: <ChevronLeft />, edge: { left: 8 }, label: 'Previous image' },
                  { key: 'next', step: 1, icon: <ChevronRight />, edge: { right: 8 }, label: 'Next image' },
                ].map((arrow) => (
                  <IconButton
                    key={arrow.key}
                    className="ud-gallery-arrow"
                    aria-label={arrow.label}
                    onClick={() => goTo(selectedImage + arrow.step)}
                    sx={{
                      position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                      ...arrow.edge,
                      width: 40, height: 40,
                      bgcolor: 'rgba(255,255,255,0.92)',
                      color: '#1a1a1a',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                      // Always on screen rather than revealed by hover: a phone
                      // has no hover at all, and a control you have to go
                      // looking for may as well not be there.
                      transition: 'background-color 0.2s, box-shadow 0.2s',
                      '&:hover': { bgcolor: '#fff', boxShadow: '0 3px 14px rgba(0,0,0,0.22)' },
                      '&:focus-visible': { outline: '2px solid #c9a84c' },
                    }}
                  >
                    {arrow.icon}
                  </IconButton>
                ))}

                {/* Position in the set — tells the shopper at a glance that
                    there is more here than the one photograph. */}
                {gallery.length > 1 && (
                  <Box
                    sx={{
                      position: 'absolute', bottom: 12, right: 12,
                      px: 1.25, py: 0.4, borderRadius: 10,
                      bgcolor: 'rgba(26,26,26,0.65)', color: '#fff',
                      fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.04em',
                    }}
                  >
                    {selectedImage + 1}/{gallery.length}
                  </Box>
                )}
              </Box>

              {/* Thumbnails, grouped by colour.
                  Every shot the product has is here whatever colour is
                  selected — the runs and their labels are what say which is
                  which, rather than hiding the rest. */}
              {gallery.length > 1 && (
                <Box sx={{ display: 'flex', gap: { xs: 2, md: 2.5 }, flexWrap: 'wrap' }}>
                  {imageGroups.map((group) => {
                    // One run needs no label: a single-colour product keeps the
                    // plain strip it has always had.
                    const labelled = imageGroups.length > 1;
                    const isChosen = sameColor(group.color, selectedColor);
                    // Untagged shots belong to every colour, so they are never
                    // the "other" colour and never dimmed.
                    const muted = labelled && !!selectedColor && !!group.color && !isChosen;
                    return (
                      // maxWidth caps the run at the column it sits in. Without it a
                      // colour with ten shots is an unbreakable 712px row, which on a
                      // phone widens the layout viewport to nearly twice the screen
                      // and clips the whole page — not just the gallery.
                      <Box key={group.color ?? '__default'} sx={{ maxWidth: '100%' }}>
                        {labelled && (
                          <Typography
                            sx={{
                              display: 'block', mb: 0.75, pl: 0.75,
                              fontSize: '0.62rem', fontWeight: 700,
                              letterSpacing: '0.1em', textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                              color: isChosen ? '#1a1a1a' : '#9a9a9a',
                              borderLeft: '2px solid',
                              borderColor: isChosen ? '#c9a84c' : 'transparent',
                              transition: 'color 0.2s, border-color 0.2s',
                            }}
                          >
                            {group.color ?? 'All colours'}
                          </Typography>
                        )}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {group.images.map((img: any, i: number) => {
                            const index = group.indices[i];
                            return (
                              <Box
                                key={img.id ?? img.url}
                                onClick={() => goTo(index)}
                                sx={{
                                  position: 'relative', width: 64, height: 85, borderRadius: 1,
                                  overflow: 'hidden', cursor: 'pointer', bgcolor: '#f8f8f8',
                                  border: '2px solid',
                                  borderColor: index === selectedImage ? '#1a1a1a' : 'transparent',
                                  opacity: muted ? 0.5 : 1,
                                  transition: 'border-color 0.2s, opacity 0.2s',
                                  '&:hover': { borderColor: '#888', opacity: 1 },
                                }}
                              >
                                {/* 64x85 thumbnail strip — explicit sizes keeps each of
                                    these at a few KB instead of a full-width image. */}
                                <Image src={img.url} alt="" fill style={{ objectFit: 'cover' }} sizes="64px" />
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          </Grid>

          {/* Product info */}
          <Grid item xs={12} md={6}>
            <Box>
              {product.brand && (
                <Typography variant="overline" sx={{ color: '#c9a84c', letterSpacing: '0.12em', fontWeight: 600 }}>
                  {product.brand}
                </Typography>
              )}

              <Typography variant="h4" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mt: 0.5, mb: 1, lineHeight: 1.2 }}>
                {product.name}
              </Typography>

              {/* Rating */}
              {product.totalReviews > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <Rating value={Number(product.avgRating)} precision={0.5} size="small" readOnly />
                  <Typography variant="body2" color="text.secondary">
                    ({product.totalReviews} reviews)
                  </Typography>
                </Box>
              )}

              {/* Price */}
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#1a1a1a' }}>
                  {formatPrice(displayPrice)}
                </Typography>
                {product.salePrice && (
                  <>
                    <Typography variant="h6" sx={{ textDecoration: 'line-through', color: 'text.secondary', fontWeight: 400 }}>
                      {formatPrice(product.basePrice)}
                    </Typography>
                    <Chip label={`Save ${discount}%`} size="small" sx={{ bgcolor: '#d32f2f', color: 'white', fontWeight: 700 }} />
                  </>
                )}
              </Box>

              {/* Short desc */}
              {product.shortDesc && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8 }}>
                  {product.shortDesc}
                </Typography>
              )}

              {/* Colors */}
              {uniqueColors.length > 0 && (
                <Box sx={{ mb: 2.5 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    Color: <span style={{ fontWeight: 400, color: '#666' }}>{selectedColor || 'Select'}</span>
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {uniqueColors.map((color) => {
                      // A colour with nothing left in any size is a dead end —
                      // the size row already reads that way, so the colour row
                      // now matches rather than letting the customer pick a
                      // colour and find every size greyed out.
                      const soldOut = !product.variants?.some(
                        (v) => v.color === color && (v.stockQuantity ?? 0) > 0
                      );
                      return (
                        <OptionBox
                          key={color}
                          label={color as string}
                          wide
                          selected={selectedColor === color}
                          disabled={soldOut}
                          onClick={() => color && selectColor(color)}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Sizes */}
              {uniqueSizes.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      Size: <span style={{ fontWeight: 400, color: '#666' }}>{selectedSize || 'Select'}</span>
                    </Typography>
                    <Button size="small" sx={{ p: 0, color: '#888', fontSize: '0.75rem' }}>
                      Size Guide
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {uniqueSizes.map((size) => {
                      // Every size reaching here has stock in at least one
                      // colour; this narrows to the currently selected colour so
                      // a size unavailable in THAT colour still reads as such.
                      const variant = product.variants?.find(
                        (v) => v.size === size && (selectedColor ? v.color === selectedColor : true)
                      );
                      const outOfStock = (variant?.stockQuantity ?? 0) === 0;
                      return (
                        <OptionBox
                          key={size}
                          label={size as string}
                          selected={selectedSize === size}
                          disabled={outOfStock}
                          onClick={() => size && handleSizeSelect(size)}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              {/* Genuine scarcity only.
                  This is the real remaining stock of the variant the shopper
                  has actually selected — no invented "3 people are viewing
                  this" counters, which would be a lie told to their customers.
                  It says nothing at all until a selection makes it true. */}
              {lowStockLeft !== null && (
                <Typography
                  sx={{
                    mb: 2, fontSize: '0.8rem', fontWeight: 700,
                    color: '#c0392b', letterSpacing: '0.02em',
                  }}
                >
                  Only {lowStockLeft} left{selectedSize ? ` in size ${selectedSize}` : ''}
                </Typography>
              )}

              {/* Actions */}
              <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleAddToCart}
                  disabled={isLoading}
                  sx={{
                    bgcolor: '#1a1a1a', py: 1.75, fontSize: '0.8rem',
                    letterSpacing: '0.12em', fontWeight: 700,
                    '&:hover': { bgcolor: '#333' },
                  }}
                >
                  {isLoading ? 'Adding...' : 'Add to Bag'}
                </Button>
                <IconButton
                  onClick={handleWishlist}
                  sx={{
                    border: '1.5px solid', borderColor: '#e0e0e0',
                    borderRadius: 1, px: 2,
                    '&:hover': { borderColor: '#1a1a1a' },
                  }}
                >
                  {inWishlist ? <Favorite sx={{ color: '#d32f2f' }} /> : <FavoriteBorder />}
                </IconButton>
                <IconButton
                  onClick={handleShare}
                  aria-label="Share this product"
                  sx={{ border: '1.5px solid', borderColor: '#e0e0e0', borderRadius: 1, px: 1.5 }}
                >
                  <Share fontSize="small" />
                </IconButton>
              </Stack>

              {/* Trust badges */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                {[
                  { icon: <LocalShipping fontSize="small" />, text: 'Free shipping above ₹999' },
                  { icon: <Replay fontSize="small" />, text: 'Easy size exchange' },
                  { icon: <Security fontSize="small" />, text: 'Secure payments' },
                ].map((item) => (
                  <Box key={item.text} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: '#666' }}>
                    {item.icon}
                    <Typography variant="caption" fontWeight={500}>{item.text}</Typography>
                  </Box>
                ))}
              </Box>

              {/* Tabs */}
              <Box>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 2 }}>
                  <Tab label="Description" sx={{ fontSize: '0.8rem', fontWeight: 600 }} />
                  {product.fabric && <Tab label="Fabric & Care" sx={{ fontSize: '0.8rem', fontWeight: 600 }} />}
                  {product.faqs?.length ? <Tab label="FAQs" sx={{ fontSize: '0.8rem', fontWeight: 600 }} /> : null}
                </Tabs>

                {tab === 0 && (
                  <Typography variant="body2" sx={{ lineHeight: 1.9, color: 'text.secondary' }}>
                    {product.description || product.shortDesc || 'No description available.'}
                  </Typography>
                )}

                {tab === 1 && product.fabric && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1.5, lineHeight: 1.9, color: 'text.secondary' }}>
                      <strong>Fabric:</strong> {product.fabric}
                    </Typography>
                    {product.careInstructions && (
                      <Typography variant="body2" sx={{ lineHeight: 1.9, color: 'text.secondary' }}>
                        <strong>Care:</strong> {product.careInstructions}
                      </Typography>
                    )}
                  </Box>
                )}

                {tab === 2 && product.faqs?.map((faq, i) => (
                  <Accordion key={i} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 1, '&:before': { display: 'none' }, borderRadius: '4px !important' }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography variant="body2" fontWeight={600}>{faq.question}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary">{faq.answer}</Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* ── Keep browsing ────────────────────────────────────────
            The bottom of a product page is where a shopper either carries on
            or leaves. It used to end here whenever nobody had hand-picked
            related products — which was every product — so each of these rows
            renders only when it genuinely has something to show. */}

        {relatedProducts.length > 0 && (
          <Box sx={{ mt: 10 }}>
            <ProductSection
              title="You May Also Like"
              subtitle={product.category?.name ? `More from ${product.category.name.trim()}` : 'Recommended'}
              products={relatedProducts}
              viewAllLink={product.category?.slug ? `/category/${product.category.slug}` : undefined}
            />
          </Box>
        )}

        {featured.length > 0 && (
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <ProductSection
              title="Featured Picks"
              subtitle="Handpicked by our stylists"
              products={featured}
              viewAllLink="/shop?isFeatured=true"
            />
          </Box>
        )}

        {/* The visitor's own history — most useful when comparing two items,
            which is the usual reason for leaving a product page and returning. */}
        {recentlyViewed.length > 0 && (
          <Box sx={{ mt: { xs: 6, md: 8 } }}>
            <ProductSection
              title="Recently Viewed"
              subtitle="Pick up where you left off"
              products={recentlyViewed as any}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
}
