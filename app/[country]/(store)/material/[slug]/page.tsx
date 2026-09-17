import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TaxonomyPageClient from '../../../../../components/category/TaxonomyPageClient';
import { API_URL, SITE_URL } from '../../../../../constants';
import { withCountry } from '../../../../../lib/withCountry';
import { getEnabledCountries, buildCountryAlternates } from '../../../../../lib/countries';

interface Props {
  params: Promise<{ country: string; slug: string }>;
}

async function fetchMaterial(slug: string) {
  try {
    const res = await fetch(`${API_URL}/materials/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;
  const material = await fetchMaterial(slug);
  if (!material) return { title: 'Material Not Found' };
  const countries = await getEnabledCountries();
  const alt = buildCountryAlternates(`/material/${material.slug}`, country, countries);
  return {
    title: material.name,
    description: material.description || `Shop handcrafted furniture in ${material.name}.`,
    openGraph: {
      title: material.name,
      description: material.description,
      images: material.image ? [material.image] : [],
      url: alt.canonical,
    },
    alternates: alt,
  };
}

/** `/material/[slug]` landing page (Phase 6 §3) — closely follows `category/[slug]/page.tsx`. */
export default async function MaterialPage({ params }: Props) {
  const { country, slug } = await params;
  const material = await fetchMaterial(slug);
  if (!material) notFound();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Home', url: withCountry('/', country) },
      { name: 'Shop', url: withCountry('/shop', country) },
      { name: material.name, url: withCountry(`/material/${material.slug}`, country) },
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
      <TaxonomyPageClient type="material" item={material} />
    </>
  );
}
