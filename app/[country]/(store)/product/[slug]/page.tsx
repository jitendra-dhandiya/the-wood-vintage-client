import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from '../../../../../components/product/ProductDetailClient';
import { API_URL } from '@/constants';
import { getEnabledCountries, buildCountryAlternates } from '../../../../../lib/countries';

interface Props {
  params: Promise<{ country: string; slug: string }>;
}

/**
 * `country`, when present, is passed straight through as `?country=` — no
 * client-side validation against the enabled-countries list here, because a
 * bad/stale/disabled value degrades gracefully on this read-only endpoint
 * (falls back to base pricing server-side), unlike `POST /orders` which
 * hard-400s on one. See docs/decisions/0009-country-architecture-implemented.md.
 */
async function getProduct(slug: string, country?: string) {
  try {
    const apiUrl = API_URL;
    const qs = country ? `?country=${encodeURIComponent(country)}` : '';
    const res = await fetch(`${apiUrl}/products/${slug}${qs}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country, slug } = await params;
  const product = await getProduct(slug, country);
  if (!product) return { title: 'Product Not Found' };
  const countries = await getEnabledCountries();
  const alt = buildCountryAlternates(`/product/${slug}`, country, countries);

  return {
    title: product.metaTitle || product.name,
    description: product.metaDesc || product.shortDesc || product.description?.substring(0, 160),
    keywords: product.tags?.map((t: any) => t.tag).join(', '),
    openGraph: {
      title: product.metaTitle || product.name,
      description: product.metaDesc || product.shortDesc,
      images: product.images?.[0]?.url ? [{ url: product.images[0].url, alt: product.name }] : undefined,
      type: 'website',
      url: alt.canonical,
    },
    alternates: alt,
  };
}

export default async function ProductPage({ params }: Props) {
  // URL-first (phase 3): the country segment is the source of truth for
  // country-aware pricing now, not the `wv_country` cookie — middleware
  // already guarantees it's valid+enabled by the time this page renders, so
  // this SSR fetch and the client-side `CountryContext` are guaranteed to
  // agree on which country's price this render shows.
  const { country, slug } = await params;
  const product = await getProduct(slug, country);
  if (!product) notFound();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    sku: product.sku,
    brand: { '@type': 'Brand', name: product.brand || 'LUXÉ' },
    image: product.images?.map((i: any) => i.url),
    offers: {
      '@type': 'Offer',
      price: product.salePrice || product.basePrice,
      priceCurrency: 'INR',
      availability: product.stockQuantity > 0 ? 'InStock' : 'OutOfStock',
    },
    ...(product.totalReviews > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.avgRating,
        reviewCount: product.totalReviews,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ProductDetailClient product={product} />
    </>
  );
}
