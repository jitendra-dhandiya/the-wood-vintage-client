/**
 * Which nav categories a shopper should see, for the gender they are browsing.
 *
 * The parent rule and the child rule differ on purpose:
 *
 *   Parent — UNISEX always shows, an explicit WOMEN/MEN shows only under that
 *   toggle, and an UNTAGGED parent shows to nobody. A top-level menu entry is
 *   a merchandising decision, so leaving it untagged is treated as "not ready"
 *   rather than "show it to everyone".
 *
 *   Child — the same, except an UNTAGGED child INHERITS its parent. Nobody
 *   tags every subcategory, and the parent has already answered the question.
 *   Without this the untagged children of a WOMEN category would all vanish.
 *
 * The bug this fixes: children were not filtered at all, so "Mens denim" was
 * listed under DENIM while the shopper was browsing WOMEN.
 */
export interface NavChildLike {
  gender?: string | null;
}

export interface NavCategoryLike<C extends NavChildLike = NavChildLike> {
  gender?: string | null;
  children?: C[] | null;
}

const norm = (value?: string | null) => (value || '').trim().toUpperCase();

const matches = (value: string | null | undefined, gender: string): boolean => {
  const g = norm(value);
  return g === 'UNISEX' || g === norm(gender);
};

export const visibleNavCategories = <C extends NavChildLike, T extends NavCategoryLike<C>>(
  categories: T[] | undefined | null,
  gender: string
): T[] =>
  (categories ?? [])
    .filter(cat => matches(cat.gender, gender))
    .map(cat => ({
      ...cat,
      // An untagged child inherits the parent that is already visible here.
      children: (cat.children ?? []).filter(
        child => !norm(child.gender) || matches(child.gender, gender)
      ),
    }));
