import { NextResponse, type NextRequest } from 'next/server';
import { legacyCategoryTarget } from './lib/legacyCategorySlugs';
import { API_URL } from './constants';
import { COUNTRY_COOKIE, guessCountryFromAcceptLanguage } from './lib/countryPreference';
import type { Country } from './types';

/**
 * Country-prefix resolution for the phase-3 URL restructuring
 * (`documentation/docs/architecture/phase-3-url-restructuring-spec.md`),
 * composed with the pre-existing wishlist/category-slug redirects below —
 * see that spec's "Middleware — CORRECTION" section for exactly why this is
 * additive to the existing file, not a replacement of it.
 *
 * Every storefront path now lives under `/<country>/...`. This function:
 *   - passes a request straight through when its first path segment is
 *     already a valid, *enabled* `Country.code`;
 *   - otherwise resolves one (cookie → `Accept-Language` region → the
 *     enabled list's `isDefault` row) and redirects to the same path under
 *     that country — replacing the first segment if it merely *looked* like
 *     a country code (invalid, or a real-but-disabled one), or inserting a
 *     new first segment if there wasn't one at all (a flat legacy URL, or
 *     `/`).
 *
 * `/admin`, `/admin-login`, `/account`, `/login`, `/register`, `/api`, `/_next`, and static
 * assets are excluded entirely via `matcher` below — they're session-scoped
 * or non-page paths with no SEO value from a URL-level country signal.
 */

interface CountriesCache {
  data: Country[];
  expiresAt: number;
}

// Module-scope — persists across requests handled by the same middleware
// worker instance. Cold starts/new instances just refetch; a short TTL is
// all this dev/local-scale deployment needs (per the spec), not a durable
// cache.
let countriesCache: CountriesCache | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

async function getEnabledCountries(): Promise<Country[]> {
  if (countriesCache && countriesCache.expiresAt > Date.now()) {
    return countriesCache.data;
  }
  try {
    const res = await fetch(`${API_URL}/countries`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`countries fetch failed: ${res.status}`);
    const json = await res.json();
    const data: Country[] = json?.data ?? [];
    countriesCache = { data, expiresAt: Date.now() + CACHE_TTL_MS };
    return data;
  } catch {
    // Backend hiccup — prefer a stale cache over breaking every storefront
    // request; if there's no cache at all yet, there is nothing safe to
    // resolve, so callers get an empty list and fall back to 'IN' below.
    return countriesCache?.data ?? [];
  }
}

/** Last-resort fallback when the backend has no enabled countries to offer at all. */
const HARD_FALLBACK_COUNTRY = 'IN';

/** Whichever enabled country is marked `isDefault`, or the first enabled one. */
function resolveDefaultCountryCode(countries: Country[]): string {
  const defaultCandidate = countries.find((c) => c.isEnabled && c.isDefault)?.code;
  if (defaultCandidate) return defaultCandidate.toUpperCase();
  return countries[0]?.code?.toUpperCase() ?? HARD_FALLBACK_COUNTRY;
}

/**
 * Full tiered resolution — used only when the URL carries no country segment
 * at all (a flat legacy URL, or `/`). `wv_country` cookie → `Accept-Language`
 * region → the enabled list's default row.
 */
function resolveCountryCode(req: NextRequest, countries: Country[]): string {
  const isEnabled = (code?: string | null) =>
    !!code && countries.some((c) => c.isEnabled && c.code.toUpperCase() === code.toUpperCase());

  const cookieCandidate = req.cookies.get(COUNTRY_COOKIE)?.value;
  if (isEnabled(cookieCandidate)) return cookieCandidate!.toUpperCase();

  const localeCandidate = guessCountryFromAcceptLanguage(req.headers.get('accept-language'));
  if (isEnabled(localeCandidate)) return localeCandidate!.toUpperCase();

  return resolveDefaultCountryCode(countries);
}

/**
 * The pre-existing renamed-category-slug redirect, now firing against
 * `/<country>/category/<slug>` instead of `/category/<slug>` — the slug is
 * at segment index 2 of `parts` (`['in', 'category', 'slug']`), not index 1,
 * because the country segment shifts everything one to the right. Untouched
 * otherwise: same lookup, same "ask the API first" guard, same 301.
 */
async function legacyCategoryRedirect(
  req: NextRequest,
  parts: string[],
): Promise<NextResponse | null> {
  if (parts[1] !== 'category') return null;
  const slug = parts[2] ?? '';
  const moved = legacyCategoryTarget(slug);
  if (!moved) return null;

  try {
    const res = await fetch(`${API_URL}/categories/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    // Still a real category under its old name — leave it alone.
    if (res.ok) return null;
  } catch {
    // The API being unreachable is not evidence the slug was retired.
    return null;
  }

  const url = req.nextUrl.clone();
  url.pathname = `/${[parts[0], 'category', moved, ...parts.slice(3)].join('/')}`;
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: [
    // Everything except /admin, /account, /login, /register, /api, /_next,
    // and anything that looks like a static asset (has a "." in its last
    // segment — favicon.ico, robots.txt, sitemap.xml, images, fonts, ...).
    '/((?!(?:admin|admin-login|account|login|register|api|_next)(?:/|$)|.*\\..*).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The wishlist used to live at /wishlist while every link in the site
  // chrome pointed at /account/wishlist, so the page existed and nothing
  // could reach it. It now lives with the rest of the account, and the old
  // path forwards for anyone who bookmarked it. Bare, unprefixed — /wishlist
  // was never a (store) route and never will be country-prefixed.
  if (pathname === '/wishlist') {
    const url = req.nextUrl.clone();
    url.pathname = '/account/wishlist';
    return NextResponse.redirect(url, 301);
  }

  const parts = pathname.split('/').filter(Boolean); // '/in/category/x' -> ['in','category','x']
  const first = parts[0] ?? '';
  const looksLikeCountryCode = /^[A-Za-z]{2}$/.test(first);

  const countries = await getEnabledCountries();

  if (looksLikeCountryCode && countries.some(
    (c) => c.isEnabled && c.code.toUpperCase() === first.toUpperCase(),
  )) {
    // Valid, enabled — pass through, but still subject to the legacy
    // category-slug forwarding below.
    const legacy = await legacyCategoryRedirect(req, parts);
    return legacy ?? NextResponse.next();
  }

  // Two distinct cases, resolved differently per the spec:
  //   - No country segment at all (flat legacy URL, or `/`) → full tiered
  //     resolution (cookie → Accept-Language → default).
  //   - The first segment *looks* like a country code but isn't in the
  //     enabled list. The public `/countries` endpoint only ever returns
  //     enabled rows, so middleware has no way to tell "not a real country"
  //     (`/xx/...`) apart from "a real, currently-disabled one"
  //     (`/ae/...` while AE is off) — both look identical from here. Both go
  //     straight to the resolved *default* country rather than reinterpreting
  //     via cookie/locale, matching the spec's explicit rule for the
  //     disabled case and extending it to the indistinguishable invalid one.
  const resolved = (looksLikeCountryCode
    ? resolveDefaultCountryCode(countries)
    : resolveCountryCode(req, countries)
  ).toLowerCase();
  const rest = looksLikeCountryCode ? parts.slice(1) : parts;
  const url = req.nextUrl.clone();
  url.pathname = `/${[resolved, ...rest].join('/')}`;
  return NextResponse.redirect(url, 307);
}
