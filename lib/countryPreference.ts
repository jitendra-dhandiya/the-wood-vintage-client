/**
 * The `wv_country` cookie — a DERIVED HINT, never a preference or a source of
 * truth (decision 0036; supersedes 0010's user-selectable cookie).
 *
 * The storefront country is locked to the visitor's location: `middleware.ts`
 * resolves it (backend `GET /geo/resolve`) and writes this cookie on every
 * storefront response, purely so pages that have no `/<country>/` URL segment
 * (`/account/*`, `/login`) and server components can read the current market
 * without a network round-trip. Nothing in the UI writes it, and a
 * client-tampered value is overwritten on the next storefront request and is
 * still validated against the enabled list by `CountryContext`. Pricing and
 * ordering do not trust it — the backend re-derives the market from the request.
 */
export const COUNTRY_COOKIE = 'wv_country';

/** A bare ISO 3166-1 alpha-2 shape check — not a validity check against real data. */
const looksLikeCountryCode = (value?: string | null): value is string =>
  !!value && /^[A-Za-z]{2}$/.test(value);

/** Reads the hint cookie, uppercased, with no validation against the enabled-countries list. */
export const readCountryHint = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)wv_country=([A-Za-z]{2})/);
  return match && looksLikeCountryCode(match[1]) ? match[1].toUpperCase() : null;
};
