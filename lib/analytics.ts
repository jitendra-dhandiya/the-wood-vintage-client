import { API_URL } from '../constants';

/**
 * Phase 7 (Analytics) funnel stages -- must match the backend's
 * VALID_EVENT_NAMES allow-list (metrics.controller.ts) and the 5-stage
 * funnel order `GET /analytics/funnel` reports on.
 */
export type AnalyticsEventName =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'ADD_TO_CART'
  | 'CHECKOUT_STARTED'
  | 'ORDER_PLACED';

interface TrackEventOptions {
  path?: string;
  productId?: string;
}

const SESSION_STORAGE_KEY = 'sessionId';

/**
 * Reads the SAME sessionId `lib/axios.ts` generates and stores under
 * `localStorage['sessionId']` -- read-only here, this never overrides
 * whatever axios.ts already wrote. The fallback generation (identical to
 * axios.ts's own `crypto.randomUUID()`) exists only so a tracked event fired
 * before the first API call (which is what lazily seeds the key today)
 * still carries a real, stable session id instead of `null`.
 */
function getSessionId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_STORAGE_KEY, id);
    return id;
  } catch {
    // Private mode or blocked storage -- tracking degrades to a sessionless
    // event rather than throwing.
    return undefined;
  }
}

/**
 * Phase 7 (Analytics) in-house funnel event log -- fire-and-forget `POST` to
 * `/metrics/event`, same discipline as `WebVitalsReporter.tsx`'s
 * `.catch(() => {})`: never blocks, never throws, never surfaces an error to
 * the shopper for a failed analytics beacon. See phase-7-analytics-spec.md §3.
 */
export function trackEvent(name: AnalyticsEventName, opts: TrackEventOptions = {}): void {
  if (typeof window === 'undefined') return;

  const body = JSON.stringify({
    name,
    sessionId: getSessionId(),
    path: opts.path,
    productId: opts.productId,
  });

  // `keepalive` lets this survive a navigation that fires immediately after
  // (e.g. ORDER_PLACED right before a redirect).
  fetch(`${API_URL}/metrics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {
    // Best-effort telemetry -- never worth surfacing to the shopper.
  });
}
