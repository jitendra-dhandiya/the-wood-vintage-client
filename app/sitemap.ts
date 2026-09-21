import type { MetadataRoute } from 'next';
import { SITE_URL } from '../constants';
import { getEnabledCountries } from '../lib/countries';

const BACKEND_API_URL = process.env.BACKEND_URL
  ? `${process.env.BACKEND_URL}/api/v1`
  : 'http://localhost:5000/api/v1';

const FETCH_OPTS = {
  next: { revalidate: 3600 },
  signal: AbortSignal.timeout(8000),
};

// Per country: a product switched off for a country must not be advertised
// under that country's URLs (the page 404s there).
async function getProducts(countryCode: string) {
  try {
    const qs = countryCode ? `&country=${encodeURIComponent(countryCode.toUpperCase())}` : '';
    const res = await fetch(`${BACKEND_API_URL}/products?limit=500&page=1${qs}`, FETCH_OPTS);
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

// Combos live at /<country>/combo/<slug> only where offered in that market (decision 0037).
async function getCombos(countryCode: string) {
  try {
    const qs = countryCode ? `?country=${encodeURIComponent(countryCode.toUpperCase())}&limit=48` : '?limit=48';
    const res = await fetch(`${BACKEND_API_URL}/combos${qs}`, FETCH_OPTS);
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

async function getCategories() {
  try {
    const res = await fetch(`${BACKEND_API_URL}/categories`, FETCH_OPTS);
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

async function getBlogs() {
  try {
    const res = await fetch(`${BACKEND_API_URL}/blogs?limit=100`, FETCH_OPTS);
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

async function getCollections() {
  try {
    const res = await fetch(`${BACKEND_API_URL}/collections`, FETCH_OPTS);
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

async function getArtisans() {
  try {
    const res = await fetch(`${BACKEND_API_URL}/artisans`, FETCH_OPTS);
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

async function getMaterials() {
  try {
    const res = await fetch(`${BACKEND_API_URL}/materials`, FETCH_OPTS);
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

async function getRooms() {
  try {
    const res = await fetch(`${BACKEND_API_URL}/rooms`, FETCH_OPTS);
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

async function getStyles() {
  try {
    const res = await fetch(`${BACKEND_API_URL}/styles`, FETCH_OPTS);
    const json = await res.json();
    return json.data || [];
  } catch { return []; }
}

/**
 * Every storefront page now lives at `/<country>/...`
 * (`docs/architecture/phase-3-url-restructuring-spec.md`), so the sitemap
 * needs one URL per (page × enabled country), not one flat list — multiply,
 * don't replace. At today's catalog size (single-digit country count, a few
 * hundred products) this is still one file; a sitemap index (one file per
 * country) is the documented follow-up once that stops being true, not done
 * here (`0004`'s "Consequences" already flagged this).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, blogs, collections, artisans, materials, rooms, styles, countries] = await Promise.all([
    getCategories(), getBlogs(), getCollections(), getArtisans(),
    getMaterials(), getRooms(), getStyles(), getEnabledCountries(),
  ]);

  // Falls back to a bare, unprefixed sitemap (today's pre-restructuring shape)
  // if the countries endpoint is unreachable — better than an empty sitemap.
  const codes = countries.length ? countries.map((c) => c.code.toLowerCase()) : [''];
  const prefixOf = (code: string) => (code ? `/${code}` : '');
  const productsByCountry = new Map<string, any[]>(
    await Promise.all(codes.map(async (c) => [c, await getProducts(c)] as [string, any[]])),
  );

  const combosByCountry = new Map<string, any[]>(
    await Promise.all(codes.map(async (c) => [c, await getCombos(c)] as [string, any[]])),
  );

  const sitemap: MetadataRoute.Sitemap = [];

  for (const code of codes) {
    const base = `${SITE_URL}${prefixOf(code)}`;

    sitemap.push(
      { url: base || SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
      { url: `${base}/shop`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
      { url: `${base}/combos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.6 },
      { url: `${base}/collections`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
      { url: `${base}/artisans`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
      { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
      { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${base}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    );

    for (const cb of combosByCountry.get(code) ?? []) {
      sitemap.push({ url: `${base}/combo/${cb.slug}`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 });
    }

    for (const p of productsByCountry.get(code) ?? []) {
      sitemap.push({
        url: `${base}/product/${p.slug}`,
        lastModified: new Date(p.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }

    for (const c of categories) {
      sitemap.push({
        url: `${base}/category/${c.slug}`,
        lastModified: new Date(c.updatedAt),
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }

    for (const col of collections) {
      sitemap.push({
        url: `${base}/collections/${col.slug}`,
        lastModified: new Date(col.updatedAt || Date.now()),
        changeFrequency: 'daily',
        priority: 0.7,
      });
    }

    for (const a of artisans) {
      sitemap.push({
        url: `${base}/artisans/${a.id}`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.5,
      });
    }

    for (const m of materials) {
      sitemap.push({
        url: `${base}/material/${m.slug}`,
        lastModified: new Date(m.updatedAt || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }

    for (const r of rooms) {
      sitemap.push({
        url: `${base}/room/${r.slug}`,
        lastModified: new Date(r.updatedAt || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }

    for (const s of styles) {
      sitemap.push({
        url: `${base}/style/${s.slug}`,
        lastModified: new Date(s.updatedAt || Date.now()),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }

    for (const b of blogs) {
      sitemap.push({
        url: `${base}/blog/${b.slug}`,
        lastModified: new Date(b.updatedAt),
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  return sitemap;
}
