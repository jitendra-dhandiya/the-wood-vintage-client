import { Box, Container, Grid, Skeleton } from '@mui/material';

function HeroSkeleton() {
  return (
    <Box sx={{ position: 'relative', width: '100%', height: { xs: 340, sm: 460, md: 580 }, overflow: 'hidden' }}>
      <Skeleton variant="rectangular" width="100%" height="100%" animation="wave" />
      {/* Overlay text placeholders */}
      <Box sx={{
        position: 'absolute', bottom: { xs: 32, md: 60 }, left: { xs: 24, md: 80 },
        display: 'flex', flexDirection: 'column', gap: 1.5,
      }}>
        <Skeleton variant="text" width={120} height={20} animation="wave" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
        <Skeleton variant="text" width={280} height={48} animation="wave" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
        <Skeleton variant="text" width={220} height={28} animation="wave" sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
        <Skeleton variant="rectangular" width={140} height={44} sx={{ borderRadius: 1, mt: 1, bgcolor: 'rgba(255,255,255,0.2)' }} animation="wave" />
      </Box>
    </Box>
  );
}

function PromoStripSkeleton() {
  return (
    <Box sx={{ bgcolor: '#f8f4ef', py: 2, px: { xs: 2, md: 8 } }}>
      <Grid container spacing={2}>
        {[0, 1, 2].map(i => (
          <Grid item xs={12} sm={4} key={i}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, py: 1 }}>
              <Skeleton variant="text" width={100} height={18} animation="wave" />
              <Skeleton variant="text" width={140} height={14} animation="wave" />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

function ProductSectionSkeleton({ bgColor = '#ffffff' }: { bgColor?: string }) {
  return (
    <Box sx={{ bgcolor: bgColor, py: { xs: 6, md: 10 } }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Box>
            <Skeleton variant="text" width={80} height={16} animation="wave" sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={200} height={40} animation="wave" />
          </Box>
          <Skeleton variant="text" width={90} height={20} animation="wave" />
        </Box>
        {/* Product cards */}
        <Grid container spacing={2}>
          {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
            <Grid item xs={6} sm={4} md={3} key={i}>
              <Box sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Skeleton variant="rectangular" width="100%" sx={{ aspectRatio: '3/4', borderRadius: 2 }} animation="wave" />
                <Box sx={{ pt: 1.5, px: 0.5 }}>
                  <Skeleton variant="text" width="70%" height={18} animation="wave" />
                  <Skeleton variant="text" width="45%" height={18} animation="wave" sx={{ mt: 0.5 }} />
                  <Skeleton variant="text" width="30%" height={22} animation="wave" sx={{ mt: 0.75 }} />
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function CategorySectionSkeleton() {
  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#fafafa' }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Skeleton variant="text" width={80} height={16} animation="wave" sx={{ mx: 'auto', mb: 0.5 }} />
          <Skeleton variant="text" width={220} height={40} animation="wave" sx={{ mx: 'auto' }} />
        </Box>
        <Grid container spacing={2}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <Grid item xs={6} sm={4} md={2} key={i}>
              <Box sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Skeleton variant="rectangular" width="100%" sx={{ aspectRatio: '1/1', borderRadius: 2 }} animation="wave" />
                <Skeleton variant="text" width="60%" height={18} animation="wave" sx={{ mt: 1, mx: 'auto' }} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

function TestimonialsSkeleton() {
  return (
    <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#1a1a1a' }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 5, textAlign: 'center' }}>
          <Skeleton variant="text" width={80} height={16} animation="wave" sx={{ mx: 'auto', mb: 0.5, bgcolor: 'rgba(255,255,255,0.1)' }} />
          <Skeleton variant="text" width={260} height={40} animation="wave" sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.1)' }} />
        </Box>
        <Grid container spacing={3}>
          {[0, 1, 2].map(i => (
            <Grid item xs={12} md={4} key={i}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 3, p: 3 }}>
                <Skeleton variant="text" width={100} height={20} animation="wave" sx={{ mb: 1.5, bgcolor: 'rgba(255,255,255,0.08)' }} />
                <Skeleton variant="text" width="100%" height={14} animation="wave" sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                <Skeleton variant="text" width="85%" height={14} animation="wave" sx={{ bgcolor: 'rgba(255,255,255,0.08)', mt: 0.5 }} />
                <Skeleton variant="text" width="60%" height={14} animation="wave" sx={{ bgcolor: 'rgba(255,255,255,0.08)', mt: 0.5, mb: 2 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Skeleton variant="circular" width={40} height={40} animation="wave" sx={{ bgcolor: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />
                  <Box>
                    <Skeleton variant="text" width={100} height={16} animation="wave" sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                    <Skeleton variant="text" width={70} height={14} animation="wave" sx={{ bgcolor: 'rgba(255,255,255,0.08)' }} />
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

// This file is automatically used by Next.js App Router while page.tsx is fetching data
export default function HomePageLoading() {
  return (
    <>
      <HeroSkeleton />
      <PromoStripSkeleton />
      <ProductSectionSkeleton />
      <CategorySectionSkeleton />
      <ProductSectionSkeleton />
      <ProductSectionSkeleton bgColor="#f8f4ef" />
      <TestimonialsSkeleton />
    </>
  );
}
