import type { Metadata } from 'next';

/** Same reasoning as `shop/layout.tsx` — `categories/page.tsx` is a Client Component. */
export const metadata: Metadata = {
  title: 'Shop by Category',
  description: 'Explore our furniture and home décor categories — from dining and living room pieces to storage and outdoor furniture, all handcrafted from solid wood.',
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
