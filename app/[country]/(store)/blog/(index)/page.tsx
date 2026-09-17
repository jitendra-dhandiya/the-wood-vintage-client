import type { Metadata } from 'next';
import BlogListClient from '../../../../../components/blog/BlogListClient';
import { API_URL, SITE_NAME } from '../../../../../constants';

export const metadata: Metadata = {
  title: 'Fashion Blog — Unique Dressup',
  description: 'Style guides, fashion tips, trend reports and behind-the-scenes stories from Unique Dressup.',
};

/**
 * Server-side fetch purely to feed the `ItemList`/`Article` JSON-LD below —
 * `BlogListClient` does its own client-side fetching/pagination/search and is
 * unaffected by this. Same endpoint shape `app/sitemap.ts` already uses for
 * its blog entries.
 */
async function getBlogsForSchema() {
  try {
    const res = await fetch(`${API_URL}/blogs?limit=20`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

export default async function BlogPage() {
  const blogs = await getBlogsForSchema();

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: blogs.map((b: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Article',
        headline: b.title,
        description: b.excerpt,
        image: b.coverImage ? [b.coverImage] : undefined,
        datePublished: b.publishedAt || b.createdAt,
        dateModified: b.updatedAt || b.publishedAt || b.createdAt,
        author: b.author
          ? { '@type': 'Person', name: `${b.author.firstName} ${b.author.lastName}`.trim() }
          : { '@type': 'Organization', name: SITE_NAME },
      },
    })),
  };

  return (
    <>
      {blogs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <BlogListClient />
    </>
  );
}
