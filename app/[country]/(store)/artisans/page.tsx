import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { API_URL, SITE_NAME } from '../../../../constants';
import { getEnabledCountries, buildCountryAlternates } from '../../../../lib/countries';
import { withCountry } from '../../../../lib/withCountry';
import type { Artisan } from '../../../../types';

interface Props {
  params: Promise<{ country: string }>;
}

async function fetchArtisans(): Promise<Artisan[]> {
  try {
    const res = await fetch(`${API_URL}/artisans`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return (await res.json()).data || [];
  } catch { return []; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countries = await getEnabledCountries();
  const alt = buildCountryAlternates('/artisans', country, countries);
  return {
    title: `Our Artisans — ${SITE_NAME}`,
    description: 'Meet the craftspeople behind every handcrafted piece — their story, their region, their trade.',
    alternates: alt,
  };
}

/**
 * Public artisan directory (Phase 4 §4) — the storytelling gap the audit
 * found: the PDP maker card already worked when data existed, but there was
 * nowhere for a shopper to browse artisans on their own. Follows the same
 * simple listing pattern as `/collections` and `/blog`.
 */
export default async function ArtisansPage({ params }: Props) {
  const { country } = await params;
  const artisans = await fetchArtisans();

  return (
    <Box sx={{ pb: { xs: 8, md: 6 } }}>
      <Box sx={{ bgcolor: '#3B2314', color: 'white', py: { xs: 6, md: 9 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h3" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 2 }}>
            Our Artisans
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 560, mx: 'auto' }}>
            Every piece is made by hand, by someone with a name and a trade. Meet the craftspeople
            behind the collection.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ pt: { xs: 5, md: 7 } }}>
        {artisans.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 12 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>No artisans listed yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Check back soon — artisan profiles are on their way.
            </Typography>
            <Link href={withCountry('/shop', country)} style={{ textDecoration: 'none' }}>
              <Typography sx={{ color: '#A0693A', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4 }}>
                Browse all products
              </Typography>
            </Link>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {artisans.map((artisan) => (
              <Grid item xs={12} sm={6} md={4} key={artisan.id}>
                <Link href={withCountry(`/artisans/${artisan.id}`, country)} style={{ textDecoration: 'none' }}>
                  <Card
                    elevation={0}
                    sx={{
                      borderRadius: 2, border: '1px solid', borderColor: 'divider',
                      p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                      cursor: 'pointer', height: '100%',
                      transition: 'box-shadow 0.2s, transform 0.2s',
                      '&:hover': { boxShadow: 4, transform: 'translateY(-3px)' },
                    }}
                  >
                    <Box sx={{
                      position: 'relative', width: 96, height: 96, borderRadius: '50%',
                      overflow: 'hidden', flexShrink: 0, bgcolor: '#e8e4da', mb: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {artisan.photo ? (
                        <Image src={artisan.photo} alt={artisan.name} fill style={{ objectFit: 'cover' }} sizes="96px" />
                      ) : (
                        <Typography sx={{ fontSize: '2rem', fontWeight: 700, color: '#b3a377' }}>
                          {artisan.name.charAt(0)}
                        </Typography>
                      )}
                    </Box>
                    <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                      <Typography variant="h6" fontWeight={700} sx={{ color: '#3B2314' }}>
                        {artisan.name}
                      </Typography>
                      {artisan.region && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {artisan.region}
                        </Typography>
                      )}
                      {artisan.bio && (
                        <Typography
                          variant="body2" color="text.secondary"
                          sx={{
                            mt: 1.5, lineHeight: 1.6,
                            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}
                        >
                          {artisan.bio}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
