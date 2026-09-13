'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box, Container, Typography, Grid, Card, CardMedia, CardContent,
  Skeleton, Chip, Button,
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { collectionApi, bannerApi } from '../../../../services/api.service';

interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isFeatured: boolean;
  _count?: { products: number };
}

function CollectionCardSkeleton() {
  return (
    <Card elevation={0} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
      <Skeleton variant="rectangular" height={260} />
      <CardContent sx={{ p: 2.5 }}>
        <Skeleton width="60%" height={28} />
        <Skeleton width="90%" height={20} sx={{ mt: 1 }} />
        <Skeleton width="40%" height={36} sx={{ mt: 1.5 }} />
      </CardContent>
    </Card>
  );
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  /**
   * Artwork behind the page title, uploaded in Admin → Banners as a banner of
   * type COLLECTION. Nothing uploaded means the dark block below stays exactly
   * as it is, so this can never leave the page looking unfinished.
   */
  const [heroBanner, setHeroBanner] = useState<any | null>(null);
  /** Whether the banner request has come back yet, either way. */
  const [bannerChecked, setBannerChecked] = useState(false);

  useEffect(() => {
    collectionApi.getAll({ limit: 50, sortBy: 'sortOrder' })
      .then(({ data }) => setCollections((data as any).data || []))
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));

    bannerApi.getByType('collection')
      .then(({ data }) => setHeroBanner((data as any)?.data?.[0] || null))
      .catch(() => setHeroBanner(null))
      .finally(() => setBannerChecked(true));
  }, []);

  const featured = collections.filter(c => c.isFeatured);
  const rest = collections.filter(c => !c.isFeatured);

  /**
   * An uploaded banner is finished artwork. It arrives with its wording already
   * set into it — this one reads "Elevate Your Style" — so the page adds none
   * of its own on top. Two unrelated pieces of type in one space made both hard
   * to read, whichever of them was winning.
   *
   * That includes the banner's own title and subtitle. They are still worth
   * having: the title names the banner in the admin list and becomes the
   * image's alt text, which is the only description of the artwork a screen
   * reader can be given, since its wording lives in the pixels. But nothing is
   * drawn over the picture.
   *
   * Wording for a banner therefore belongs in the banner, set by whoever made
   * it, next to the type it has to sit alongside.
   *
   * The page keeps its own headings for one case only: no banner has ever been
   * uploaded, where the alternative is a bare black band.
   */
  const bannerImage    = heroBanner?.image || '';
  const bannerTitle    = (heroBanner?.title || '').trim();
  const bannerSubtitle = (heroBanner?.subtitle || '').trim();

  // Nothing is written until the request has come back either way, or the
  // fallback wording would paint on every first render and be replaced a
  // moment later.
  const showFallbackText = bannerChecked && !bannerImage;
  const heroTitle    = showFallbackText ? (bannerTitle || 'Our Collections') : '';
  const heroSubtitle = showFallbackText
    ? (bannerSubtitle
       || 'Explore our carefully curated collections — each one a story told through fabric, colour, and style.')
    : '';
  const hasHeroText  = !!(heroTitle || heroSubtitle);

  return (
    <Box sx={{ pb: { xs: 8, md: 6 } }}>
      {/* Hero */}
      <Box
        sx={{
          bgcolor: '#1a1a1a',
          color: 'white',
          // Only the wordless block needs padding. With artwork the band is
          // exactly as tall as the artwork, so padding would add a black
          // margin above and below it.
          py: bannerImage ? 0 : { xs: 6, md: 9 },
          // Holds the band open while the banner request is still out, so the
          // page does not jump when it lands.
          ...(bannerImage || hasHeroText ? {} : { height: { xs: 200, sm: 300, md: 380 } }),
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {bannerImage ? (
          <Box
            component="img"
            src={bannerImage}
            // The artwork IS the banner now, so this is content rather than
            // decoration. Its wording is in the pixels and cannot be read back
            // out here, which leaves the title the admin gave it as the only
            // description available — and an empty alt, correctly, when they
            // gave it none.
            alt={bannerTitle}
            sx={{
              // In normal flow, not absolute: the band then takes the artwork's
              // own height and nothing is cropped. This one is 3840x1493 — a
              // 2.57:1 design — and a fixed-height band was slicing a strip out
              // of the middle of it, cutting the heads off the models.
              display: 'block',
              width: '100%',
              height: 'auto',
              // A portrait upload would otherwise fill the screen; past this it
              // crops rather than distorts.
              maxHeight: { xs: 420, md: 560 },
              objectFit: 'cover',
            }}
          />
        ) : (
          <Box
            sx={{
              position: 'absolute', inset: 0, opacity: 0.06,
              backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)',
              backgroundSize: '12px 12px',
            }}
          />
        )}
        {hasHeroText && (
          <Container maxWidth="md" sx={{ position: 'relative' }}>
            {heroTitle && (
              <Typography
                variant="h3"
                sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: heroSubtitle ? 2 : 0 }}
              >
                {heroTitle}
              </Typography>
            )}
            {heroSubtitle && (
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 480, mx: 'auto' }}>
                {heroSubtitle}
              </Typography>
            )}
          </Container>
        )}
      </Box>

      <Container maxWidth="xl" sx={{ pt: { xs: 5, md: 7 } }}>

        {/* Featured collections — large cards */}
        {(loading || featured.length > 0) && (
          <Box sx={{ mb: { xs: 5, md: 7 } }}>
            <Typography
              variant="h5"
              sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 3 }}
            >
              Featured Collections
            </Typography>

            <Grid container spacing={3}>
              {loading
                ? [0, 1].map(i => (
                  <Grid item xs={12} sm={6} key={i}>
                    <CollectionCardSkeleton />
                  </Grid>
                ))
                : featured.map((col, i) => (
                  <Grid item xs={12} sm={6} key={col.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link href={`/collections/${col.slug}`} style={{ textDecoration: 'none' }}>
                        <Card
                          elevation={0}
                          sx={{
                            borderRadius: 2, overflow: 'hidden',
                            border: '1px solid', borderColor: 'divider',
                            cursor: 'pointer',
                            '&:hover .col-img': { transform: 'scale(1.05)' },
                            '&:hover .col-arrow': { transform: 'translateX(4px)' },
                          }}
                        >
                          {/* Collection artwork is portrait (sources run
                              0.64-1.04). A fixed 320px height on a card that is
                              ~760px wide at desktop made the frame 2.4:1, so
                              cover had to throw away most of the picture to fill
                              it — "Office wear" survived at 27% of its height,
                              which is why the model had no head. Sizing by ratio
                              instead keeps the frame in proportion to the card
                              at every width. */}
                          <Box sx={{
                            aspectRatio: { xs: '1 / 1', md: '4 / 3' },
                            maxHeight: 560,
                            overflow: 'hidden',
                            position: 'relative',
                          }}>
                            {col.image ? (
                              <CardMedia
                                className="col-img"
                                component="img"
                                image={col.image}
                                alt={col.name}
                                sx={{
                                  width: '100%', height: '100%',
                                  objectFit: 'cover',
                                  // Bias upward: the face sits near the top of a
                                  // full-length shot, so a centred crop removes
                                  // exactly the part worth keeping.
                                  objectPosition: 'center 25%',
                                  transition: 'transform 0.5s ease',
                                }}
                              />
                            ) : (
                              <Box
                                className="col-img"
                                sx={{
                                  height: '100%',
                                  background: 'linear-gradient(135deg, #f5f0eb 0%, #e8ddd4 100%)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'transform 0.5s ease',
                                }}
                              >
                                <Typography
                                  sx={{ fontFamily: 'var(--font-playfair)', fontSize: '3rem', color: '#c9a84c', opacity: 0.4 }}
                                >
                                  {col.name.charAt(0)}
                                </Typography>
                              </Box>
                            )}
                            <Chip
                              label="Featured"
                              size="small"
                              sx={{
                                position: 'absolute', top: 12, left: 12,
                                bgcolor: '#c9a84c', color: 'white', fontWeight: 600,
                                fontSize: '0.65rem', letterSpacing: '0.06em',
                              }}
                            />
                            {col._count?.products != null && (
                              <Chip
                                label={`${col._count.products} items`}
                                size="small"
                                sx={{
                                  position: 'absolute', top: 12, right: 12,
                                  bgcolor: 'rgba(0,0,0,0.55)', color: 'white',
                                  backdropFilter: 'blur(4px)', fontSize: '0.7rem',
                                }}
                              />
                            )}
                          </Box>
                          <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5 }}>
                              {/* minWidth:0 is what makes the clamp below work.
                                  A flex item defaults to min-width:auto, so it
                                  refuses to shrink below its content's width —
                                  the text box then grew wider than the card,
                                  its own overflow never triggered, and the
                                  Card's overflow:hidden did the cutting
                                  instead. That is why the description was
                                  sliced mid-word with no ellipsis. */}
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a1a' }}>
                                  {col.name}
                                </Typography>
                                {col.description && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      mt: 0.5,
                                      // A clamp is a maximum, not a fixed height, so
                                      // desktop still uses only the two lines these
                                      // 128-148 character descriptions need, while a
                                      // narrow card gets a third line before it cuts.
                                      display: '-webkit-box',
                                      WebkitLineClamp: 3,
                                      WebkitBoxOrient: 'vertical',
                                      overflow: 'hidden',
                                    }}
                                  >
                                    {col.description}
                                  </Typography>
                                )}
                              </Box>
                              <ArrowForward
                                className="col-arrow"
                                sx={{ color: '#1a1a1a', transition: 'transform 0.2s', flexShrink: 0, mt: 0.5 }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}

        {/* All other collections — smaller grid */}
        {(loading || rest.length > 0) && (
          <Box>
            {featured.length > 0 && (
              <Typography
                variant="h5"
                sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 3 }}
              >
                All Collections
              </Typography>
            )}

            <Grid container spacing={2.5}>
              {loading
                ? [0, 1, 2, 3, 4, 5].map(i => (
                  <Grid item xs={6} sm={4} md={3} key={i}>
                    <CollectionCardSkeleton />
                  </Grid>
                ))
                : (featured.length === 0 ? collections : rest).map((col, i) => (
                  <Grid item xs={6} sm={4} md={3} key={col.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <Link href={`/collections/${col.slug}`} style={{ textDecoration: 'none' }}>
                        <Card
                          elevation={0}
                          sx={{
                            borderRadius: 2, overflow: 'hidden',
                            border: '1px solid', borderColor: 'divider',
                            cursor: 'pointer',
                            transition: 'box-shadow 0.2s, transform 0.2s',
                            '&:hover': { boxShadow: 4, transform: 'translateY(-3px)' },
                            '&:hover .col-img': { transform: 'scale(1.06)' },
                          }}
                        >
                          <Box sx={{
                            // Square keeps far more of a portrait source than the
                            // old 200px-tall, ~360px-wide frame did (1.8:1, 42%).
                            aspectRatio: '1 / 1',
                            overflow: 'hidden',
                            position: 'relative',
                          }}>
                            {col.image ? (
                              <CardMedia
                                className="col-img"
                                component="img"
                                image={col.image}
                                alt={col.name}
                                sx={{
                                  width: '100%', height: '100%',
                                  objectFit: 'cover',
                                  // Bias upward: the face sits near the top of a
                                  // full-length shot, so a centred crop removes
                                  // exactly the part worth keeping.
                                  objectPosition: 'center 25%',
                                  transition: 'transform 0.45s ease',
                                }}
                              />
                            ) : (
                              <Box
                                className="col-img"
                                sx={{
                                  height: '100%',
                                  background: 'linear-gradient(135deg, #f5f0eb 0%, #e8ddd4 100%)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'transform 0.45s ease',
                                }}
                              >
                                <Typography
                                  sx={{ fontFamily: 'var(--font-playfair)', fontSize: '2.5rem', color: '#c9a84c', opacity: 0.4 }}
                                >
                                  {col.name.charAt(0)}
                                </Typography>
                              </Box>
                            )}
                            {col._count?.products != null && (
                              <Chip
                                label={`${col._count.products} items`}
                                size="small"
                                sx={{
                                  position: 'absolute', bottom: 8, right: 8,
                                  bgcolor: 'rgba(0,0,0,0.55)', color: 'white',
                                  backdropFilter: 'blur(4px)', fontSize: '0.65rem',
                                }}
                              />
                            )}
                          </Box>
                          <CardContent sx={{ p: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#1a1a1a' }} noWrap>
                              {col.name}
                            </Typography>
                            {col.description && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {col.description}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  </Grid>
                ))}
            </Grid>
          </Box>
        )}

        {/* Empty state */}
        {!loading && collections.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>No collections yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Check back soon — new collections are on their way.
            </Typography>
            <Button component={Link} href="/shop" variant="outlined" sx={{ borderColor: '#1a1a1a', color: '#1a1a1a' }}>
              Browse All Products
            </Button>
          </Box>
        )}

      </Container>
    </Box>
  );
}
