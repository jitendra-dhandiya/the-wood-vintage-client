import type { Metadata } from 'next';
import { SITE_NAME } from '../../constants';

/**
 * Shown by `middleware.ts` (via rewrite) when the visitor's location is a
 * country with no enabled market — decision 0036. Static, dependency-free
 * markup so it renders even when the API is down. Never indexable.
 */
export const metadata: Metadata = {
  title: 'Not available in your region yet',
  robots: { index: false, follow: false },
};

const REGION_NAMES = (() => {
  try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch { return null; }
})();

export default async function NotAvailablePage({
  searchParams,
}: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const code = /^[A-Za-z]{2}$/.test(c ?? '') ? c!.toUpperCase() : null;
  const name = code ? (REGION_NAMES?.of(code) ?? code) : null;

  return (
    <main
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 20px', background: 'var(--cream, #F6EEDF)', color: 'var(--midnight, #2A190E)',
        fontFamily: 'var(--font-inter, sans-serif)',
      }}
    >
      <section style={{ maxWidth: 560, textAlign: 'center' }}>
        <p style={{ fontSize: '.7rem', letterSpacing: '.32em', textTransform: 'uppercase', color: 'var(--gold, #A0693A)', fontWeight: 600, margin: 0 }}>
          {SITE_NAME}
        </p>
        <div aria-hidden style={{ width: 48, height: 2, background: 'var(--gold, #A0693A)', margin: '18px auto 26px' }} />
        <h1 style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontWeight: 500, fontSize: 'clamp(1.9rem, 5vw, 2.7rem)', lineHeight: 1.15, margin: '0 0 16px' }}>
          Not available in your region yet
        </h1>
        <p style={{ fontSize: '1.02rem', lineHeight: 1.7, color: 'var(--charcoal, #4A2F1D)', margin: '0 0 12px' }}>
          {name
            ? `We are still opening our workshop doors to ${name}. `
            : 'We are still opening our workshop doors to your region. '}
          Our handcrafted wooden furniture and home décor currently ships to a small
          number of countries, and we are adding more.
        </p>
        <p style={{ fontSize: '.95rem', lineHeight: 1.7, color: 'var(--charcoal, #4A2F1D)', margin: '0 0 28px' }}>
          Interested in a piece for your home? Write to us and we will let you know
          the moment we can deliver to you.
        </p>
        <a
          href={`mailto:hello@thewoodvintage.com?subject=${encodeURIComponent(`Delivery to ${name ?? 'my region'}`)}`}
          style={{
            display: 'inline-block', padding: '13px 30px', background: 'var(--midnight, #2A190E)', color: '#fff',
            textDecoration: 'none', fontSize: '.8rem', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 600,
          }}
        >
          Contact us
        </a>
        <p style={{ fontSize: '.78rem', color: '#8a7462', margin: '26px 0 0' }}>hello@thewoodvintage.com</p>
      </section>
    </main>
  );
}
