import { SITE_URL } from '../constants';

/**
 * Work out where a banner should send the shopper, and how.
 *
 * Admins have been pasting absolute URLs pointing at this very site —
 * "https://theuniquedressup.com/category/…" — because the admin form used to
 * reject "/category/…" outright. Treating those as external would open the
 * shop's own pages in a new tab and drop out of the SPA router, so a
 * same-origin absolute URL is folded back to a path.
 *
 * Returns null when there is nothing to link to, which is how a banner stays
 * deliberately unclickable.
 */
export interface BannerTarget {
  href: string;
  external: boolean;
}

const hostOf = (url: string): string | null => {
  try {
    return new URL(url).host.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
};

export const resolveBannerLink = (
  link?: string | null,
  currentHost?: string
): BannerTarget | null => {
  const raw = (link || '').trim();
  if (!raw) return null;

  // Protocol-relative: the host is whatever the page happens to be on, which
  // is not something a banner should decide. Treated as unset.
  if (raw.startsWith('//')) return null;

  if (raw.startsWith('/')) return { href: raw, external: false };

  if (!/^https?:\/\//i.test(raw)) return null;   // mailto:, javascript:, junk

  const linkHost = hostOf(raw);
  if (!linkHost) return null;

  const ownHosts = new Set(
    [hostOf(SITE_URL), currentHost?.toLowerCase().replace(/^www\./, '')].filter(Boolean) as string[]
  );

  if (ownHosts.has(linkHost)) {
    // Same site: keep the path so navigation stays client-side.
    try {
      const u = new URL(raw);
      return { href: `${u.pathname}${u.search}${u.hash}` || '/', external: false };
    } catch {
      return { href: raw, external: true };
    }
  }

  return { href: raw, external: true };
};
