import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import MobileBottomNav from '../../components/layout/MobileBottomNav';
import AuthInitializer from '../../components/common/AuthInitializer';
import AccountSidebar from '../../components/account/AccountSidebar';
import ImageCropperProvider from '../../components/common/ImageCropperProvider';
import { Box, Container, Grid } from '@mui/material';

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <ImageCropperProvider>
      <AuthInitializer />
      <Navbar />
      <Box sx={{ bgcolor: '#fafafa', minHeight: '80vh', py: 4 }}>
        <Container maxWidth="xl">
          <Grid container spacing={3}>
            <Grid item xs={12} md={3} lg={2.5}>
              <AccountSidebar />
            </Grid>
            <Grid item xs={12} md={9} lg={9.5}>
              {children}
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Footer />
      <MobileBottomNav />
    </ImageCropperProvider>
  );
}
