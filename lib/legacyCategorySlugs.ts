/**
 * Slugs a category used to be reachable at, and where it lives now.
 *
 * Four categories were renamed at some point without their slug following, so
 * the URL behind each read as a different department entirely — the denim page
 * was indexed by Google as "hoodies-sweatshirts", which spends the site's
 * ranking on a word nobody searching for jeans will type.
 *
 * Renaming a slug changes a public URL, so every old one has to keep working:
 * inbound links, anything already indexed, and any bookmark a customer kept.
 *
 * WHY THIS IS A LOOKUP AND NOT A `redirects()` ENTRY IN next.config:
 *
 * A config redirect fires before anything is fetched, so the moment it ships it
 * sends `/category/streetwear` to `/category/shirts` whether or not the rename
 * has actually happened in the database. Slugs are edited in the admin, which
 * is a different act at a different time from a deploy — so for however long
 * the two are out of step, a config redirect points a working URL at a 404.
 *
 * Consulting this map only after a slug has been found to resolve to nothing
 * removes the ordering problem completely. Before the rename the old slug still
 * loads a category and the map is never reached; after it, the old slug misses
 * and the map forwards it. Neither state can break, and they can be deployed
 * and renamed in either order.
 */
export const LEGACY_CATEGORY_SLUGS: Readonly<Record<string, string>> = {
  'hoodies-sweatshirts': 'denims',            // DENIM
  'accessories':         'pants-and-trousers', // Pants and Trousers
  'streetwear':          'shirts',             // Shirts
  'oversized-t-shirts':  'unisex-t-shirts',    // Unisex T-Shirts
};

/**
 * Where a retired slug now points, or null if it was never one of ours.
 *
 * Case-folded because a slug that reaches us in mixed case is still the same
 * page, and a redirect is cheaper than a 404.
 */
export const legacyCategoryTarget = (slug: string): string | null =>
  LEGACY_CATEGORY_SLUGS[slug.trim().toLowerCase()] ?? null;
