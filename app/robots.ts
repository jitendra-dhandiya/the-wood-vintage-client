import type { MetadataRoute } from 'next';
import { SITE_URL } from '../constants';

/**
 * `admin`/`account`/`api` are still unprefixed top-level paths after the
 * phase-3 URL restructuring (`docs/architecture/phase-3-url-restructuring-spec.md`
 * — `0004` deliberately kept them out of the country segment), so those three
 * rules are untouched. `checkout`/`cart` moved *into* the country segment
 * along with the rest of the storefront (`/checkout/` is now `/in/checkout/`,
 * `/ae/checkout/`, ...), so a bare `/checkout/` rule would no longer match
 * anything and those pages would go from disallowed to crawlable by accident.
 * `MetadataRoute.Robots`'s `disallow` is a plain string handed straight to
 * robots.txt, and both Google and Bing support the `*` wildcard there, so
 * `/*` + `/checkout/` matches every country's equivalent path without
 * enumerating the country list here.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/account/', '/api/', '/*/checkout/', '/*/cart/'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
