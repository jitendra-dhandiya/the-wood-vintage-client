'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { usePathname } from 'next/navigation';
import { API_URL } from '../../constants';

/**
 * Phase 5 (Performance) - Core Web Vitals had zero measurement before this:
 * no web-vitals reporting, no Lighthouse CI, nothing. This turns it from
 * theoretical into real field data. Deliberately minimal (fire-and-forget to
 * a log line, no dashboard) -- a real analytics platform is Phase 7's
 * decision, not something to half-build here. See
 * phase-5-performance-spec.md.
 */
export default function WebVitalsReporter() {
  const pathname = usePathname();

  useReportWebVitals((metric) => {
    const body = JSON.stringify({ ...metric, path: pathname });
    // `keepalive` lets this survive a navigation that fires immediately
    // after (the common case for a metric like CLS/LCP settling on unload).
    fetch(`${API_URL}/metrics/web-vitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Best-effort telemetry -- never worth surfacing to the shopper.
    });
  });

  return null;
}
