/**
 * Size / Dimensions vocabulary for a handicraft and wooden-furniture catalogue
 * (decision 0039).
 *
 * A variant's "size" is ONE display string (`ProductVariant.size`). It is the
 * only thing stored, so no schema change is needed and every existing variant
 * stays valid. The string can be:
 *
 *   - a named size            "Queen", "Medium", "Set of 4", "6-Seater"
 *   - a named size + dims     "Queen (5×6.5 ft)", "Medium (90 × 40 × 85 cm)"
 *   - dimensions only         "60 × 40 × 75 cm", "Ø 45 cm"
 *   - a capacity              "500 ml", "1 L"
 *   - anything else the owner types
 *
 * Structured dimensions are DERIVED from that string by `parseSizeLabel`, so
 * the admin form can re-open a saved label in the dimension builder and the
 * storefront can show "152 × 198 cm · 60 × 78 in" without a second source of
 * truth. Everything here is pure (no imports), so it is unit-testable in node.
 */

export type Unit = 'cm' | 'in' | 'ft';

export interface Dims {
  /** Up to three measurements in the order the label lists them. */
  values: number[];
  /** Diameter (rendered "Ø 45 cm") — only meaningful with one value. */
  round?: boolean;
  unit: Unit;
}

export interface ParsedSize {
  /** The named part, without dimensions: "Queen", "6-Seater". */
  name: string;
  dims: Dims | null;
  /** Optional shipping weight typed after the dimensions. */
  weightKg: number | null;
  /** Capacity in millilitres ("500 ml", "1 L"), when the label is one. */
  capacityMl: number | null;
}

export const MAX_SIZE_LABEL = 60;
const UNIT_CM: Record<Unit, number> = { cm: 1, in: 2.54, ft: 30.48 };

/* ───────────────────────── formatting ───────────────────────── */

/** 2 decimals at most, no trailing zeros: 6.50 -> "6.5", 60 -> "60". */
export const fmtNum = (n: number): string => String(Math.round(n * 100) / 100);

export const formatDims = (d: Dims): string => {
  const body = d.values.map(fmtNum).join(' × ');
  return `${d.round && d.values.length === 1 ? 'Ø ' : ''}${body} ${d.unit}`;
};

/**
 * Build the string that is saved and shown. Named size + dims read as
 * "Queen (5 × 6.5 ft)"; dims alone as "60 × 40 × 75 cm".
 */
export const buildSizeLabel = (p: { name?: string; dims?: Dims | null; weightKg?: number | null }): string => {
  const name = (p.name || '').trim().replace(/\s+/g, ' ');
  const dims = p.dims && p.dims.values.length ? formatDims(p.dims) : '';
  let out = name && dims ? `${name} (${dims})` : name || dims;
  if (p.weightKg && p.weightKg > 0) out += ` · ${fmtNum(p.weightKg)} kg`;
  return out;
};

/* ───────────────────────── parsing ───────────────────────── */

const NUM = '(\\d+(?:\\.\\d+)?)';
const UNIT_RE = '(cm|centimet(?:er|re)s?|in|inch(?:es)?|ft|feet|foot|"|\'|”|″)';
// 1-3 numbers separated by ×/x/X/*, optional diameter marker, optional unit.
const DIMS_RE = new RegExp(
  `(Ø|⌀|dia\\.?|diameter)?\\s*${NUM}(?:\\s*[x×X*]\\s*${NUM})?(?:\\s*[x×X*]\\s*${NUM})?\\s*${UNIT_RE}?`,
  'i',
);

const toUnit = (raw?: string): Unit | null => {
  if (!raw) return null;
  const u = raw.toLowerCase();
  if (u.startsWith('cm') || u.startsWith('centi')) return 'cm';
  if (u === 'in' || u.startsWith('inch') || u === '"' || u === '”' || u === '″') return 'in';
  if (u === 'ft' || u.startsWith('feet') || u === 'foot' || u === "'") return 'ft';
  return null;
};

const CAPACITY_RE = /^(\d+(?:\.\d+)?)\s*(ml|millilit(?:er|re)s?|l|lit(?:er|re)s?)$/i;

const WEIGHT_RE = /[·,;\-–]\s*(\d+(?:\.\d+)?)\s*kg\s*$/i;

