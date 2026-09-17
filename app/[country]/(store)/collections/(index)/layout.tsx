import type { Metadata } from 'next';

/**
 * Same reasoning as `shop/layout.tsx` — `(index)/page.tsx` (the collections
 * index) is a Client Component. `collections/[slug]/page.tsx` already has its
 * own `generateMetadata` and is unaffected by this layout, which only wraps
 * the `(index)` route group.
 */
export const metadata: Metadata = {
  title: 'Collections',
  description: 'Discover curated collections of handcrafted wooden furniture and home décor, grouped by style and story.',
};

export default function CollectionsIndexLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
