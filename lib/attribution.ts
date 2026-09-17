/**
 * Where first-touch marketing attribution (utm_source/utm_medium/utm_campaign)
 * lives.
 *
 * Mirrors `lib/genderPreference.ts` / `lib/countryPreference.ts` — a cookie,
 * not just component state, so it survives the rest of the shopper's visit
 * (and any later one) and can be read again at checkout without them still
 * being on the landing page the campaign link pointed at.
 *
 * First-touch only (phase-7-analytics-spec.md §4): whichever campaign landed
 * the shopper here FIRST is what gets stored — a later visit with different
 * utm_* params must never overwrite it. `AttributionInitializer` is the only
 * writer and it already enforces this (checks `readStoredAttribution()`
 * before calling `persistAttribution`); this file just owns the cookie
 * mechanics, same split as the gender/country pair above.
 */
export interface Attribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

export const ATTRIBUTION_COOKIE = 'wv_attribution';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Reads and JSON-decodes the stored attribution, or null if none is stored or it's malformed. */
export const readStoredAttribution = (): Attribution | null => {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/(?:^|;\s*)wv_attribution=([^;]*)/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(match[1]));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    // Malformed cookie (hand-edited, truncated, pre-format) — treat as unset
    // rather than throwing.
    return null;
  }
};

/**
 * Persists first-touch attribution. Callers are expected to have already
 * checked `readStoredAttribution()` returns null — this function itself does
 * not guard against overwriting, same division of responsibility as
 * `persistGender`/`persistCountry`.
 */
export const persistAttribution = (attribution: Attribution): void => {
  if (typeof document === 'undefined') return;
  // Lax keeps the cookie on normal top-level navigations (the campaign link
  // itself is one), without sending it on cross-site subrequests.
  const value = encodeURIComponent(JSON.stringify(attribution));
  document.cookie = `${ATTRIBUTION_COOKIE}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
};
