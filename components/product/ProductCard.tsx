'use client';
import { useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Box, Typography, IconButton, Rating, Skeleton, Button,
} from '@mui/material';
import { FavoriteBorder, Favorite, ShoppingBag } from '@mui/icons-material';
import type { Product } from '../../types';
import { formatPrice, getDiscountPercent } from '../../utils/format';
import { useCart } from '../../hooks/useCart';
import { wishlistApi } from '../../services/api.service';
import { useAppSelector } from '../../store';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact';
  /**
   * Seeds the heart when the caller already knows the answer — the wishlist
   * page, where every tile is by definition saved. Without it the hearts there
   * render empty, which reads as "not saved" on the one screen where
   * everything is.
   */
  initialInWishlist?: boolean;
  /** Told when the heart is toggled, so a wishlist page can drop the tile. */
  onWishlistChange?: (inWishlist: boolean) => void;
}

export default function ProductCard({
  product,
  variant = 'default',
  initialInWishlist = false,
  onWishlistChange,
}: ProductCardProps) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [inWishlist, setInWishlist] = useState(initialInWishlist);
  const [hovered, setHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  // On touch devices mouseenter fires during scroll — guard against it.
  // useRef so this never causes a re-render.
  const isTouch = useRef(
    typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches
  );

  const displayPrice = product.salePrice || product.basePrice;
  const discount = product.salePrice ? getDiscountPercent(product.basePrice, product.salePrice) : 0;
  const primaryImage = product.images?.[0]?.url;
  const secondaryImage = product.images?.[1]?.url;

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { toast.error('Please login to add to wishlist'); return; }
    try {
      const { data } = await wishlistApi.toggle(product.id);
      setInWishlist(data.data.inWishlist);
      onWishlistChange?.(data.data.inWishlist);
      toast.success(data.data.inWishlist ? 'Added to wishlist' : 'Removed from wishlist');
    } catch {}
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(true);
    await addToCart(product.id);
    setAddingToCart(false);
  };

  return (
    <Box
      component={Link}
      href={`/product/${product.slug}`}
      sx={{ textDecoration: 'none', display: 'block', cursor: 'pointer' }}
    >
      {/* ── Image block ── */}
      <Box
        sx={{ position: 'relative', paddingTop: '133%', bgcolor: '#f4f4f4', overflow: 'hidden', mb: 1.5 }}
        onMouseEnter={() => { if (!isTouch.current) setHovered(true); }}
        onMouseLeave={() => { if (!isTouch.current) setHovered(false); }}
      >
        {/* Primary image */}
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            style={{
              objectFit: 'cover',
              opacity: hovered && secondaryImage ? 0 : 1,
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'opacity 0.45s ease, transform 0.7s ease',
            }}
            sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 25vw"
          />
        ) : (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
            <ShoppingBag sx={{ fontSize: 48 }} />
          </Box>
        )}

        {/* Secondary (hover) image */}
        {secondaryImage && (
          <Image
            src={secondaryImage}
            alt={product.name}
            fill
            style={{
              objectFit: 'cover',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'scale(1.04)' : 'scale(1)',
              transition: 'opacity 0.45s ease, transform 0.7s ease',
            }}
            sizes="(max-width: 600px) 50vw, (max-width: 900px) 33vw, 25vw"
          />
        )}

        {/* Sale badge — round circle */}
        {discount > 0 && (
          <Box sx={{
            position: 'absolute', top: 10, left: 10,
            width: 42, height: 42, borderRadius: '50%',
            bgcolor: '#d93025', display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexDirection: 'column',
            boxShadow: '0 2px 8px rgba(217,48,37,0.4)',
          }}>
            <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: 'white', lineHeight: 1 }}>Sale</Typography>
          </Box>
        )}

        {/* NEW badge */}
        {!discount && product.isNewArrival && (
          <Box sx={{
            position: 'absolute', top: 10, left: 10,
            bgcolor: '#111', px: 1, py: 0.3,
          }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>NEW</Typography>
          </Box>
        )}

        {/* TRENDING badge */}
        {!discount && !product.isNewArrival && product.isTrending && (
          <Box sx={{
            position: 'absolute', top: 10, left: 10,
            bgcolor: '#c9a84c', px: 1, py: 0.3,
          }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: 'white', letterSpacing: '0.05em' }}>HOT</Typography>
          </Box>
        )}

        {/* Wishlist — always visible top-right */}
        <IconButton
          onClick={handleWishlist}
          size="small"
          sx={{
            position: 'absolute', top: 8, right: 8,
            bgcolor: 'rgba(255,255,255,0.92)',
            width: 32, height: 32,
            '&:hover': { bgcolor: 'white', transform: 'scale(1.12)' },
            transition: 'all 0.2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
        >
          {inWishlist ? (
            <Favorite sx={{ fontSize: 15, color: '#d93025' }} />
          ) : (
            <FavoriteBorder sx={{ fontSize: 15, color: '#333' }} />
          )}
        </IconButton>

        {/* Quick Add — slides up from bottom on hover (desktop only) */}
        <Box sx={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          transform: hovered ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.25,0.46,0.45,0.94)',
          '@media (hover: none)': { display: 'none' },
        }}>
          <Button
            fullWidth
            onClick={handleQuickAdd}
            disabled={addingToCart}
            sx={{
              bgcolor: 'rgba(17,17,17,0.92)',
              backdropFilter: 'blur(4px)',
              color: 'white',
              borderRadius: 0,
              py: 1.1,
              fontSize: '0.7rem',
              letterSpacing: '0.1em',
              fontWeight: 700,
              '&:hover': { bgcolor: '#000' },
              '&.Mui-disabled': { bgcolor: 'rgba(50,50,50,0.85)', color: 'rgba(255,255,255,0.6)' },
            }}
          >
            {addingToCart ? 'Adding…' : '+ Quick Add'}
          </Button>
        </Box>
      </Box>

      {/* ── Info block ── */}
      <Box sx={{ px: 0.25 }}>
        {product.brand && (
          <Typography variant="caption" sx={{
            color: '#888', display: 'block', fontSize: '0.6rem',
            letterSpacing: '0.08em', textTransform: 'uppercase', mb: 0.25,
          }}>
            {product.brand}
          </Typography>
        )}

        <Typography
          variant="body2"
          sx={{
            fontWeight: 500, lineHeight: 1.35, mb: 0.5,
            fontSize: variant === 'compact' ? '0.78rem' : '0.855rem',
            color: '#111',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {product.name}
        </Typography>

        {/* Colours, named. Two dots of the same derived hex told the customer
            nothing; two names tell them what the product actually comes in. */}
        {(() => {
          const colors = [...new Set(product.variants?.map((v) => v.color).filter(Boolean) || [])];
          if (!colors.length) return null;
          // Two names is what fits a tile without pushing the price out of
          // view; the rest are summarised.
          const shown = colors.slice(0, 2);
          const extra = colors.length - shown.length;
          return (
            <Box sx={{ display: 'flex', gap: 0.5, mb: 0.6, flexWrap: 'wrap', alignItems: 'center' }}>
              {shown.map((color) => (
                <Box
                  key={color}
                  sx={{
                    px: 0.75, height: 19, display: 'inline-flex', alignItems: 'center',
                    border: '1px solid #e2e2e2', borderRadius: 0.5,
                    fontSize: '0.62rem', fontWeight: 600, letterSpacing: '0.03em',
                    color: '#555', textTransform: 'capitalize', whiteSpace: 'nowrap',
                    maxWidth: 92, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}
                >
                  {color}
                </Box>
              ))}
              {extra > 0 && (
                <Box sx={{ fontSize: '0.62rem', fontWeight: 600, color: '#999', letterSpacing: '0.03em' }}>
                  +{extra}
                </Box>
              )}
            </Box>
          );
        })()}

        {/* Rating */}
        {product.totalReviews > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Rating value={Number(product.avgRating)} precision={0.5} size="small" readOnly sx={{ fontSize: '0.72rem' }} />
            <Typography variant="caption" sx={{ color: '#888', fontSize: '0.68rem' }}>({product.totalReviews})</Typography>
          </Box>
        )}

        {/* Price */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#111' }}>
            {formatPrice(displayPrice)}
          </Typography>
          {product.salePrice && product.salePrice < product.basePrice && (
            <>
              <Typography sx={{ textDecoration: 'line-through', color: '#aaa', fontSize: '0.8rem' }}>
                {formatPrice(product.basePrice)}
              </Typography>
              <Typography sx={{ color: '#d93025', fontWeight: 700, fontSize: '0.72rem' }}>
                {discount}% OFF
              </Typography>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export function ProductCardSkeleton() {
  return (
    <Box>
      <Skeleton variant="rectangular" sx={{ paddingTop: '133%', borderRadius: 0, mb: 1.5 }} />
      <Skeleton variant="text" width="40%" height={12} sx={{ mb: 0.5 }} />
      <Skeleton variant="text" width="85%" height={14} />
      <Skeleton variant="text" width="85%" height={14} sx={{ mb: 0.75 }} />
      <Skeleton variant="text" width="35%" height={14} />
    </Box>
  );
}
