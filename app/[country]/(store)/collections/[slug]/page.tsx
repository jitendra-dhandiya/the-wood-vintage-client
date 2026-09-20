import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CollectionPageClient from '../../../../../components/category/CollectionPageClient';
import { API_URL, SITE_URL } from '../../../../../constants';
import { getEnabledCountries, buildCountryAlternates } from '../../../../../lib/countries';
import { withCountry } from '../../../../../lib/withCountry';

interface Props {
  params: Promise<{ country: string; slug: string }>;
}

async function fetchCollection(slug: string) {
  try {
    const res = await fetch(`${API_URL}/collections/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()).data;
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;
  const col = await fetchCollection(slug);
  if (!col) return { title: 'Collection Not Found' };
  const countries = await getEnabledCountries();
  const alt = buildCountryAlternates(`/collections/${col.slug}`, country, countries);
  return {
    title: `${col.name} Collection — The Wood Vintage`,
    description: col.description,
    openGraph: { title: col.name, description: col.description, images: col.imageUrl ? [col.imageUrl] : [], url: alt.canonical },
    alternates: alt,
  };
}

export default async function CollectionPage({ params }: Props) {
  const { country, slug } = await params;
  const col = await fetchCollection(slug);
  if (!col) notFound();

  // Mirrors the breadcrumb trail `CollectionPageClient` actually renders:
  // Home > collection name.
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Home', url: withCountry('/', country) },
      { name: col.name, url: withCountry(`/collections/${col.slug}`, country) },
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
      <CollectionPageClient collection={col} />
    </>
  );
}
