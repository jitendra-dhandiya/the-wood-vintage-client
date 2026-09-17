import type { Metadata } from 'next';

/** Same reasoning as `shop/layout.tsx` — `search/page.tsx` is a Client Component. */
export const metadata: Metadata = {
  title: 'Search',
  description: 'Search our collection of handcrafted wooden furniture and home décor to find the perfect piece for your space.',
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
