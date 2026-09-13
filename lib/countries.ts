import { API_URL, SITE_URL } from '../constants';
import type { Country } from '../types';

/**
 * Enabled markets, for server-rendered code that needs the *whole* list
 * (sitemap generation, hreflang tags) rather than just the current request's
 * one country. Cached briefly via Next's fetch cache — this list only
 * changes when an admin edits it in `/admin/countries`, so a page render
 * doesn't need to hit the backend for it on every request.
 */
export async function getEnabledCountries(): Promise<Country[]> {
  try {
    const res = await fetch(`${API_URL}/countries`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data ?? [];
  } catch {
    return [];
  }
}

export function getDefaultCountryCode(countries: Country[]): string | null {
  return countries.find((c) => c.isDefault)?.code ?? countries[0]?.code ?? null;
}

/**
 * `alternates.canonical` + `alternates.languages` for one storefront page,
 * per `docs/architecture/phase-3-url-restructuring-spec.md`'s "hreflang +
 * canonical" section: canonical is the *current* country's own path (each
 * country's page is its own entity, not a duplicate of a "main" version),
 * and `languages` links to the equivalent path under every other enabled
 * country, keyed by that country's `locale` (which is exactly the
 * language-REGION shape `hreflang` wants, e.g. "en-AE"), plus `x-default`
 * pointing at the default country's path.
 *
 * `pathWithoutCountry` is the page's path with no leading country segment,
 * e.g. `/product/rustic-table`, or `/` for the homepage.
 */
export function buildCountryAlternates(
  pathWithoutCountry: string,
  currentCountryCode: string,
  countries: Country[],
) {
  const normalized = pathWithoutCountry === '/' || pathWithoutCountry === ''
    ? ''
    : (pathWithoutCountry.startsWith('/') ? pathWithoutCountry : `/${pathWithoutCountry}`);

  const languages: Record<string, string> = {};
  for (const c of countries) {
    languages[c.locale || c.code] = `${SITE_URL}/${c.code.toLowerCase()}${normalized}`;
  }
  const defaultCode = getDefaultCountryCode(countries);
  if (defaultCode) {
    languages['x-default'] = `${SITE_URL}/${defaultCode.toLowerCase()}${normalized}`;
  }

  return {
    canonical: `${SITE_URL}/${currentCountryCode.toLowerCase()}${normalized}`,
    languages,
  };
}