export const parseSizeLabel = (raw: string | null | undefined): ParsedSize => {
  let text = (raw || '').trim().replace(/\s+/g, ' ');
  const out: ParsedSize = { name: text, dims: null, weightKg: null, capacityMl: null };
  if (!text) return out;

  const w = text.match(WEIGHT_RE);
  if (w) {
    out.weightKg = Number(w[1]);
    text = text.slice(0, w.index).trim();
    out.name = text;
  }

  const cap = text.match(CAPACITY_RE);
  if (cap) {
    const n = Number(cap[1]);
    out.capacityMl = cap[2].toLowerCase().startsWith('m') ? n : n * 1000;
    return out;
  }

  // Dimensions live in the parentheses when there are any, otherwise the whole label.
  const paren = text.match(/\(([^)]*)\)/);
  const scope = paren ? paren[1] : text;
  const m = scope.match(DIMS_RE);
  if (m && m[2]) {
    const values = [m[2], m[3], m[4]].filter(Boolean).map(Number);
    const unit = toUnit(m[5]);
    // A bare number with no unit inside a name ("Set of 4", "6-Seater") is a
    // count, not a measurement. Two+ numbers or an explicit unit is a measurement.
    if (unit || values.length > 1) {
      out.dims = { values, unit: unit ?? 'cm', round: !!m[1] && values.length === 1 };
      const remainder = paren ? text.replace(paren[0], '') : text.replace(m[0], '');
      out.name = remainder.replace(/[()·,;]+/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }
  return out;
};

/* ───────────────────────── conversion ───────────────────────── */

export const convertDims = (d: Dims, to: Unit): Dims => {
  if (d.unit === to) return d;
  const f = UNIT_CM[d.unit] / UNIT_CM[to];
  const digits = to === 'ft' ? 2 : 0;
  const p = Math.pow(10, digits);
  return { ...d, unit: to, values: d.values.map(v => Math.round(v * f * p) / p) };
};

/**
 * "152 × 198 cm · 60 × 78 in" for a label written in another unit, or null
 * when the label carries no dimensions. ft labels show both cm and in.
 */
export const alternateUnits = (label: string | null | undefined): string | null => {
  const { dims } = parseSizeLabel(label);
  if (!dims) return null;
  const targets: Unit[] = dims.unit === 'cm' ? ['in'] : dims.unit === 'in' ? ['cm'] : ['cm', 'in'];
  return targets.map(u => formatDims(convertDims(dims, u))).join(' · ');
};

/* ───────────────────────── validation ───────────────────────── */

/** Error message for a builder input, or '' when the dimensions are usable. */
export const validateDimInputs = (raw: { l?: string; w?: string; h?: string }, unit: Unit): string => {
  const max = unit === 'cm' ? 1000 : unit === 'in' ? 400 : 35;
  for (const [k, v] of Object.entries(raw)) {
    if (v === undefined || v === '') continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return `${k.toUpperCase()} must be a positive number`;
    if (n > max) return `${k.toUpperCase()} looks too large for ${unit} (max ${max})`;
  }
  return '';
};

/** Trim, collapse whitespace, turn a typed x between numbers into ×, cap the length. */
export const normaliseSizeLabel = (raw: string): string =>
  (raw || '')
    .replace(/(\d)(\s*)[xX*](\s*)(?=\d)/g, '$1$2×$3')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_SIZE_LABEL);

/** Split a typed list ("Small, Medium; Large") into distinct labels. */
export const parseSizeList = (raw: string): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const chunk of (raw || '').split(/[,;\n]+/)) {
    const v = chunk.trim().replace(/\s+/g, ' ').slice(0, MAX_SIZE_LABEL);
    if (v && !seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); out.push(v); }
  }
  return out;
};

/* ───────────────────────── categories & presets ───────────────────────── */

export type SizeFamily = 'bed' | 'table' | 'seating' | 'storage' | 'wall' | 'decor' | 'custom';

export const FAMILY_LABELS: Record<SizeFamily, string> = {
  bed: 'Beds',
  table: 'Tables & Desks',
  seating: 'Chairs & Stools',
  storage: 'Cabinets & Shelves',
  wall: 'Wall Art & Mirrors',
  decor: 'Décor, Toys & Kitchen',
  custom: 'Custom',
};

