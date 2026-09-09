/**
 * Turn what an admin types into a list of sizes.
 *
 * Adding a size at a time is the slowest part of creating a product: a denim
 * line carries six waists per colour, so a two-colour product meant twelve
 * separate clicks before a single stock figure had been entered.
 *
 * Accepts a comma-separated list ("26, 28, 30") and a numeric range
 * ("26-36"), which is how waist runs are actually written. A range between two
 * even numbers steps by 2 — "26-36" means the six waists a shop stocks, not
 * eleven including the odd ones nobody makes.
 *
 * Whitespace deliberately does NOT separate. "Free Size" and "One Size" are
 * single sizes with a space in them, and splitting on spaces turned every one
 * of them into two nonsense entries. Commas, slashes, semicolons and newlines
 * separate; anything else is part of the label.
 */
export const parseSizeInput = (raw: string): string[] => {
  const text = (raw || '').trim();
  if (!text) return [];

  const out: string[] = [];
  const push = (value: string) => {
    const v = value.trim();
    // Case-insensitive, because "s" and "S" are the same size to a shopper.
    if (v && !out.some(existing => existing.toLowerCase() === v.toLowerCase())) out.push(v);
  };

  for (const chunk of text.split(/[,;/\n]+/).map(c => c.trim()).filter(Boolean)) {
    const range = chunk.match(/^(\d+)\s*[-–]\s*(\d+)$/);
    if (range) {
      const from = Number(range[1]);
      const to = Number(range[2]);
      if (Number.isFinite(from) && Number.isFinite(to) && from < to && to - from <= 60) {
        // Both ends even means a waist run, which goes up in twos. "30-32"
        // is 30 and 32 — never 30, 31, 32.
        const step = from % 2 === 0 && to % 2 === 0 ? 2 : 1;
        for (let n = from; n <= to; n += step) push(String(n));
        continue;
      }
    }
    push(chunk);
  }
  return out;
};

/** The runs a fashion catalogue actually stocks, as one-click sets. */
export const SIZE_PRESETS: { label: string; sizes: string[] }[] = [
  { label: 'XS – XXL', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { label: 'S – XL', sizes: ['S', 'M', 'L', 'XL'] },
  { label: 'Waist 26 – 36', sizes: ['26', '28', '30', '32', '34', '36'] },
  { label: 'Waist 28 – 34', sizes: ['28', '30', '32', '34'] },
  { label: 'Free Size', sizes: ['Free Size'] },
];
