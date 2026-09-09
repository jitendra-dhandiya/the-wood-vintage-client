import { Box, Container, Grid, Skeleton } from '@mui/material';

/**
 * Loading placeholders that match the real layout's geometry.
 *
 * The point is not decoration. A skeleton whose height differs from the
 * content that replaces it makes the page jump at the exact moment the reader
 * starts looking at it, which is the "zigzag" — every section settling to its
 * final height one after another. So the numbers here are copied from the
 * components they stand in for, and where a component sizes itself by ratio
 * these use the same ratio rather than a guessed pixel height.
 *
 * Kept in one file so a layout change has one obvious place to follow.
 */

/** ProductCard's frame is paddingTop 133% — a 3:4 portrait. */
export function ProductCardSkeleton() {
  return (
    <Box>
      <Box sx={{ position: 'relative', paddingTop: '133%', bgcolor: '#f4f4f4', mb: 1.5 }}>
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      </Box>
      {/* Two lines of title, then price — the card's own rhythm. */}
      <Skeleton variant="text" width="85%" height={18} animation="wave" />
      <Skeleton variant="text" width="55%" height={18} animation="wave" />
      <Skeleton variant="text" width="35%" height={20} animation="wave" sx={{ mt: 0.5 }} />
    </Box>
  );
}

export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <Grid container spacing={2.5}>
      {Array.from({ length: count }).map((_, i) => (
        <Grid item xs={6} sm={4} md={3} key={i}>
          <ProductCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
}

/** The dark banner strip at the top of a category or collection page. */
export function HeroBlockSkeleton() {
  return (
    <Skeleton
      variant="rectangular"
      animation="wave"
      sx={{ height: { xs: 220, md: 320 }, borderRadius: 3, mb: 4 }}
    />
  );
}

/** Breadcrumb + hero + the count/sort row above a grid. */
export function ListingHeaderSkeleton() {
  return (
    <>
      <Skeleton variant="text" width={180} height={20} animation="wave" sx={{ mb: 3 }} />
      <HeroBlockSkeleton />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={90} height={20} animation="wave" />
        <Skeleton variant="rectangular" width={180} height={40} animation="wave" sx={{ borderRadius: 1 }} />
      </Box>
    </>
  );
}

/** A full listing page: header, then a grid. */
export function ListingPageSkeleton({ count = 12 }: { count?: number }) {
  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
      <ListingHeaderSkeleton />
      <ProductGridSkeleton count={count} />
    </Box>
  );
}

/** Product detail: gallery on the left, buy column on the right. */
export function ProductDetailSkeleton() {
  return (
    <Container maxWidth="xl" sx={{ pt: 3, pb: 8 }}>
      <Skeleton variant="text" width={260} height={20} animation="wave" sx={{ mb: 3 }} />
      <Grid container spacing={{ xs: 3, md: 6 }}>
        <Grid item xs={12} md={7}>
          <Skeleton
            variant="rectangular"
            animation="wave"
            sx={{ width: '100%', paddingTop: '120%', borderRadius: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} variant="rectangular" width={70} height={92} animation="wave" sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        </Grid>
        <Grid item xs={12} md={5}>
          <Skeleton variant="text" width="70%" height={40} animation="wave" />
          <Skeleton variant="text" width="35%" height={32} animation="wave" sx={{ mb: 3 }} />
          <Skeleton variant="text" width="90%" height={18} animation="wave" />
          <Skeleton variant="text" width="80%" height={18} animation="wave" sx={{ mb: 3 }} />

          {/* Colour row, then size row — both are 44px boxes on the real page. */}
          <Skeleton variant="text" width={110} height={20} animation="wave" />
          <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
            {[0, 1, 2].map(i => (
              <Skeleton key={i} variant="rectangular" width={92} height={44} animation="wave" sx={{ borderRadius: 1 }} />
            ))}
          </Box>
          <Skeleton variant="text" width={90} height={20} animation="wave" />
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            {[0, 1, 2, 3, 4].map(i => (
              <Skeleton key={i} variant="rectangular" width={48} height={44} animation="wave" sx={{ borderRadius: 1 }} />
            ))}
          </Box>

          <Skeleton variant="rectangular" height={52} animation="wave" sx={{ borderRadius: 1, mb: 1.5 }} />
          <Skeleton variant="text" width="60%" height={18} animation="wave" />
        </Grid>
      </Grid>
    </Container>
  );
}

/** A page that opens on a full-width dark header, like /collections. */
export function BannerPageSkeleton({ children }: { children?: React.ReactNode }) {
  return (
    <Box>
      <Skeleton variant="rectangular" animation="wave" sx={{ height: { xs: 220, md: 300 } }} />
      <Container maxWidth="xl" sx={{ pt: { xs: 5, md: 7 } }}>
        <Skeleton variant="text" width={240} height={36} animation="wave" sx={{ mb: 3 }} />
        {children ?? (
          <Grid container spacing={3}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={260} animation="wave" sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

/** Admin pages: a title row and a stack of cards. */
export function AdminPageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Skeleton variant="text" width={200} height={34} animation="wave" />
          <Skeleton variant="text" width={280} height={16} animation="wave" />
        </Box>
        <Skeleton variant="rectangular" width={130} height={38} animation="wave" sx={{ borderRadius: 2 }} />
      </Box>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="rectangular" height={72} animation="wave" sx={{ borderRadius: 2, mb: 1.5 }} />
      ))}
    </Box>
  );
}
