'use client';
/**
 * Country selection, mirroring how `store/slices/genderSlice.ts` +
 * `components/common/GenderInitializer.tsx` + `lib/genderPreference.ts` work
 * together for the WOMEN/MEN preference — same cookie-first idea, but built as
 * a plain React Context (see `lib/countryPreference.ts` for why) instead of a
 * Redux slice.
 *
 * `GET /countries` (public) returns only `isEnabled: true` markets — see
 * documentation/docs/architecture/country-architecture-spec.md and
 * docs/decisions/0009-country-architecture-implemented.md. Resolution order,
 * per that spec's fallback tiers 2-4 (tier 1, IP/edge detection, is a
 * documented follow-up, not implemented here):
 *
 *   1. `wv_country` cookie / localStorage — but only if it names a country
 *      this call to `GET /countries` actually returned. A stale cookie from a
 *      country that has since been disabled must NOT be trusted blindly —
 *      the backend hard-400s `POST /orders` for an unresolvable country, so a
 *      shopper with a stale cookie must self-heal here, on the read side,
 *      before ever reaching checkout.
 *   2. Browser locale's region subtag (e.g. "en-AE" → "AE"), same validation.
 *   3. Whichever returned country has `isDefault: true`.
 *   4. No resolved country at all. Deliberately NOT hardcoded to "IN" — see
 *      `lib/countryPreference.ts`'s file comment. Sending no `?country=` at
 *      all is exactly what every product endpoint already treats as "use the
 *      default country's pricing" (this was the existing, backwards-compatible
 *      behaviour before this feature existed at all), so an unresolved
 *      selection is not a broken state, just an unpersonalized one.
 */
import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { API_URL, CURRENCY_SYMBOL } from '../constants';
import type { Country } from '../types';
import {
  readStoredCountry, persistCountry, guessCountryFromLocale,
} from '../lib/countryPreference';

interface CountryContextValue {
  /** Selected ISO code, or null when nothing has resolved yet (see tier 4 above). */
  country: string | null;
  /** The full row for `country`, once `countries` has loaded. */
  countryData: Country | null;
  /** Enabled markets from `GET /countries`. Empty until the first fetch resolves. */
  countries: Country[];
  /** True until the first `GET /countries` call has settled. */
  loading: boolean;
  /** Symbol to format prices with — the selected country's, falling back to the app default. */
  currencySymbol: string;
  /** Switches the country: validates against `countries`, persists the cookie, updates context. */
  setCountry: (code: string) => void;
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry must be used within a CountryProvider');
  return ctx;
}

interface ProviderProps {
  /**
   * The `wv_country` cookie value as read server-side (mirrors `initialGender`
   * on the homepage). Seeds the very first render so a country-aware SSR fetch
   * (`/products/:slug?country=`) and this context agree from the start — no
   * flash, no refetch, because unlike the Redux store this Context is not a
   * cross-request singleton.
   */
  initialCountry?: string | null;
  children: ReactNode;
}

export function CountryProvider({ initialCountry, children }: ProviderProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [country, setCountryState] = useState<string | null>(
    initialCountry ? initialCountry.toUpperCase() : null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_URL}/countries`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((json) => {
        if (cancelled) return;
        const enabled: Country[] = json?.data || [];
        setCountries(enabled);

        const isEnabled = (code: string | null) =>
          !!code && enabled.some((c) => c.code.toUpperCase() === code.toUpperCase());

        // Tier 1: the cookie this render was already seeded with, else read
        // fresh (covers a client-side navigation into a store page that did
        // not itself SSR the cookie).
        const cookieCandidate = initialCountry ?? readStoredCountry();
        // Tier 2: browser locale.
        const localeCandidate = guessCountryFromLocale();
        // Tier 3: the enabled list's default row.
        const defaultCandidate = enabled.find((c) => c.isDefault)?.code ?? null;

        const resolved = [cookieCandidate, localeCandidate, defaultCandidate]
          .find((candidate) => isEnabled(candidate)) ?? null;

        setCountryState(resolved);
        // Self-heal a stale/missing/disabled cookie to whatever actually
        // resolved, so the next SSR request (and `POST /orders`) sees a
        // trustworthy value instead of repeating the same stale one.
        if (resolved && resolved !== cookieCandidate) persistCountry(resolved);
      })
      .catch(() => { /* Leave whatever the cookie/SSR seed already set. */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // Intentionally only on mount — re-fetching the enabled-country list on
    // every render would fight `setCountry` below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCountry = useCallback((code: string) => {
    const upper = code.toUpperCase();
    persistCountry(upper);
    setCountryState(upper);
  }, []);

  const countryData = useMemo(
    () => countries.find((c) => c.code.toUpperCase() === country) ?? null,
    [countries, country],
  );

  const currencySymbol = countryData?.currencySymbol || CURRENCY_SYMBOL;

  const value = useMemo<CountryContextValue>(() => ({
    country, countryData, countries, loading, currencySymbol, setCountry,
  }), [country, countryData, countries, loading, currencySymbol, setCountry]);

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}
