/**
 * The blog API returns `image`, `metaTitle`/`metaDesc`, `blogCategory` and
 * `authorName`; the storefront components were written against `coverImage`,
 * `seoMeta`, `category` and `author`. Normalise once here so both shapes work.
 */
export function normalizeBlog(b: any) {
  if (!b) return b;
  return {
    ...b,
    coverImage: b.coverImage || b.image || null,
    category: b.category || b.blogCategory?.name || null,
    seoMeta: b.seoMeta || { metaTitle: b.metaTitle, metaDescription: b.metaDesc },
    author: b.author || (b.authorName ? { firstName: b.authorName, lastName: '' } : null),
  };
}
