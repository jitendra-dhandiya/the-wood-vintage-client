'use client';
import Image from 'next/image';
import { Box, Container, Typography, Grid } from '@mui/material';
import { LocationOn, Phone, AccessTime } from '@mui/icons-material';
import { motion } from 'framer-motion';

interface Store {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone?: string;
  hours?: string;
  image?: string;
  mapLink?: string;
}

interface Props {
  stores: Store[];
  title?: string;
  subtitle?: string;
}

export default function StoreLocations({ stores, title = 'Visit Our Stores', subtitle = 'Find us at these locations' }: Props) {
  if (!stores?.length) return null;

  return (
    <Box sx={{ py: { xs: 7, md: 11 }, bgcolor: '#fff' }}>
      <Container maxWidth="xl">

        {/* ── Section header ─────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
            <Typography
              variant="h2"
              sx={{
                fontFamily: 'var(--font-playfair)',
                fontWeight: 700,
                fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.8rem' },
                color: '#111',
                letterSpacing: '-0.02em',
                mb: 1.25,
              }}
            >
              {title}
            </Typography>
            <Typography sx={{ color: '#888', fontSize: { xs: '0.88rem', md: '0.95rem' } }}>
              {subtitle}
            </Typography>
          </Box>
        </motion.div>

        {/* ── Store cards ────────────────────────────────────── */}
        <Grid container spacing={{ xs: 2.5, md: 3 }} justifyContent="center">
          {stores.map((store, i) => (
            <Grid key={store.id} item xs={12} sm={6} md={stores.length === 1 ? 6 : stores.length >= 3 ? 4 : 6}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Box
                  sx={{
                    border: '1px solid #e8e8e8',
                    borderRadius: 2,
                    overflow: 'hidden',
                    bgcolor: '#fff',
                    transition: 'box-shadow 0.25s, transform 0.25s',
                    '&:hover': {
                      boxShadow: '0 8px 40px rgba(0,0,0,0.1)',
                      transform: 'translateY(-3px)',
                    },
                  }}
                >
                  {/* Store image */}
                  <Box sx={{ position: 'relative', height: { xs: 200, sm: 230, md: 260 }, overflow: 'hidden', bgcolor: '#f0f0f0' }}>
                    {store.image ? (
                      <Image
                        src={store.image}
                        alt={store.name}
                        fill
                        style={{ objectFit: 'cover', transition: 'transform 0.6s ease' }}
                        sizes="(max-width: 600px) 100vw, 50vw"
                      />
                    ) : (
                      <Box sx={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Typography sx={{ fontFamily: 'var(--font-playfair)', fontSize: '3rem', color: 'rgba(201,168,76,0.3)', fontWeight: 700 }}>
                          {store.name.charAt(0)}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  {/* Store info */}
                  <Box sx={{ p: { xs: 2.5, md: 3 } }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: '1rem', md: '1.1rem' },
                        color: '#111',
                        mb: 2,
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {store.name}{store.city ? `, ${store.city}` : ''}
                    </Typography>

                    {/* Address */}
                    {store.address && (
                      <Box sx={{ display: 'flex', gap: 1.25, mb: 1.5, alignItems: 'flex-start' }}>
                        <LocationOn sx={{ fontSize: 17, color: '#888', mt: 0.15, flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.55 }}>
                          {store.address}
                        </Typography>
                      </Box>
                    )}

                    {/* Phone */}
                    {store.phone && (
                      <Box sx={{ display: 'flex', gap: 1.25, mb: 1.5, alignItems: 'center' }}>
                        <Phone sx={{ fontSize: 16, color: '#888', flexShrink: 0 }} />
                        <Typography
                          component="a"
                          href={`tel:${store.phone}`}
                          sx={{ fontSize: '0.85rem', color: '#555', textDecoration: 'none', '&:hover': { color: '#111' } }}
                        >
                          {store.phone}
                        </Typography>
                      </Box>
                    )}

                    {/* Hours */}
                    {store.hours && (
                      <Box sx={{ display: 'flex', gap: 1.25, mb: 2.5, alignItems: 'center' }}>
                        <AccessTime sx={{ fontSize: 16, color: '#888', flexShrink: 0 }} />
                        <Typography sx={{ fontSize: '0.85rem', color: '#555' }}>
                          {store.hours}
                        </Typography>
                      </Box>
                    )}

                    {/* Get Directions CTA */}
                    <Box
                      component={store.mapLink ? 'a' : 'div'}
                      href={store.mapLink || undefined}
                      target={store.mapLink ? '_blank' : undefined}
                      rel={store.mapLink ? 'noopener noreferrer' : undefined}
                      sx={{
                        display: 'block',
                        bgcolor: '#111',
                        color: 'white',
                        textAlign: 'center',
                        py: 1.4,
                        borderRadius: 1,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        letterSpacing: '0.06em',
                        textDecoration: 'none',
                        cursor: store.mapLink ? 'pointer' : 'default',
                        transition: 'background 0.2s',
                        '&:hover': { bgcolor: store.mapLink ? '#333' : '#111' },
                      }}
                    >
                      Get Directions
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>

      </Container>
    </Box>
  );
}
