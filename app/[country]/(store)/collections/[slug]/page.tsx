import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CollectionPageClient from '../../../../components/category/CollectionPageClient';
import { API_URL, SITE_URL } from '../../../../constants';

interface Props {
  params: Promise<{ slug: string }>;
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
  const { slug } = await params;
  const col = await fetchCollection(slug);
  if (!col) return { title: 'Collection Not Found' };
  return {
    title: `${col.name} Collection — Unique Dressup`,
    description: col.description,
    openGraph: { title: col.name, description: col.description, images: col.imageUrl ? [col.imageUrl] : [] },
  };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const col = await fetchCollection(slug);
  if (!col) notFound();
  return <CollectionPageClient collection={col} />;
}
