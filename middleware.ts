import { NextResponse, type NextRequest } from 'next/server';
import { legacyCategoryTarget } from './lib/legacyCategorySlugs';
import { API_URL as PUBLIC_API_URL } from './constants';

// Middleware talks to the API over a private loopback URL when INTERNAL_API_URL is set (build time; Next
// inlines env into middleware). Reason: nginx overwrites X-Forwarded-For with the CALLER's address, so a
// server-to-server call through the public URL arrives as the server's own IP and the geo lock would locate
// every visitor at the datacentre. Direct to the API, the visitor IP forwarded below is what it sees.
// Only middleware uses this: SSR/page code keeps the public URL, which must never leak into HTML.
const API_URL = process.env.INTERNAL_API_URL || PUBLIC_API_URL;
import { COUNTRY_COOKIE } from './lib/countryPreference';
import type { Country } from './types';

/**
 * Country lock (decision 0036, building on the phase-3 URL restructuring in
 * `docs/architecture/phase-3-url-restructuring-spec.md`).
 *
 * The visitor's market is decided by their LOCATION, never by the URL or a
 * cookie. For every storefront request this middleware:
 *   1. resolves the visitor's country via the backend `GET /geo/resolve`
 *      (offline GeoIP; forwards the client IP; cached ~60s per IP);
 *   2. if that country has an ENABLED market: `/<other>/...` -> 307 to the
 *      same path under the visitor's market; a request with no country segment
 *      gets one inserted;
 *   3. if it has NO enabled market: rewrites to `/not-available` (designed
 *      "not available in your region yet" page) — no wrong-market storefront;
 *   4. FAILS OPEN: geo service down/slow/unknown IP -> the default market, so
 *      an outage of the geo lookup never takes the shop down (documented risk:
 *      during an outage the lock is not enforced).
 *
 * Exempt: `/admin*`, `/admin-login`, `/account`, `/login`, `/register`, `/api`,
 * `/_next`, `/not-available`, static assets (via `matcher`), and search-engine
 * crawlers (by User-Agent — spoofable, documented) which keep the original
 * behaviour: any enabled `/<country>/` path is served as-is so hreflang and
 * indexing of every market keep working.
 *
 * `wv_country` is written as a derived hint only (see lib/countryPreference).
 * Non-production: `?__geo=US` (or the `__geo` cookie it sets) overrides the
 * visitor's location so behaviour is testable from one machine.
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

const CRAWLER_UA = /googlebot|adsbot-google|google-inspectiontool|bingbot|bingpreview|slurp|duckduckbot|baiduspider|yandexbot|applebot|facebookexternalhit|twitterbot|linkedinbot|pinterestbot|ia_archiver/i;
const isCrawler = (req: NextRequest) => CRAWLER_UA.test(req.headers.get('user-agent') ?? '');

const IS_PROD = process.env.NODE_ENV === 'production';

interface Geo { countryCode: string | null; lat: number | null; lng: number | null; source: string }

const GEO_TTL_MS = 60_000;
const GEO_FAIL_TTL_MS = 10_000;
const GEO_TIMEOUT_MS = 1500;
const geoCache = new Map<string, { geo: Geo | null; expiresAt: number }>();

/** The address the trusted hop in front of us saw — rightmost XFF entry, or x-real-ip. */
function clientIp(req: NextRequest): string {
  const real = req.headers.get('x-real-ip')?.trim();
  if (real) return real;
  const xff = (req.headers.get('x-forwarded-for') ?? '').split(',');
  return xff[xff.length - 1]?.trim() ?? '';
}

/** `null` = geo unavailable (caller fails open). */
async function resolveVisitorGeo(req: NextRequest, override: string | null): Promise<Geo | null> {
  const ip = clientIp(req);
  const cdn = req.headers.get('cf-ipcountry') ?? req.headers.get('x-vercel-ip-country') ?? '';
  const key = `${ip}|${cdn}|${override ?? ''}`;
  const hit = geoCache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.geo;

  let geo: Geo | null = null;
  try {
    const headers: Record<string, string> = {};
    if (ip) headers['x-forwarded-for'] = ip;
    const cdnCountry = req.headers.get('cf-ipcountry');
    if (cdnCountry) headers['cf-ipcountry'] = cdnCountry;
    const vercel = req.headers.get('x-vercel-ip-country');
    if (vercel) headers['x-vercel-ip-country'] = vercel;
    const qs = override ? `?__geo=${encodeURIComponent(override)}` : '';
    const res = await fetch(`${API_URL}/geo/resolve${qs}`, {
      cache: 'no-store', headers, signal: AbortSignal.timeout(GEO_TIMEOUT_MS),
    });
    if (res.ok) geo = (await res.json())?.data ?? null;
  } catch {
    geo = null; // fail open
  }
  if (geoCache.size > 5000) geoCache.clear();
  geoCache.set(key, { geo, expiresAt: Date.now() + (geo ? GEO_TTL_MS : GEO_FAIL_TTL_MS) });
  return geo;
}

