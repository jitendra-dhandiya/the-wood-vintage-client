import type { Metadata } from 'next';

/** Same reasoning as `shop/layout.tsx` — `contact/page.tsx` is a Client Component. */
export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with our team for questions about orders, products, or custom handcrafted furniture requests.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
