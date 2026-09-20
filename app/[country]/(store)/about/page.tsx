import type { Metadata } from 'next';
import { Box, Container, Typography, Grid } from '@mui/material';
import { Favorite, VerifiedUser, LocalShipping, SupportAgent } from '@mui/icons-material';
import { withCountry } from '../../../../lib/withCountry';

export const metadata: Metadata = {
  title: 'About Us | The Wood Vintage',
  description: 'Discover the story behind The Wood Vintage — handcrafted wooden furniture and home décor, made by skilled artisans from responsibly sourced wood.',
};

const values = [
  {
    icon: <Favorite sx={{ fontSize: 32, color: '#A0693A' }} />,
    title: 'Made by Hand, Made to Last',
    desc: 'Every piece is shaped, joined and finished by skilled artisans, so no two are exactly alike and each is built to be used for decades.',
  },
  {
    icon: <VerifiedUser sx={{ fontSize: 32, color: '#A0693A' }} />,
    title: 'Responsibly Sourced Wood',
    desc: 'We work with solid sheesham, mango and teak from managed sources, seasoned properly before it is worked, and checked at every stage before it ships.',
  },
  {
    icon: <LocalShipping sx={{ fontSize: 32, color: '#A0693A' }} />,
    title: 'Careful Delivery',
    desc: 'Furniture is packed in protective, reinforced packaging and shipped across India, with tracking from dispatch to your door.',
  },
  {
    icon: <SupportAgent sx={{ fontSize: 32, color: '#A0693A' }} />,
    title: 'Support You Can Reach',
    desc: 'Our support team is available Monday–Saturday to help with orders, care advice, damage claims and anything else you need.',
  },
];

export default async function AboutPage({ params }: { params: Promise<{ country: string }> }) {
  const { country } = await params;
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FFFCF5' }}>
      {/* Hero */}
      <Box sx={{ bgcolor: '#3B2314', py: { xs: 8, md: 12 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography
            variant="overline"
            sx={{ color: '#D9A66E', letterSpacing: '0.2em', fontWeight: 600, display: 'block', mb: 1 }}
          >
            Our Story
          </Typography>
          <Typography
            variant="h2"
            sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: 'white', mb: 2 }}
          >
            About The Wood Vintage
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,252,245,0.78)', lineHeight: 1.9, maxWidth: 600, mx: 'auto' }}>
            Handcrafted wooden furniture and décor, made in India by artisans who take their time.
          </Typography>
        </Container>
      </Box>

      {/* Story */}
      <Container maxWidth="md" sx={{ py: { xs: 7, md: 10 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12}>
            <Typography
              variant="h4"
              sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#3B2314', mb: 2.5 }}
            >
              Who We Are
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.9, mb: 2 }}>
              The Wood Vintage is a handicraft brand dedicated to bringing honest, well-made wooden furniture into everyday homes.
              We began with a simple belief: a piece of furniture should feel good to touch, age gracefully and outlast trends.
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.9, mb: 2 }}>
              Our dining tables, chairs, storage pieces and décor are made in partnership with artisan workshops that
              have shaped wood for generations. Each piece is hand-finished, so you will see the grain, the joinery
              and the small variations that mark real craftsmanship rather than factory uniformity.
            </Typography>
            <Typography variant="body1" sx={{ color: '#555', lineHeight: 1.9 }}>
              We deliver across India with secure payments, transparent pricing and clear care guidance, so your furniture
              looks its best for years. If something is not right on arrival, we will work with you to fix it.
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
              sx={{ color: '#A0693A', letterSpacing: '0.2em', fontWeight: 600, display: 'block', mb: 1 }}
            >
              Our Values
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: '#3B2314' }}
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
                  '&:hover': { borderColor: '#A0693A', transition: 'border-color 0.2s' },
                }}>
                  <Box sx={{ mb: 2 }}>{v.icon}</Box>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#3B2314', mb: 1 }}>
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
      <Box sx={{ bgcolor: '#3B2314', py: { xs: 7, md: 9 }, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography
            variant="h4"
            sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, color: 'white', mb: 2 }}
          >
            Bring Home Something Made by Hand
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,252,245,0.78)', mb: 4, lineHeight: 1.8 }}>
            Explore furniture and décor crafted to be lived with and passed on.
          </Typography>
          <Box
            component="a"
            href={withCountry('/shop', country)}
            sx={{
              display: 'inline-block', bgcolor: '#A0693A', color: 'white',
              px: 4, py: 1.5, borderRadius: 1, textDecoration: 'none',
              fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.12em',
              textTransform: 'uppercase',
              '&:hover': { bgcolor: '#7E5029' },
              transition: 'background-color 0.2s',
            }}
          >
            Shop the Collection
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