/** Stamps the derived-hint cookie (and the non-prod dev override cookie) onto a response. */
function withHints(res: NextResponse, market: string | null, overrideToSet: string | null): NextResponse {
  if (market) {
    res.cookies.set(COUNTRY_COOKIE, market.toUpperCase(), { path: '/', sameSite: 'lax', maxAge: 60 * 60 * 24 });
  }
  if (overrideToSet) res.cookies.set('__geo', overrideToSet, { path: '/', sameSite: 'lax' });
  return res;
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
    '/((?!(?:admin|admin-login|account|login|register|api|_next|not-available)(?:/|$)|.*\\..*).*)',
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
  const isEnabledCode = (list: Country[], code?: string | null) =>
    !!code && list.some((c) => c.isEnabled && c.code.toUpperCase() === code.toUpperCase());

  const countries = await getEnabledCountries();
  const defaultCode = resolveDefaultCountryCode(countries);

  // Backend unreachable AND nothing cached: we cannot tell which markets exist,
  // so fail open rather than show a region page to everyone.
  if (countries.length === 0) {
    if (looksLikeCountryCode) return NextResponse.next();
    const url = req.nextUrl.clone();
    url.pathname = `/${[defaultCode.toLowerCase(), ...parts].join('/')}`;
    return NextResponse.redirect(url, 307);
  }

  // Search-engine crawlers: no lock — every enabled market path is served so
  // hreflang/indexing works. (UA is spoofable; a spoofer merely sees another
  // market's catalogue, which the backend still prices from its own rules.)
  if (isCrawler(req)) {
    if (looksLikeCountryCode && isEnabledCode(countries, first)) {
      return (await legacyCategoryRedirect(req, parts)) ?? NextResponse.next();
    }
    const url = req.nextUrl.clone();
    url.pathname = `/${[defaultCode.toLowerCase(), ...(looksLikeCountryCode ? parts.slice(1) : parts)].join('/')}`;
    return NextResponse.redirect(url, 307);
  }

  // Non-production location override, for testing from one machine.
  let override: string | null = null;
  let overrideToSet: string | null = null;
  if (!IS_PROD) {
    const q = req.nextUrl.searchParams.get('__geo');
    if (q && /^[A-Za-z]{2}$/.test(q)) { override = q.toUpperCase(); overrideToSet = override; }
    else {
      const c = req.cookies.get('__geo')?.value;
      if (c && /^[A-Za-z]{2}$/.test(c)) override = c.toUpperCase();
    }
  }

  const geo = await resolveVisitorGeo(req, override);
  // Fail open: no answer (or an unlocatable IP) -> the default market.
  const visitorCountry = (geo?.countryCode ?? defaultCode).toUpperCase();

  if (!isEnabledCode(countries, visitorCountry)) {
    // Located in a country we do not sell to (yet): designed region page, not a wrong storefront.
    // A redirect to the page's public URL, not a rewrite: behind nginx, Next builds request origins from its
    // own bind address (https://localhost:3000), and a rewrite to that origin is treated as an external proxy
    // and fails with a 500. The Host header is what the visitor actually used.
    const host = req.headers.get('host') ?? req.nextUrl.host;
    const proto = (req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')).split(',')[0];
    const target = new URL(`/not-available?c=${encodeURIComponent(visitorCountry)}`, `${proto}://${host}`);
    return withHints(NextResponse.redirect(target, 307), null, overrideToSet);
  }

  const market = visitorCountry.toLowerCase();
  if (looksLikeCountryCode && first.toLowerCase() === market) {
    const legacy = await legacyCategoryRedirect(req, parts);
    return withHints(legacy ?? NextResponse.next(), visitorCountry, overrideToSet);
  }

  // Wrong or missing country segment -> the same path under the visitor's market.
  const rest = looksLikeCountryCode ? parts.slice(1) : parts;
  const url = req.nextUrl.clone();
  url.pathname = `/${[market, ...rest].join('/')}`;
  return withHints(NextResponse.redirect(url, 307), visitorCountry, overrideToSet);
}
