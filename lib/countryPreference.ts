/**
 * Where the shopper's country selection lives.
 *
 * Mirrors `lib/genderPreference.ts` (`ud_gender`) — same shape, new concern.
 * Stored in a cookie, not only client state, because several pages are
 * server-rendered and the pricing the server fetches (`GET /products`,
 * `GET /products/:slug` with `?country=`) has to match what the client then
 * shows, otherwise the page renders one country's price and the restored
 * selector shows another.
 *
 * Unlike gender, this repo's `CountryContext` is a plain React Context rather
 * than a Redux slice — Redux's store here is a module singleton shared across
 * SSR requests (see `store/slices/genderSlice.ts`'s comment), which is why the
 * gender pattern needs an `initialized` flag and a client-side catch-up
 * dispatch. A Context provider is part of the React tree, so it can be seeded
 * directly from the per-request cookie value on the server with no such
 * flash-avoidance dance.
 *
 * Deliberately NOT a hardcoded "IN" fallback anywhere in this file: which
 * country is "the default" is an admin-configurable `Country.isDefault` row,
 * and `GET /countries` only ever returns *enabled* countries, so the default
 * row is only knowable for certain once that list has loaded. Until it has,
 * `readStoredCountry()` returns whatever the cookie says (even if it turns
 * out to be disabled/invalid) and callers are expected to validate it against
 * the real enabled list once available — see `CountryContext`.
 */
export const COUNTRY_COOKIE = 'wv_country';
const COUNTRY_STORAGE_KEY = 'wv_country';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** A bare ISO 3166-1 alpha-2 shape check — not a validity check against real data. */
const looksLikeCountryCode = (value?: string | null): value is string =>
  !!value && /^[A-Za-z]{2}$/.test(value);

/** Reads the raw cookie value, uppercased, with no validation against the enabled-countries list. */
export const readStoredCountry = (): string | null => {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/(?:^|;\s*)wv_country=([A-Za-z]{2})/);
  if (match) return match[1].toUpperCase();

  try {
    const legacy = window.localStorage.getItem(COUNTRY_STORAGE_KEY);
    if (looksLikeCountryCode(legacy)) return legacy.toUpperCase();
  } catch {
    // Private mode or blocked storage — fall through.
  }
  return null;
};

/** Persists the selection so both the client and the next SSR request see it. */
export const persistCountry = (code: string): void => {
  if (typeof document === 'undefined' || !looksLikeCountryCode(code)) return;
  const value = code.toUpperCase();
  // Lax keeps the cookie on normal top-level navigations, which is all the
  // server render needs, without sending it on cross-site subrequests.
  document.cookie = `${COUNTRY_COOKIE}=${value}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  try {
    window.localStorage.setItem(COUNTRY_STORAGE_KEY, value);
  } catch {
    // Cookie alone is enough; storage is a convenience.
  }
};

/**
 * Best-effort region guess from the browser's locale (e.g. "en-AE" → "AE").
 * Only a candidate — still has to be checked against the enabled-countries
 * list by the caller, same as the cookie value.
 */
export const guessCountryFromLocale = (): string | null => {
  if (typeof navigator === 'undefined') return null;
  const locale = navigator.language || (navigator.languages && navigator.languages[0]);
  if (!locale) return null;
  const region = locale.split('-')[1];
  return looksLikeCountryCode(region) ? region.toUpperCase() : null;
};
