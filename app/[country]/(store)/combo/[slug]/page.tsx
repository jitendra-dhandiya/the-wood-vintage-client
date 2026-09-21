import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ComboDetailClient from '../../../../../components/combo/ComboDetailClient';
import { API_URL, SITE_NAME, SITE_URL } from '@/constants';
import { withCountry } from '../../../../../lib/withCountry';

interface Props {
  params: Promise<{ country: string; slug: string }>;
}

/**
 * The combo as priced/available for this market. A combo not offered in the
 * market (or inactive / expired) is a 404 here, exactly like a product switched
 * off for a country. Combos are only offered in some markets, so no hreflang
 * alternates are emitted, only a canonical (decision 0037).
 */
async function getCombo(slug: string, country?: string) {
  try {
    const qs = country ? `?country=${encodeURIComponent(country)}` : '';
    const res = await fetch(`${API_URL}/combos/${slug}${qs}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()).data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;
  const combo = await getCombo(slug, country);
  if (!combo) return { title: 'Combo Not Found' };
  const url = `${SITE_URL}${withCountry(`/combo/${slug}`, country)}`;
  const desc = combo.description
    ? String(combo.description).substring(0, 160)
    : `${combo.name}: ${combo.items.map((i: any) => i.name).join(', ')}. Save ${combo.currencySymbol}${combo.savings} as a set.`;
  return {
    title: `${combo.name} | Combo offer`,
    description: desc,
    openGraph: {
      title: combo.name, description: desc, type: 'website', url,
      images: combo.image ? [{ url: combo.image, alt: combo.name }] : undefined,
    },
    alternates: { canonical: url },
  };
}

export default async function ComboPage({ params }: Props) {
  const { country, slug } = await params;
  const combo = await getCombo(slug, country);
  if (!combo) notFound();

  const url = `${SITE_URL}${withCountry(`/combo/${slug}`, country)}`;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: combo.name,
    description: combo.description || `Set of ${combo.items.length} handcrafted pieces: ${combo.items.map((i: any) => i.name).join(', ')}`,
    image: combo.image ? [combo.image] : combo.items.map((i: any) => i.image).filter(Boolean),
    brand: { '@type': 'Brand', name: SITE_NAME },
    url,
    offers: {
      '@type': 'Offer',
      url,
      price: combo.price,
      priceCurrency: combo.currency,
      availability: combo.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      ...(combo.endsAt ? { priceValidUntil: String(combo.endsAt).slice(0, 10) } : {}),
    },
  };
  const breadcrumbItems = [
    { name: 'Home', url: withCountry('/', country) },
    { name: 'Combo offers', url: withCountry('/combos', country) },
    { name: combo.name, url: withCountry(`/combo/${slug}`, country) },
  ];
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({
      '@type': 'ListItem', position: i + 1, name: item.name, item: `${SITE_URL}${item.url}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ComboDetailClient initial={combo} />
    </>
  );
}
