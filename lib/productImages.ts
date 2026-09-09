/**
 * How a product's shots are presented against the colour a customer picks.
 *
 * The first version of this hid every image that was not the chosen colour.
 * It answered "which photos are of this colour", but at the cost of the
 * question shoppers actually ask first — "how many photos are there at all".
 * A four-shot product looked like a two-shot product, and the other two only
 * existed if you happened to click the other colour.
 *
 * So the gallery now shows the whole set, always, and the colour is expressed
 * by GROUPING instead: the shots are laid out in labelled runs, one per colour,
 * and the chosen colour's run is the one that is highlighted. Nothing is
 * hidden, and it is still obvious which two shots belong to which colour.
 *
 * Matching is case- and space-insensitive because the colour is typed by hand
 * in two different places: on the variant and on the image.
 */
export interface GalleryImage {
  url: string;
  altText?: string | null;
  color?: string | null;
}

export interface GalleryGroup<T> {
  /** null for shots the admin left untagged — the product's default set. */
  color: string | null;
  images: T[];
  /** Index of each image in the flat gallery, so a click can address it. */
  indices: number[];
}

const key = (value?: string | null) => (value || '').trim().toLowerCase();

export const sameColor = (a?: string | null, b?: string | null) =>
  !!key(a) && key(a) === key(b);

/**
 * Every image, in catalogue order. The gallery is no longer filtered by
 * colour — see the note above — so this is deliberately a passthrough that
 * exists to keep one place responsible for the gallery's shape.
 */
export const galleryFor = <T extends GalleryImage>(images: T[] | undefined | null): T[] =>
  images ?? [];

/**
 * The gallery split into labelled colour runs.
 *
 * Order follows first appearance in the catalogue, NOT the selection — a strip
 * that reorders itself under the cursor every time a colour is clicked is
 * disorienting, and the labels already say which run is which. Untagged shots
 * always come last: they belong to no colour in particular, so they read as the
 * tail of the set rather than the head of it.
 */
export const groupGalleryByColor = <T extends GalleryImage>(
  images: T[] | undefined | null
): GalleryGroup<T>[] => {
  const all = images ?? [];
  const groups: GalleryGroup<T>[] = [];
  const byKey = new Map<string, GalleryGroup<T>>();
  const untagged: GalleryGroup<T> = { color: null, images: [], indices: [] };

  all.forEach((img, index) => {
    const k = key(img.color);
    if (!k) {
      untagged.images.push(img);
      untagged.indices.push(index);
      return;
    }
    let group = byKey.get(k);
    if (!group) {
      // The label shown is the one on the image, spelling and casing intact.
      group = { color: (img.color || '').trim(), images: [], indices: [] };
      byKey.set(k, group);
      groups.push(group);
    }
    group.images.push(img);
    group.indices.push(index);
  });

  if (untagged.images.length) groups.push(untagged);
  return groups;
};

/**
 * Where the gallery should jump when a colour is chosen: that colour's first
 * shot, or -1 when it has none of its own. -1 is the two-colours-one-photoshoot
 * case, and it means "leave the customer where they are" — jumping to an
 * unrelated image would be worse than not moving.
 */
export const firstIndexOfColor = (
  images: GalleryImage[] | undefined | null,
  color?: string | null
): number => {
  if (!key(color)) return -1;
  return (images ?? []).findIndex(img => sameColor(img.color, color));
};

/** Colours that actually have their own shots — used to hint it in the admin. */
export const colorsWithImages = (images: GalleryImage[] | undefined | null): string[] => [
  ...new Set((images ?? []).map(img => (img.color || '').trim()).filter(Boolean)),
];
