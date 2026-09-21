'use client';
import Link from 'next/link';
import { Box, Breadcrumbs, Container, Grid, Skeleton, Typography } from '@mui/material';
import { NavigateNext } from '@mui/icons-material';
import ComboCard from './ComboCard';
import { useCombos } from './useCombos';
import { useCountry } from '../../contexts/CountryContext';
import { withCountry } from '../../lib/withCountry';

export default function ComboListClient() {
  const { country } = useCountry();
  const { combos, loading } = useCombos({ limit: 48 });
  return (
    <Container maxWidth="xl" sx={{ pt: 3, pb: { xs: 6, md: 10 } }}>
      <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3, fontSize: '0.8rem', position: 'relative', zIndex: 2 }}>
        <Link href={withCountry('/', country)} style={{ color: '#888', textDecoration: 'none' }}>Home</Link>
        <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>Combo offers</Typography>
      </Breadcrumbs>
      <Typography component="h1" sx={{ fontFamily: '"Cormorant Garamond", "Playfair Display", Georgia, serif', fontWeight: 600, fontSize: { xs: '2.4rem', md: '3.4rem' }, color: '#3B2314', lineHeight: 1.05 }}>
        Combo offers
      </Typography>
      <Typography sx={{ color: '#5a4636', mt: 1, mb: 4, maxWidth: 620 }}>
        Handpicked sets of our pieces, priced together for less than buying them one by one.
      </Typography>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {loading
          ? [0, 1, 2].map((i) => (<Grid key={i} item xs={12} sm={6} md={4}><Skeleton variant="rounded" height={460} animation="wave" /></Grid>))
          : combos.map((c, i) => (<Grid key={c.id} item xs={12} sm={6} md={4}><ComboCard combo={c} priority={i < 3} /></Grid>))}
      </Grid>
      {!loading && !combos.length && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>No combo offers right now</Typography>
          <Typography color="text.secondary">Check back soon, or browse the full collection.</Typography>
        </Box>
      )}
    </Container>
  );
}
