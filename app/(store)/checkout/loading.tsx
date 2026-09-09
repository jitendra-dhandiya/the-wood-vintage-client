import { Box, Container, Grid, Skeleton } from '@mui/material';

/**
 * Checkout reads useSearchParams, which bails out of prerendering unless a
 * Suspense boundary sits above it — and a loading.tsx is that boundary.
 *
 * It used to inherit one from the store group, but that boundary also sat over
 * every page that calls notFound(), and a response that has begun streaming a
 * fallback can no longer be given a 404. The boundary now lives on the routes
 * that actually need it instead of over the whole storefront.
 */
export default function CheckoutLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Skeleton variant="text" width={180} height={40} animation="wave" sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          {[0, 1].map(i => (
            <Box key={i} sx={{ border: '1px solid #eee', borderRadius: 2, p: 2.5, mb: 2 }}>
              <Skeleton variant="text" width={140} height={24} animation="wave" sx={{ mb: 1.5 }} />
              {[0, 1, 2].map(j => (
                <Skeleton key={j} variant="rectangular" height={44} animation="wave" sx={{ borderRadius: 1, mb: 1.5 }} />
              ))}
            </Box>
          ))}
        </Grid>
        <Grid item xs={12} md={5}>
          <Box sx={{ border: '1px solid #eee', borderRadius: 2, p: 2.5 }}>
            <Skeleton variant="text" width={120} height={24} animation="wave" sx={{ mb: 2 }} />
            {[0, 1, 2].map(i => (
              <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                <Skeleton variant="rectangular" width={64} height={80} animation="wave" sx={{ borderRadius: 1, flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="80%" height={18} animation="wave" />
                  <Skeleton variant="text" width="40%" height={18} animation="wave" />
                </Box>
              </Box>
            ))}
            <Skeleton variant="rectangular" height={48} animation="wave" sx={{ borderRadius: 1, mt: 2 }} />
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
