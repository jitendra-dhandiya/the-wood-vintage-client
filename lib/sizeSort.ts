/**
 * Ordering for the size row on a product page.
 *
 * Sizes arrive in whatever order the admin happened to type them — 34, 28, 32,
 * 30, 22, 24, 26 on the live catalogue — because they are read straight off the
 * variant rows. A shopper scans that row looking for one value, so it has to
 * read the way a size run reads on a label: smallest first.
 *
 * The catalogue mixes two vocabularies (waist numbers and letter sizes) and
 * neither sorts correctly as plain text: "10" lands before "8", and "S" before
 * "XS". So each label is classified first, then compared within its kind.
 *
 * Groups are kept apart deliberately. A product carrying both letters and
 * numbers is rare, but when it happens "S, M, L, 28, 30" is far easier to read
 * than the two runs interleaved.
 */

/** Letter sizes, smallest first. Index in this list IS the sort key. */
const LETTER_ORDER = ['XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'XXXXL'];

/** "2XL" and "XXL" are the same size typed two ways. */
const expandMultiplier = (value: string): string => {
  const m = value.match(/^([2-6])\s*X\s*(S|L)$/);
  if (!m) return value;
  return 'X'.repeat(Number(m[1])) + m[2];
};

// Spaces, underscores and hyphens are noise ("X S", "X-S"); the decimal point
// is not — stripping it turned shoe size 7.5 into 75.
const normalise = (raw: string): string =>
  expandMultiplier((raw || '').trim().toUpperCase().replace(/[\s_-]+/g, ''));

/**
 * A number if the whole label is one, allowing a trailing unit a shop might
 * type ("32W", '32"', "32 inch"). Returns null for anything else, so "Free
 * Size" and "One Size" are never mistaken for a measurement.
 */
const numericValue = (label: string): number | null => {
  const m = label.match(/^(\d+(?:\.\d+)?)(W|IN|INCH|INCHES|CM|")?$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
};

/** Lower group sorts first: letters, then numbers, then everything else. */
const groupOf = (label: string): number => {
  if (LETTER_ORDER.includes(label)) return 0;
  if (numericValue(label) !== null) return 1;
  return 2;
};

export const compareSizes = (a: string, b: string): number => {
  const A = normalise(a);
  const B = normalise(b);

  const groupA = groupOf(A);
  const groupB = groupOf(B);
  if (groupA !== groupB) return groupA - groupB;

  if (groupA === 0) return LETTER_ORDER.indexOf(A) - LETTER_ORDER.indexOf(B);
  if (groupA === 1) return (numericValue(A) as number) - (numericValue(B) as number);

  // Unrecognised labels ("Free Size", "One Size", "Plus"): alphabetical, which
  // at least makes the row stable rather than arbitrary.
  return A.localeCompare(B);
};

/** Ascending copy — never sorts the caller's array in place. */
export const sortSizes = <T extends string | null | undefined>(sizes: T[]): T[] =>
  [...sizes].sort((a, b) => compareSizes(a || '', b || ''));
