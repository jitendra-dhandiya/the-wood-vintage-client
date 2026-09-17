import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import TaxonomyPageClient from '../../../../../components/category/TaxonomyPageClient';
import { API_URL, SITE_URL } from '../../../../../constants';
import { withCountry } from '../../../../../lib/withCountry';
import { getEnabledCountries, buildCountryAlternates } from '../../../../../lib/countries';

interface Props {
  params: Promise<{ country: string; slug: string }>;
}

async function fetchStyle(slug: string) {
  try {
    const res = await fetch(`${API_URL}/styles/${slug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;
  const style = await fetchStyle(slug);
  if (!style) return { title: 'Style Not Found' };
  const countries = await getEnabledCountries();
  const alt = buildCountryAlternates(`/style/${style.slug}`, country, countries);
  return {
    title: style.name,
    description: style.description || `Shop handcrafted furniture in the ${style.name} style.`,
    openGraph: {
      title: style.name,
      description: style.description,
      images: style.image ? [style.image] : [],
      url: alt.canonical,
    },
    alternates: alt,
  };
}

/** `/style/[slug]` landing page (Phase 6 §3) — closely follows `category/[slug]/page.tsx`. */
export default async function StylePage({ params }: Props) {
  const { country, slug } = await params;
  const style = await fetchStyle(slug);
  if (!style) notFound();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { name: 'Home', url: withCountry('/', country) },
      { name: 'Shop', url: withCountry('/shop', country) },
      { name: style.name, url: withCountry(`/style/${style.slug}`, country) },
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
      <TaxonomyPageClient type="style" item={style} />
    </>
  );
}
