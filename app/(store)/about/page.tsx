import type { Metadata } from 'next';
import { Box, Container, Typography, Grid } from '@mui/material';
import { Favorite, VerifiedUser, LocalShipping, SupportAgent } from '@mui/icons-material';

export const metadata: Metadata = {
  title: 'About Us | Unique Dressup',
  description: 'Discover the story behind Unique Dressup — bringing trendy, affordable fashion to every wardrobe across India.',
};

const values = [
  {
    icon: <Favorite sx={{ fontSize: 32, color: '#c9a84c' }} />,
    title: 'Fashion for Everyone',
    desc: 'We believe great style shouldn\'t cost a fortune. Every collection is curated to deliver trends that are accessible to all.',
  },
  {
    icon: <VerifiedUser sx={{ fontSize: 32, color: '#c9a84c' }} />,
    title: 'Quality Assurance',
    desc: 'Every product goes through quality checks before it reaches you. We source from trusted manufacturers with strict standards.',
  },
  {
    icon: <LocalShipping sx={{ fontSize: 32, color: '#c9a84c' }} />,
    title: 'Pan-India Delivery',
    desc: 'We ship to thousands of pin codes across India with multiple shipping options to suit your timeline and budget.',
  },
  {
    icon: <SupportAgent sx={{ fontSize: 32, color: '#c9a84c' }} />,
    title: 'Customer First',
    desc: 'Our support team is available Monday–Saturday to help with orders, returns, and anything else you need.',
  },
];

export default function AboutPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa' }}>
      {/* Hero */}
      <Box sx={{ bgcolor: '#1a1a1a', py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography
            variant="overline"
            sx={{ color: '#c9a84c', letterSpacing: '0.2em', fontWeight: 600, display: 'block', mb: 1 }}
          >
            Our Story
          </Typography>
          <Typography
            variant="h2"
            sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: 'white', mb: 2 }}
          >
            About Unique Dressup
          </Typography>
          <Typography variant="body1" sx={{ color: '#aaa', lineHeight: 1.9, maxWidth: 600, mx: 'auto' }}>
            Trendy, affordable fashion for every occasion — curated with love from India.
          </Typography>
        </Container>
      </Box>

      {/* Story */}
      <Container maxWidth="md" sx={{ py: { xs: 7, md: 10 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12}>
            <Typography
              variant="h4"
              sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#1a1a1a', mb: 2.5 }}
            >
              Who We Are
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.9, mb: 2 }}>
              Unique Dressup is an Indian fashion brand dedicated to making contemporary style accessible to everyone.
              We launched with a simple belief: that looking good should never mean compromising your budget.
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.9, mb: 2 }}>
              From everyday casuals to festive occasion wear, our collections are carefully curated by our in-house
              fashion team to reflect the latest trends while staying true to the diverse tastes across India.
              Whether you're dressing for a college day, an office meeting, or a wedding celebration, we have
              something that fits the moment.
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.9 }}>
              We're proud to serve customers across thousands of cities and towns in India, offering a seamless
              online shopping experience with secure payments, fast delivery, and a hassle-free return process.
            </Typography>
          </Grid>
        </Grid>
      </Container>

      {/* Values */}
      <Box sx={{ bgcolor: 'white', borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider', py: { xs: 7, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="overline"
              sx={{ color: '#c9a84c', letterSpacing: '0.2em', fontWeight: 600, display: 'block', mb: 1 }}
            >
              Our Values
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#1a1a1a' }}
            >
              What Drives Us
            </Typography>
          </Box>
          <Grid container spacing={4}>
            {values.map((v) => (
              <Grid item xs={12} sm={6} key={v.title}>
                <Box sx={{
                  border: '1px solid', borderColor: 'divider', borderRadius: 2,
                  p: 3.5, height: '100%',
                  '&:hover': { borderColor: '#c9a84c', transition: 'border-color 0.2s' },
                }}>
                  <Box sx={{ mb: 2 }}>{v.icon}</Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1a1a1a', mb: 1 }}>
                    {v.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8 }}>
                    {v.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA */}
      <Box sx={{ bgcolor: '#1a1a1a', py: { xs: 7, md: 9 }, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography
            variant="h4"
            sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: 'white', mb: 2 }}
          >
            Experience Fashion Your Way
          </Typography>
          <Typography variant="body1" sx={{ color: '#aaa', mb: 4, lineHeight: 1.8 }}>
            Shop the latest collections and discover styles that define you.
          </Typography>
          <Box
            component="a"
            href="/shop"
            sx={{
              display: 'inline-block', bgcolor: '#c9a84c', color: 'white',
              px: 4, py: 1.5, borderRadius: 1, textDecoration: 'none',
              fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.12em',
              textTransform: 'uppercase',
              '&:hover': { bgcolor: '#a07c20' },
              transition: 'background-color 0.2s',
            }}
          >
            Shop Now
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
