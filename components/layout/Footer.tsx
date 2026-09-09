'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Container, Grid, Typography, Divider, IconButton, TextField, Button, Stack } from '@mui/material';
import { Instagram, Facebook, Twitter, YouTube, Pinterest } from '@mui/icons-material';

/** Intrinsic ratio of the brand lockup — keep in step with Navbar's copy. */
const LOGO_ASPECT = '1092 / 240';

const FOOTER_LINKS = {
  'Shop': [
    { label: 'New Arrivals', href: '/shop?isNewArrival=true' },
    { label: 'Trending', href: '/shop?isTrending=true' },
    { label: 'Best Sellers', href: '/shop?isBestSeller=true' },
    { label: 'Sale', href: '/shop?discount=true' },
    { label: 'All Products', href: '/shop' },
  ],
  'Help': [
    { label: 'FAQs', href: '/faq' },
    { label: 'Order Tracking', href: '/account/orders' },
    { label: 'Return & Exchange Policy', href: '/return-policy' },
    { label: 'Shipping Policy', href: '/shipping-policy' },
    { label: 'Contact Us', href: '/contact' },
  ],
  'Company': [
    { label: 'About Us', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms & Conditions', href: '/terms' },
  ],
};

interface FooterProps {
  settings?: Record<string, string>;
}

export default function Footer({ settings = {} }: FooterProps) {
  const siteName = settings.site_name || 'Unique Dressup';
  const siteDesc = settings.site_description || 'Trendy & affordable fashion for every occasion.';
  const email = settings.site_email || '';
  const phone = settings.site_phone || '';
  const hours = settings.contact_hours || '';

  const socials = [
    { icon: <Instagram fontSize="small" />, href: settings.instagram_url || '#' },
    { icon: <Facebook fontSize="small" />, href: settings.facebook_url || '#' },
    { icon: <Twitter fontSize="small" />, href: settings.twitter_url || '#' },
    { icon: <YouTube fontSize="small" />, href: settings.youtube_url || '#' },
    { icon: <Pinterest fontSize="small" />, href: settings.pinterest_url || '#' },
  ];

  return (
    <Box component="footer" sx={{ bgcolor: '#0d0d0d', color: 'white', mt: 'auto' }}>
      {/* Newsletter */}
      <Box sx={{ bgcolor: '#1a1a1a', py: 6 }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="overline"
              sx={{ color: '#c9a84c', letterSpacing: '0.2em', fontWeight: 600, display: 'block', mb: 1 }}
            >
              Newsletter
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 1, color: 'white' }}
            >
              Stay in the Loop
            </Typography>
            <Typography variant="body2" sx={{ color: '#aaa', mb: 3 }}>
              Subscribe for exclusive offers, new arrivals, and fashion inspiration.
            </Typography>
            {/* The Subscribe button is nowrap with 24px of side padding, so it
                cannot give ground; on a narrow phone the field would be squeezed
                to nothing. Wrapping puts the button on its own line instead. */}
            <Box sx={{ display: 'flex', gap: 1, maxWidth: 480, mx: 'auto', flexWrap: 'wrap' }}>
              <TextField
                placeholder="Your email address"
                size="small"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
                    color: 'white',
                  },
                  '& input::placeholder': { color: '#888' },
                }}
              />
              <Button
                variant="contained"
                sx={{ bgcolor: '#c9a84c', '&:hover': { bgcolor: '#a07c20' }, whiteSpace: 'nowrap', px: 3 }}
              >
                Subscribe
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Main Footer */}
      <Container maxWidth="xl" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          {/* Brand */}
          <Grid item xs={12} md={4}>
            {settings.logo_url ? (
              /**
               * The footer sits on #0d0d0d, so it needs the light colourway —
               * the dark wordmark would be near-invisible against it once the
               * asset has a transparent background. `logo_url_light` is
               * admin-configurable; falling back to the dark logo is still
               * better than rendering nothing.
               */
              <Box
                sx={{
                  position: 'relative',
                  height: { xs: 38, md: 46 },
                  aspectRatio: LOGO_ASPECT,
                  maxWidth: '100%',
                  mb: 2,
                }}
              >
                <Image
                  src={settings.logo_url_light || settings.logo_url}
                  alt={siteName}
                  fill
                  unoptimized
                  style={{ objectFit: 'contain', objectPosition: 'left center' }}
                />
              </Box>
            ) : (
              <Typography
                variant="h4"
                sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, letterSpacing: '0.1em', mb: 2, color: 'white' }}
              >
                {siteName}
              </Typography>
            )}
            <Typography variant="body2" sx={{ color: '#888', lineHeight: 1.8, mb: 3, maxWidth: 300 }}>
              {siteDesc}
            </Typography>
            <Stack direction="row" spacing={1}>
              {socials.map((social, i) => (
                <IconButton
                  key={i}
                  component="a"
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  sx={{
                    color: '#888',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '&:hover': { color: '#c9a84c', borderColor: '#c9a84c', bgcolor: 'rgba(201,168,76,0.1)' },
                    transition: 'all 0.2s',
                  }}
                >
                  {social.icon}
                </IconButton>
              ))}
            </Stack>
          </Grid>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <Grid item xs={6} sm={4} md={2} key={title}>
              <Typography
                variant="overline"
                sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.12em', display: 'block', mb: 2 }}
              >
                {title}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {links.map((link) => (
                  <Link key={link.href} href={link.href} style={{ textDecoration: 'none' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#888',
                        transition: 'color 0.2s',
                        '&:hover': { color: '#c9a84c' },
                        fontSize: '0.82rem',
                      }}
                    >
                      {link.label}
                    </Typography>
                  </Link>
                ))}
              </Box>
            </Grid>
          ))}

          {/* Contact */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography
              variant="overline"
              sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.12em', display: 'block', mb: 2 }}
            >
              Contact
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {email && (
                <Typography variant="body2" sx={{ color: '#888', fontSize: '0.82rem' }}>{email}</Typography>
              )}
              {phone && (
                <Typography variant="body2" sx={{ color: '#888', fontSize: '0.82rem' }}>{phone}</Typography>
              )}
              {hours && (
                <Typography variant="body2" sx={{ color: '#888', fontSize: '0.82rem', lineHeight: 1.6 }}>{hours}</Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)' }} />

      <Container maxWidth="xl">
        <Box sx={{
          py: 2.5, display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', alignItems: 'center', gap: 2,
        }}>
          <Typography variant="caption" sx={{ color: '#555' }}>
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'Privacy Policy', href: '/privacy-policy' },
              { label: 'Terms & Conditions', href: '/terms' },
              { label: 'Return & Exchange', href: '/return-policy' },
              { label: 'Shipping Policy', href: '/shipping-policy' },
            ].map((l) => (
              <Link key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
                <Typography variant="caption" sx={{ color: '#555', '&:hover': { color: '#c9a84c' }, transition: 'color 0.2s' }}>
                  {l.label}
                </Typography>
              </Link>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
