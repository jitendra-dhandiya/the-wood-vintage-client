import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetailClient from '../../../../components/product/ProductDetailClient';
import { API_URL } from '@/constants';

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    const apiUrl = API_URL;
    const res = await fetch(`${apiUrl}/products/${slug}`, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product Not Found' };

  return {
    title: product.metaTitle || product.name,
    description: product.metaDesc || product.shortDesc || product.description?.substring(0, 160),
    keywords: product.tags?.map((t: any) => t.tag).join(', '),
    openGraph: {
      title: product.metaTitle || product.name,
      description: product.metaDesc || product.shortDesc,
      images: product.images?.[0]?.url ? [{ url: product.images[0].url, alt: product.name }] : undefined,
      type: 'website',
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
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
