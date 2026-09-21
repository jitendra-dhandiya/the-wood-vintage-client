'use client';
/**
 * The current market — READ-ONLY. The country is locked to the visitor's
 * location by `middleware.ts` (decision 0036); there is no way to change it
 * from the UI, so this context exposes no setter.
 *
 * Resolution (first enabled match wins):
 *   1. the `[country]` URL segment — middleware guarantees it equals the
 *      visitor's market before a storefront page renders;
 *   2. the `wv_country` hint cookie middleware writes (for routes with no
 *      country segment: /account, /login) — validated against `GET /countries`;
 *   3. the enabled list's `isDefault` row;
 *   4. null (the products API treats "no country" as the default market).
 */
import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { useParams } from 'next/navigation';
import { API_URL, CURRENCY_SYMBOL } from '../constants';
import type { Country } from '../types';
import { readCountryHint } from '../lib/countryPreference';

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
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext);
  if (!ctx) throw new Error('useCountry must be used within a CountryProvider');
  return ctx;
}

interface ProviderProps {
  /** The middleware-written `wv_country` hint, read server-side, to seed the first render. */
  initialCountry?: string | null;
  children: ReactNode;
}

export function CountryProvider({ initialCountry, children }: ProviderProps) {
  const params = useParams();

  // The `[country]` route segment of the current URL, uppercased — present
  // only on routes under `app/[country]/(store)/...`. `useParams()` reflects
  // the whole matched route regardless of where in the tree this provider
  // sits (it's mounted once, at the root layout, above both `[country]` and
  // the sibling `(account)`/`(admin)`/`(auth)` groups), and works during SSR
  // of this client component too, so there's no flash even on first load.
  const rawUrlCountry = (params as Record<string, string | string[] | undefined> | null)?.country;
  const urlCountry = (Array.isArray(rawUrlCountry) ? rawUrlCountry[0] : rawUrlCountry)
    ?.toUpperCase() || null;

  const [countries, setCountries] = useState<Country[]>([]);
  const [country, setCountryState] = useState<string | null>(
    urlCountry ?? (initialCountry ? initialCountry.toUpperCase() : null),
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

        const hint = initialCountry ?? readCountryHint();
        const defaultCandidate = enabled.find((c) => c.isDefault)?.code ?? null;
        const resolved = [urlCountry, hint, defaultCandidate]
          .find((candidate) => isEnabled(candidate)) ?? null;

        setCountryState(resolved);
      })
      .catch(() => { /* Leave whatever the URL/cookie/SSR seed already set. */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
    // Intentionally only on mount — re-fetching the enabled-country list on
    // every render is wasteful. Client-side navigation
    // between two country-prefixed routes is handled by the effect below
    // instead, without a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follows the URL on a client-side navigation between country-prefixed routes.
  useEffect(() => {
    if (urlCountry && urlCountry !== country) setCountryState(urlCountry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCountry]);

  const countryData = useMemo(
    () => countries.find((c) => c.code.toUpperCase() === country) ?? null,
    [countries, country],
  );

  const currencySymbol = countryData?.currencySymbol || CURRENCY_SYMBOL;

  const value = useMemo<CountryContextValue>(() => ({
    country, countryData, countries, loading, currencySymbol,
  }), [country, countryData, countries, loading, currencySymbol]);

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}