/** Which preset family fits a category (name and/or slug, parent included). */
export const familyForCategory = (...parts: (string | null | undefined)[]): SizeFamily => {
  const t = parts.filter(Boolean).join(' ').toLowerCase().replace(/-/g, ' ');
  if (!t.trim()) return 'custom';
  if (/\b(beds?|bedroom|mattress|headboards?|cots?)\b/.test(t)) return 'bed';
  if (/\b(chairs?|stools?|benches|bench|seating|sofas?|ottomans?|swings?)\b/.test(t)) return 'seating';
  if (/\b(cabinets?|storage|shel(?:f|ves)|chests?|wardrobes?|sideboards?|drawers?|bookcases?|racks?|units?|trunks?)\b/.test(t)) return 'storage';
  if (/\b(tables?|desks?|consoles?)\b/.test(t)) return 'table';
  if (/\b(wall|mirrors?|frames?|clocks?|panels?|jharokha|art)\b/.test(t)) return 'wall';
  if (/\b(decor|d[eé]cor|figurines?|lamps?|lighting|planters?|kitchen|dining|serving|boards?|spice|boxes?|gifting|toys?|games?|utensils?|bowls?|trays?)\b/.test(t)) return 'decor';
  return 'custom';
};

export interface PresetSection {
  title: string;
  /** Ready-made labels, one chip each. */
  items: string[];
  /** One-click bundles ("Queen + King"). */
  sets?: { label: string; items: string[] }[];
}

const wallRound = (u: Unit) => (u === 'in' ? [12, 18, 24] : [30, 45, 60]).map(n => `Ø ${n} ${u}`);
const wallRect = (u: Unit) =>
  (u === 'in' ? [[12, 18], [18, 24], [24, 36]] : [[30, 45], [45, 60], [60, 90]]).map(([w, h]) => `${w} × ${h} ${u}`);

/** Presets for a family. `unit` only changes the wall-art dimensions. */
export const presetsFor = (family: SizeFamily, unit: Unit = 'cm'): PresetSection[] => {
  const u: Unit = unit === 'ft' ? 'cm' : unit;
  switch (family) {
    case 'bed':
      return [{
        title: 'Bed size (the mattress it takes)',
        items: ['Single (3×6 ft)', 'Double (4×6 ft)', 'Queen (5×6.5 ft)', 'King (6×6.5 ft)'],
        sets: [
          { label: 'Queen + King', items: ['Queen (5×6.5 ft)', 'King (6×6.5 ft)'] },
          { label: 'Single to King', items: ['Single (3×6 ft)', 'Double (4×6 ft)', 'Queen (5×6.5 ft)', 'King (6×6.5 ft)'] },
        ],
      }];
    case 'table':
      return [{
        title: 'By seating',
        items: ['2-Seater', '4-Seater', '6-Seater', '8-Seater'],
        sets: [
          { label: '4 + 6 Seater', items: ['4-Seater', '6-Seater'] },
          { label: '2 to 8 Seater', items: ['2-Seater', '4-Seater', '6-Seater', '8-Seater'] },
        ],
      }, { title: 'By size (add L × W × H below)', items: ['Small', 'Medium', 'Large'] }];
    case 'seating':
      return [{
        title: 'Quantity',
        items: ['Single', 'Set of 2', 'Set of 4', 'Set of 6'],
        sets: [{ label: 'Single + Set of 2 + Set of 4', items: ['Single', 'Set of 2', 'Set of 4'] }],
      }];
    case 'storage':
      return [{
        title: 'By size (add L × W × H below)',
        items: ['Small', 'Medium', 'Large'],
        sets: [{ label: 'Small, Medium, Large', items: ['Small', 'Medium', 'Large'] }],
      }];
    case 'wall':
      return [
        { title: `Round (diameter, ${u})`, items: wallRound(u) },
        { title: `Rectangular (W × H, ${u})`, items: wallRect(u) },
      ];
    case 'decor':
      return [
        {
          title: 'By size',
          items: ['Mini', 'Small', 'Medium', 'Large'],
          sets: [{ label: 'Small, Medium, Large', items: ['Small', 'Medium', 'Large'] }],
        },
        { title: 'Sets', items: ['Set of 2', 'Set of 3', 'Set of 4', 'Set of 6'] },
        { title: 'Capacity', items: ['250 ml', '500 ml', '750 ml', '1 L'] },
      ];
    default:
      return [{ title: 'Common', items: ['Standard', 'Small', 'Medium', 'Large', 'Set of 2', 'Set of 4'] }];
  }
};

/** Finishes offered as one-click chips. The first three are the seeded ones. */
export const FINISH_SUGGESTIONS = [
  'Natural', 'Walnut', 'Honey', 'Teak', 'Mahogany', 'Espresso', 'Whitewash', 'Antique', 'Ebony',
];

/* ───────────────────────── ordering ───────────────────────── */

