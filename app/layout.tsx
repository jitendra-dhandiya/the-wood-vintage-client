import type { Metadata, Viewport } from 'next';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from '../providers/ThemeProvider';
import ReduxProvider from '../providers/ReduxProvider';
import QueryProvider from '../providers/QueryProvider';
import { Suspense } from 'react';
import NavigationProgress from '../components/common/NavigationProgress';
import { SITE_NAME, SITE_URL, API_URL } from '../constants';

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
    default: `${SITE_NAME} — Premium Fashion Store`,
    template: `%s | ${SITE_NAME}`,
  },
  description: 'Discover premium fashion, trending styles, and exclusive collections. Shop the latest in streetwear, co-ord sets, dresses, and more.',
  keywords: ['fashion', 'clothing', 'streetwear', 'dresses', 'online shopping', 'premium fashion', 'trending'],
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
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
              {/* Suspense because it reads useSearchParams, which opts its
                  subtree into client rendering — without the boundary that
                  would deopt every static page in the app. */}
              <Suspense fallback={null}>
                <NavigationProgress />
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
            </ThemeProvider>
          </QueryProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
