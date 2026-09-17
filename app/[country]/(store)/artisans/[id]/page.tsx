import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Container, Typography, Breadcrumbs } from '@mui/material';
import { API_URL, SITE_NAME, SITE_URL } from '../../../../../constants';
import { getEnabledCountries, buildCountryAlternates } from '../../../../../lib/countries';
import { withCountry } from '../../../../../lib/withCountry';
import type { Artisan } from '../../../../../types';

interface Props {
  params: Promise<{ country: string; id: string }>;
}

async function fetchArtisan(id: string): Promise<Artisan | null> {
  try {
    const res = await fetch(`${API_URL}/artisans/${id}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    return (await res.json()).data;
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, id } = await params;
  const artisan = await fetchArtisan(id);
  if (!artisan) return { title: 'Artisan Not Found' };
  const countries = await getEnabledCountries();
  const alt = buildCountryAlternates(`/artisans/${id}`, country, countries);
  return {
    title: `${artisan.name} — Our Artisans — ${SITE_NAME}`,
    description: artisan.bio || `Meet ${artisan.name}, a craftsperson behind our handcrafted collection.`,
    openGraph: {
      title: artisan.name,
      description: artisan.bio || undefined,
      images: artisan.photo ? [artisan.photo] : [],
      url: alt.canonical,
    },
    alternates: alt,
  };
}

/** Artisan bio page (Phase 4 §4) — linked from the directory and from the PDP maker card. */
export default async function ArtisanDetailPage({ params }: Props) {
  const { country, id } = await params;
  const artisan = await fetchArtisan(id);
  if (!artisan) notFound();

  // Mirrors the breadcrumb trail rendered just below: Home > Artisans > artisan name.
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Home', url: withCountry('/', country) },
      { name: 'Artisans', url: withCountry('/artisans', country) },
      { name: artisan.name, url: withCountry(`/artisans/${id}`, country) },
    ].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 6 }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <Breadcrumbs sx={{ mb: 4, fontSize: '0.85rem' }}>
        <Link href={withCountry('/', country)} style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
        <Link href={withCountry('/artisans', country)} style={{ color: 'inherit', textDecoration: 'none' }}>Artisans</Link>
        <Typography color="text.primary" sx={{ fontSize: 'inherit' }}>{artisan.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: 3, mb: 4, textAlign: { xs: 'center', sm: 'left' } }}>
        <Box sx={{
          position: 'relative', width: 140, height: 140, borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0, bgcolor: '#e8e4da',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {artisan.photo ? (
            <Image src={artisan.photo} alt={artisan.name} fill style={{ objectFit: 'cover' }} sizes="140px" />
          ) : (
            <Typography sx={{ fontSize: '3rem', fontWeight: 700, color: '#b3a377' }}>
              {artisan.name.charAt(0)}
            </Typography>
          )}
        </Box>
        <Box>
          <Typography variant="overline" sx={{ color: '#c9a84c', letterSpacing: '0.14em', fontWeight: 700 }}>
            Meet the Maker
          </Typography>
          <Typography variant="h3" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mt: 0.5 }}>
            {artisan.name}
          </Typography>
          {artisan.region && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
              {artisan.region}
            </Typography>
          )}
        </Box>
      </Box>

      {artisan.bio ? (
        <Typography variant="body1" sx={{ lineHeight: 1.9, color: '#333', whiteSpace: 'pre-line' }}>
          {artisan.bio}
        </Typography>
      ) : (
        <Typography variant="body1" color="text.secondary">
          More about {artisan.name} is coming soon.
        </Typography>
      )}

      <Box sx={{ mt: 6 }}>
        <Link href={withCountry('/artisans', country)} style={{ textDecoration: 'none' }}>
          <Typography sx={{ color: '#c9a84c', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4 }}>
            ← Back to all artisans
          </Typography>
        </Link>
      </Box>
    </Box>
  );
}
