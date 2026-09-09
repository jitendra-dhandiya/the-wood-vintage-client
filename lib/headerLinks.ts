/**
 * The fixed links in the header bar and at the top of the mobile drawer —
 * New In, Collections, Sale, Blog.
 *
 * They were a constant in the storefront bundle, so renaming one meant a
 * deploy. They now come from the same `nav_menus` table as the mega menu's
 * quick links, whose `position` column was left open precisely so a header
 * menu could reuse it without a migration.
 *
 * Two positions rather than one, because the bar is not a flat list: the Shop
 * mega-menu trigger sits between them, second from the left, where shoppers
 * look for it. `header_before` renders to its left, `header_after` to its
 * right. The mobile drawer has no such trigger and lists both runs together,
 * before first — which is exactly the order they had when they were constants.
 */

export interface HeaderLink {
  id?: string;
  label: string;
  href: string;
  gender?: string | null;
}

export const HEADER_BEFORE = 'header_before';
export const HEADER_AFTER  = 'header_after';

/** Human labels for the admin's menu picker. */
export const HEADER_POSITIONS = [
  { value: HEADER_BEFORE, label: 'Header — left of Shop' },
  { value: HEADER_AFTER,  label: 'Header — right of Shop' },
] as const;

/**
 * Used only while the admin has configured nothing at that position.
 *
 * Same contract as the mega menu's quick links: the fallback is applied BEFORE
 * the gender filter, so an admin who targets every header link at MEN gets an
 * empty run under WOMEN rather than these quietly reappearing. Keeping a
 * fallback at all means a fresh install — or a table someone emptied — still
 * has a usable header.
 */
export const DEFAULT_HEADER_BEFORE: HeaderLink[] = [
  { label: 'New In', href: '/shop?isNewArrival=true' },
];

export const DEFAULT_HEADER_AFTER: HeaderLink[] = [
  { label: 'Collections', href: '/collections' },
  { label: 'Sale',        href: '/shop?discount=true' },
  { label: 'Blog',        href: '/blog' },
];

export const defaultsFor = (position: string): HeaderLink[] =>
  position === HEADER_BEFORE ? DEFAULT_HEADER_BEFORE
  : position === HEADER_AFTER ? DEFAULT_HEADER_AFTER
  : [];

/** API rows carry `url`; the components want `href`. Rows without one are dropped. */
export const fromApi = (rows?: { id?: string; label?: string; url?: string | null; gender?: string | null }[] | null): HeaderLink[] =>
  (rows ?? [])
    .filter(r => !!r && !!(r.label || '').trim() && !!(r.url || '').trim())
    .map(r => ({
      id: r.id,
      label: (r.label as string).trim(),
      href: (r.url as string).trim(),
      gender: r.gender ?? 'ALL',
    }));

export const resolveHeaderLinks = (links: HeaderLink[] | null | undefined, position: string): HeaderLink[] =>
  links && links.length ? links : defaultsFor(position);

/** A link tagged ALL shows on both storefronts; WOMEN/MEN show only on theirs. */
export const visibleHeaderLinks = (links: HeaderLink[], gender: string): HeaderLink[] =>
  links.filter(link => {
    const g = (link.gender || 'ALL').trim().toUpperCase();
    return g === 'ALL' || g === (gender || '').trim().toUpperCase();
  });
