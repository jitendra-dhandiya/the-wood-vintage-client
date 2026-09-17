import type { Metadata } from 'next';

/**
 * `page.tsx` in this segment is `'use client'` (filters/search-param state),
 * so it cannot itself export `generateMetadata`/`metadata` — a Server
 * Component page file is required for that. This sibling `layout.tsx` is the
 * codebase's existing pattern for giving a client page real metadata instead
 * of silently inheriting the root layout's fallback (see `app/layout.tsx`).
 */
export const metadata: Metadata = {
  title: 'Shop All Furniture',
  description: 'Browse our full range of handcrafted wooden furniture and home décor — dining tables, chairs, storage, and more, made by skilled artisans.',
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
