import { alternateUnits } from './handicraftSize';

/** Vocabulary shown to shoppers and admins, in one place. */
export const SIZE_LABEL = 'Size / Dimensions';
export const FINISH_LABEL = 'Finish';

interface OptionLike { size?: string | null; color?: string | null }

/** "Queen (5×6.5 ft) / Walnut" — compact, for tight rows and pickers. */
export const variantShort = (v: OptionLike | null | undefined): string =>
  [v?.size, v?.color].filter(Boolean).join(' / ');

/** "Size: Queen (5×6.5 ft) · Finish: Walnut" — cart, checkout, orders, quote. */
export const variantLabel = (v: OptionLike | null | undefined): string =>
  [v?.size ? `Size: ${v.size}` : '', v?.color ? `Finish: ${v.color}` : ''].filter(Boolean).join(' · ');

/** Other-unit reading of the size ("152 × 198 cm · 60 × 78 in"), or null. */
export const sizeAlt = (size: string | null | undefined): string | null => alternateUnits(size);
