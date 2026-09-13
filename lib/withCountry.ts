/**
 * Prefixes an internal storefront path with the current country segment.
 *
 * Every storefront link needs to stay under whichever country the shopper is
 * currently browsing (`/in/product/x`, `/ae/product/x`, ...) instead of
 * dropping back to a flat path that the country middleware would then have to
 * redirect a second time. Centralised here so the ~15 files that build these
 * links share one implementation instead of hand-writing
 * `` `/${country}${path}` `` everywhere — see
 * documentation/docs/architecture/phase-3-url-restructuring-spec.md.
 *
 * `country` is expected to already be resolved (from `useCountry()`, or a
 * page's own `params.country`) — this function does not itself guess or
 * validate one. When it isn't known yet (context still loading on first
 * paint, or a call site with no country in scope, e.g. the storefront
 * `not-found.tsx` boundary), the path is returned unprefixed; the country
 * middleware redirects a request like that to the resolved country's
 * equivalent path, so this degrades to one extra redirect rather than a
 * broken link.
 */
export function withCountry(path: string, country?: string | null): string {
  // Absolute/external URLs (an admin-authored quick link, say) pass through
  // untouched — prefixing "https://example.com" with a country segment would
  // turn it into a broken relative path, not a valid link.
  if (/^([a-z][a-z0-9+.-]*:)?\/\//i.test(path)) return path;

  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (!country) return normalized;
  return `/${country.toLowerCase()}${normalized}`;
}
