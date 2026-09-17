import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TaxonomyPageClient from '../../../../../components/category/TaxonomyPageClient';
import { API_URL, SITE_URL } from '../../../../../constants';
import { withCountry } from '../../../../../lib/withCountry';
import { getEnabledCountries, buildCountryAlternates } from '../../../../../lib/countries';

interface Props {
  params: Promise<{ country: string; slug: string }>;
}

async function fetchRoom(slug: string) {
  try {
    const res = await fetch(`${API_URL}/rooms/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;
  const room = await fetchRoom(slug);
  if (!room) return { title: 'Room Not Found' };
  const countries = await getEnabledCountries();
  const alt = buildCountryAlternates(`/room/${room.slug}`, country, countries);
  return {
    title: room.name,
    description: room.description || `Shop handcrafted furniture for the ${room.name}.`,
    openGraph: {
      title: room.name,
      description: room.description,
      images: room.image ? [room.image] : [],
      url: alt.canonical,
    },
    alternates: alt,
  };
}

/** `/room/[slug]` landing page (Phase 6 §3) — closely follows `category/[slug]/page.tsx`. */
export default async function RoomPage({ params }: Props) {
  const { country, slug } = await params;
  const room = await fetchRoom(slug);
  if (!room) notFound();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Home', url: withCountry('/', country) },
      { name: 'Shop', url: withCountry('/shop', country) },
      { name: room.name, url: withCountry(`/room/${room.slug}`, country) },
    ].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <TaxonomyPageClient type="room" item={room} />
    </>
  );
}
