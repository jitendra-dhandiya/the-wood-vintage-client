import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Box } from '@mui/material';
import GenderHomePage from '../../../../components/home/GenderHomePage';
import { API_URL, SITE_NAME } from '../../../../constants';
import { GENDER_COOKIE, normalizeGender, type GenderType } from '../../../../lib/genderPreference';
import { getEnabledCountries, buildCountryAlternates } from '../../../../lib/countries';

interface Props {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const countries = await getEnabledCountries();
  const alt = buildCountryAlternates('/', country, countries);
  return {
    title: { absolute: `${SITE_NAME} — Handcrafted Wooden Furniture & Décor` },
    description: 'Shop artisan-made solid wood furniture and home décor. Sheesham, mango and teak pieces, hand-finished and delivered across India.',
    alternates: alt,
  };
}

const API = API_URL || 'http://localhost:5000/api/v1';

async function getHomepageData(gender: GenderType) {
  try {
    const res = await fetch(`${API}/homepage/data?gender=${gender}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()).data;
  } catch { return null; }
}

async function getProducts(type: string, gender: GenderType) {
  try {
    const res = await fetch(`${API}/products/${type}?limit=8&gender=${gender}`, { cache: 'no-store' });
    if (!res.ok) return [];
    return (await res.json()).data || [];
  } catch { return []; }
}

async function getCategories() {
  try {
    // Not gender-filtered here: the client filters these, and UNISEX/unset
    // categories need to survive the filter rather than be dropped server-side.
    const res = await fetch(`${API}/categories/home`, { cache: 'no-store' });
    if (!res.ok) return [];
    return (await res.json()).data || [];
  } catch { return []; }
}

async function getStores() {
  try {
    const res = await fetch(`${API}/stores`, { cache: 'no-store' });
    if (!res.ok) return [];
    return (await res.json()).data || [];
  } catch { return []; }
}

async function getReels(gender: GenderType) {
  try {
    // Reels are art-directed per storefront, so the server has to render the
    // right row for the cookie's gender — otherwise a MEN shopper gets a flash
    // of women's reels before the client refetch corrects it.
    const res = await fetch(`${API}/instagram-reels?gender=${gender}`, { cache: 'no-store' });
    if (!res.ok) return [];
    return (await res.json()).data || [];
  } catch { return []; }
}

export default async function HomePage() {
  // The shopper's WOMEN/MEN preference. Without this the server always rendered
  // the unfiltered catalogue while the restored toggle showed MEN, so a refresh
  // left the toggle and the products disagreeing.
  const gender = normalizeGender((await cookies()).get(GENDER_COOKIE)?.value);

  const [homepageData, featured, newArrivals, trending, bestSellers, categories, stores, reels] = await Promise.all([
    getHomepageData(gender),
    getProducts('featured', gender),
    getProducts('new-arrivals', gender),
    getProducts('trending', gender),
    getProducts('best-sellers', gender),
    getCategories(),
    getStores(),
    getReels(gender),
  ]);

  const sections: any[] = homepageData?.sections || [];
  const heroBanners: any[] = homepageData?.heroBanners || [];
  const promoBanners: any[] = homepageData?.promoBanners || [];
  const testimonials: any[] = homepageData?.testimonials || [];

  return (
    <>
      <GenderHomePage
        sections={sections}
        initialGender={gender}
        initialData={{ heroBanners, promoBanners, featured, newArrivals, trending, bestSellers, categories, testimonials, stores, reels }}
      />
      <Box sx={{ display: { md: 'none' }, height: 64 }} />
    </>
  );
}
