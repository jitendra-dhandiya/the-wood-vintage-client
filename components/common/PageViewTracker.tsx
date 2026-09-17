'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '../../lib/analytics';

/**
 * Phase 7 (Analytics) PAGE_VIEW firing -- one event per real storefront
 * navigation, same `usePathname()` pattern as `WebVitalsReporter.tsx`.
 *
 * Scoped to shopper-facing routes only: `/admin` activity isn't a shopper
 * funnel signal (phase-7-analytics-spec.md §3). Admin and auth routes live
 * at the top level (`app/(admin)/admin/**`, `app/(auth)/**`), not under
 * `[country]`, so a plain prefix check is enough.
 *
 * `lastTracked` dedupes a path firing twice in a row from a re-render that
 * is not a real navigation (`usePathname()` only changes on an actual route
 * change, but this guards against any effect re-run with the same value).
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/admin') || pathname.startsWith('/admin-login')) return;
    if (lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    trackEvent('PAGE_VIEW', { path: pathname });
  }, [pathname]);

  return null;
}