/**
 * Named sizes by rank, smallest first. Bands are apart on purpose (bed sizes
 * 10+, generic 0-6) so beds and décor never interleave. Fashion letters are
 * kept as aliases so any pre-existing "S/M/L" variants still sort sensibly.
 * Longer keys come first so "extra large" wins over "large".
 */
const NAME_RANK: [string, number][] = [
  ['super king', 14], ['california king', 14], ['king', 13], ['queen', 12],
  ['double', 11], ['full', 11], ['single', 10], ['twin', 10],
  ['extra extra large', 5.5], ['extra large', 5], ['extra small', 1], ['extra-large', 5], ['extra-small', 1],
  ['jumbo', 6], ['large', 4], ['medium', 3], ['regular', 3], ['standard', 3], ['small', 2],
  ['compact', 2], ['mini', 0], ['tiny', 0],
];
const LETTER_RANK: Record<string, number> = { xxs: 0.5, xs: 1, s: 2, m: 3, l: 4, xl: 5, '2xl': 5.5, xxl: 5.5, '3xl': 6, xxxl: 6 };

const nameRank = (name: string): number | null => {
  const n = name.toLowerCase().trim();
  if (n in LETTER_RANK) return LETTER_RANK[n];
  for (const [key, rank] of NAME_RANK) {
    if (n === key || n.startsWith(key + ' ') || n.startsWith(key + '-')) return rank;
  }
  return null;
};

/** "6-Seater", "6 seater", "Set of 4", "4 pcs", "Pair" -> the count. */
const countOf = (name: string): number | null => {
  const n = name.toLowerCase().trim();
  let m = n.match(/^(\d+)\s*[- ]?\s*(seater|seats?|piece|pieces|pcs|pc|pack)\b/);
  if (m) return Number(m[1]);
  m = n.match(/^(?:set|pack|combo)\s+of\s+(\d+)\b/);
  if (m) return Number(m[1]);
  if (/^pair\b/.test(n)) return 2;
  return null;
};

/** Numeric size: volume for 3 dims, area for 2, length for 1 (all in cm). */
const dimKey = (d: Dims): [number, number] => {
  const f = UNIT_CM[d.unit];
  return [d.values.length, d.values.reduce((a, v) => a * v * f, 1)];
};

interface SortKey { group: number; a: number; b: number; text: string }

const sortKey = (label: string): SortKey => {
  const p = parseSizeLabel(label);
  const text = (label || '').toLowerCase().trim();
  const rank = nameRank(p.name);
  if (rank !== null) return { group: 0, a: rank, b: 0, text };
  const count = countOf(p.name);
  if (count !== null) return { group: 1, a: count, b: 0, text };
  if (p.capacityMl !== null) return { group: 2, a: p.capacityMl, b: 0, text };
  if (p.dims) { const [n, k] = dimKey(p.dims); return { group: 3, a: n, b: k, text }; }
  // A bare number is an old waist/length figure: order it numerically.
  const bare = text.match(/^(\d+(?:\.\d+)?)$/);
  if (bare) return { group: 3, a: 1, b: Number(bare[1]), text };
  return { group: 4, a: 0, b: 0, text };
};

export const compareSizes = (x: string, y: string): number => {
  const A = sortKey(x);
  const B = sortKey(y);
  return (
    A.group - B.group ||
    A.a - B.a ||
    A.b - B.b ||
    A.text.localeCompare(B.text, undefined, { numeric: true })
  );
};

/** Ascending copy; never mutates the input. Stable for equal keys. */
export const sortSizes = <T extends string | null | undefined>(sizes: T[]): T[] =>
  sizes
    .map((s, i) => ({ s, i }))
    .sort((a, b) => compareSizes(a.s || '', b.s || '') || a.i - b.i)
    .map(x => x.s);

/* ───────────────────────── legacy fashion values ───────────────────────── */

const LEGACY_MAP: Record<string, string> = {
  xxs: 'Mini', xs: 'Mini', s: 'Small', m: 'Medium', l: 'Large', xl: 'Extra Large',
  xxl: 'Extra Large', '2xl': 'Extra Large', xxxl: 'Extra Large', '3xl': 'Extra Large',
  'free size': 'Standard', 'one size': 'Standard', freesize: 'Standard', onesize: 'Standard',
};

/** Handicraft name for an old apparel size, or null when it is not one. */
export const mapLegacySize = (raw: string | null | undefined): string | null => {
  const k = (raw || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ');
  return LEGACY_MAP[k] ?? LEGACY_MAP[k.replace(/ /g, '')] ?? null;
};
