import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import CategoryPageClient from '../../../../components/category/CategoryPageClient';
import { API_URL, SITE_URL } from '../../../../constants';
import { legacyCategoryTarget } from '../../../../lib/legacyCategorySlugs';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}

async function fetchCategory(slug: string) {
  try {
    const res = await fetch(`${API_URL}/categories/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data;
  } catch { return null; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cat = await fetchCategory(slug);
  if (!cat) return { title: 'Category Not Found' };
  return {
    title: cat.seoMeta?.metaTitle || `${cat.name} — Unique Dressup`,
    description: cat.seoMeta?.metaDescription || cat.description,
    openGraph: {
      title: cat.name,
      description: cat.description,
      images: cat.imageUrl ? [cat.imageUrl] : [],
      url: `${SITE_URL}/category/${cat.slug}`,
    },
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const cat = await fetchCategory(slug);

  if (!cat) {
    // Only once the slug has resolved to nothing, so this stays inert until the
    // rename actually happens and cannot strand a URL that still works. Next
    // answers with a 308, which Google treats as a 301 for ranking — the
    // difference between them is only whether the HTTP method is preserved.
    const moved = legacyCategoryTarget(slug);
    if (moved) permanentRedirect(`/category/${moved}`);
    notFound();
  }

  return <CategoryPageClient category={cat} searchParams={sp} />;
}
