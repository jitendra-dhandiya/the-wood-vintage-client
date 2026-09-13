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

async function getProducts() {
  try {
    const res = await fetch(`${BACKEND_API_URL}/products?limit=500&page=1`, FETCH_OPTS);
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
  const [products, categories, blogs, countries] = await Promise.all([
    getProducts(), getCategories(), getBlogs(), getEnabledCountries(),
  ]);

  // Falls back to a bare, unprefixed sitemap (today's pre-restructuring shape)
  // if the countries endpoint is unreachable — better than an empty sitemap.
  const codes = countries.length ? countries.map((c) => c.code.toLowerCase()) : [''];
  const prefixOf = (code: string) => (code ? `/${code}` : '');

  const sitemap: MetadataRoute.Sitemap = [];

  for (const code of codes) {
    const base = `${SITE_URL}${prefixOf(code)}`;

    sitemap.push(
      { url: base || SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
      { url: `${base}/shop`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
      { url: `${base}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
      { url: `${base}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
      { url: `${base}/faq`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    );

    for (const p of products) {
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
