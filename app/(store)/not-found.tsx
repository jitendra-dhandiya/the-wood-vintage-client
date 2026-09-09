import Link from 'next/link';
import { Box, Container, Typography, Button, Stack } from '@mui/material';

/**
 * The storefront's own 404, rendered inside the store layout so a shopper who
 * lands on a dead URL still has the navbar, the search and the footer to carry
 * on from — rather than Next's bare default, which is a dead end.
 *
 * Note this file is not the thing that makes the response a 404; the status
 * comes from notFound() being reached before the response starts streaming.
 * Adding a loading.tsx above any route that calls notFound() puts a Suspense
 * fallback on the wire first and the status is then fixed at 200, which is why
 * the product, category and collection routes deliberately have none.
 */
export default function StoreNotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 8, md: 14 }, textAlign: 'center' }}>
      <Typography
        sx={{
          fontFamily: 'var(--font-playfair)', fontWeight: 700, lineHeight: 1,
          fontSize: { xs: '4.5rem', md: '6rem' }, color: '#1a1a1a',
        }}
      >
        404
      </Typography>

      <Typography
        sx={{
          fontFamily: 'var(--font-playfair)', fontWeight: 600,
          fontSize: { xs: '1.4rem', md: '1.8rem' }, mt: 1, mb: 1.5, color: '#1a1a1a',
        }}
      >
        We couldn&apos;t find that page
      </Typography>

      <Typography sx={{ color: '#666', fontSize: '0.95rem', mb: 4 }}>
        The page may have been moved, or the address mistyped. These should help.
      </Typography>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        justifyContent="center"
        sx={{ mb: 5 }}
      >
        <Button
          component={Link} href="/shop" variant="contained" size="large"
          sx={{
            bgcolor: '#1a1a1a', px: 4, py: 1.5, fontSize: '0.78rem',
            letterSpacing: '0.12em', fontWeight: 700,
            '&:hover': { bgcolor: '#333' },
          }}
        >
          Shop All
        </Button>
        <Button
          component={Link} href="/" variant="outlined" size="large"
          sx={{
            borderColor: '#ddd', color: '#1a1a1a', px: 4, py: 1.5,
            fontSize: '0.78rem', letterSpacing: '0.12em', fontWeight: 700,
            '&:hover': { borderColor: '#1a1a1a', bgcolor: 'transparent' },
          }}
        >
          Home
        </Button>
      </Stack>

      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: 'New In',      href: '/shop?isNewArrival=true' },
          { label: 'Collections', href: '/collections' },
          { label: 'Sale',        href: '/shop?discount=true' },
        ].map(l => (
          <Link
            key={l.href}
            href={l.href}
            style={{
              color: '#666', fontSize: '0.8rem', letterSpacing: '0.08em',
              textTransform: 'uppercase', fontWeight: 600, textDecoration: 'none',
            }}
          >
            {l.label}
          </Link>
        ))}
      </Box>
    </Container>
  );
}
