import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from '../providers/ThemeProvider';
import ReduxProvider from '../providers/ReduxProvider';
import QueryProvider from '../providers/QueryProvider';
import { Suspense } from 'react';
import NavigationProgress from '../components/common/NavigationProgress';
import WebVitalsReporter from '../components/common/WebVitalsReporter';
import PageViewTracker from '../components/common/PageViewTracker';
import AttributionInitializer from '../components/common/AttributionInitializer';
import { SITE_NAME, SITE_URL, API_URL } from '../constants';
import { CountryProvider } from '../contexts/CountryContext';
import { COUNTRY_COOKIE } from '../lib/countryPreference';

/**
 * Scheme + host of the image/API origin, derived from API_URL by dropping the
 * /api/v1 suffix. Empty when API_URL is relative (same-origin), in which case
 * no preconnect is needed.
 */
const API_ORIGIN = (() => {
  try {
    return new URL(API_URL).origin;
  } catch {
    return '';
  }
})();
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Handcrafted Wooden Furniture & Home Décor`,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'Shop handcrafted wooden furniture, décor, and artisan-made pieces for every room. Solid wood dining tables, chairs, storage, and home accents, made to last.',
  keywords: ['handcrafted furniture', 'wooden furniture', 'solid wood furniture', 'home décor', 'artisan furniture', 'furniture online', 'handmade furniture'],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1a1a1a',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Root, not `(store)/layout.tsx`: `Navbar` — which reads `useCountry()` for
  // the country switcher — is rendered by both the `(store)` and `(account)`
  // route groups (sibling branches under this one, not nested inside each
  // other), so the provider has to sit above both. `(admin)`/`(auth)` render
  // neither Navbar nor anything country-aware, but inheriting the provider is
  // harmless for them.
  //
  // Seeded here, unvalidated, from whatever this request's `wv_country`
  // cookie says — CountryProvider itself checks it against the real
  // enabled-countries list (`GET /countries` only returns enabled markets,
  // so validity can only be confirmed once that call resolves; see the
  // provider's file comment).
  const initialCountry = (await cookies()).get(COUNTRY_COOKIE)?.value ?? null;

  // Sitewide identity — emitted once here rather than per-page, since it
  // describes the site as a whole (Knowledge Panel / sitelinks-search-box
  // eligibility), not any one page's content.
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  };
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* Every product image is served from the API origin, not this one, so
            without this the browser must complete DNS + TCP + TLS to that host
            before the first image byte arrives — typically 100-300ms of dead
            time on the largest element on the page. */}
        {API_ORIGIN && (
          <>
            <link rel="preconnect" href={API_ORIGIN} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={API_ORIGIN} />
          </>
        )}
        {/* Preconnect so the font CDN TCP handshake happens in parallel with HTML parse */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Non-blocking font load — runs in parallel, not serial like @import in CSS */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body>
        <ReduxProvider>
          <QueryProvider>
            <ThemeProvider>
              <CountryProvider initialCountry={initialCountry}>
                {/* Suspense because it reads useSearchParams, which opts its
                    subtree into client rendering — without the boundary that
                    would deopt every static page in the app. */}
                <Suspense fallback={null}>
                  <NavigationProgress />
                  <WebVitalsReporter />
                  <PageViewTracker />
                  <AttributionInitializer />
                </Suspense>
                {children}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#1a1a1a',
                      color: '#fff',
                      fontSize: '0.875rem',
                      fontFamily: 'Inter, sans-serif',
                    },
                    success: { iconTheme: { primary: '#c9a84c', secondary: '#fff' } },
                  }}
                />
              </CountryProvider>
            </ThemeProvider>
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
