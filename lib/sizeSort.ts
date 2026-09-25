/**
 * Ordering for the "Size / Dimensions" row on a product page.
 *
 * The fashion XS-XXL / waist-number ordering was replaced by handicraft-aware
 * ordering (decision 0039): named sizes by rank (Single < Double < Queen <
 * King, Small < Medium < Large), then N-seater / Set-of-N by count, then
 * capacities, then numeric dimensions (volume, area or length), then
 * alphabetical. The implementation lives in `handicraftSize.ts`; this module
 * keeps the original import path stable.
 */
export { compareSizes, sortSizes } from './handicraftSize';
