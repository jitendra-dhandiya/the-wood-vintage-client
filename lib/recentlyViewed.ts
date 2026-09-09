/**
 * The shopper's own recently-viewed products, kept in their browser.
 *
 * A "recently viewed" row is the least manipulative thing on a product page:
 * it shows the visitor what THEY looked at, which is genuinely useful when
 * comparing two items — the most common reason someone leaves a product page
 * and comes back.
 *
 * localStorage rather than the account, deliberately. It works for signed-out
 * visitors, who are most of them, and it means browsing history for a guest
 * never leaves their device. The backend has a RecentlyViewed table for
 * signed-in users; this does not touch it.
 */
export interface ViewedProduct {
  id: string;
  slug: string;
  name: string;
  image?: string | null;
  basePrice: number;
  salePrice?: number | null;
  viewedAt: number;
}

const KEY = 'ud_recently_viewed';
const LIMIT = 12;

const read = (): ViewedProduct[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(p => p && p.slug && p.name) : [];
  } catch {
    // A corrupt or unavailable store must never break a product page.
    return [];
  }
};

export const getRecentlyViewed = (excludeSlug?: string): ViewedProduct[] =>
  read()
    .filter(p => p.slug !== excludeSlug)
    .sort((a, b) => (b.viewedAt || 0) - (a.viewedAt || 0));

export const recordView = (product: Omit<ViewedProduct, 'viewedAt'>): void => {
  if (typeof window === 'undefined' || !product?.slug) return;
  try {
    // Re-viewing moves an item to the front rather than duplicating it.
    const next = [
      { ...product, viewedAt: Date.now() },
      ...read().filter(p => p.slug !== product.slug),
    ].slice(0, LIMIT);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Private browsing and full quotas both throw here; neither is worth
    // interrupting the page for.
  }
};
