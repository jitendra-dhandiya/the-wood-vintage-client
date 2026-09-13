/**
 * Where the shopper's WOMEN/MEN/no-filter preference lives.
 *
 * It is stored in a cookie rather than only localStorage because the homepage
 * is server-rendered: the server has to know which gender to fetch, otherwise
 * it renders one gender's catalogue while the restored toggle shows the other.
 * localStorage is invisible to the server, which is exactly how that mismatch
 * used to happen.
 *
 * localStorage is still written so a shopper who already had a preference
 * before the cookie existed keeps it.
 *
 * Phase 4 (Experience) §1: the storefront replaced the MEN/WOMEN toggle with
 * Room/Material/Style as the primary browsing axis — the toggle bar is hidden
 * by default (`gender_toggle_enabled` admin setting) and 'ALL' (no filter, the
 * full catalogue) is now the default, not 'WOMEN'. MEN/WOMEN are kept only for
 * the rare deployment that re-enables the toggle admin-side; see
 * docs/architecture/phase-4-experience-spec.md §1.
 */
export type GenderType = 'MEN' | 'WOMEN' | 'ALL';

export const GENDER_COOKIE = 'ud_gender';
export const GENDER_STORAGE_KEY = 'ud_gender';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/** Anything that is not an explicit MEN/WOMEN falls back to the ALL (no-filter) default. */
export const normalizeGender = (value?: string | null): GenderType =>
  value === 'MEN' || value === 'WOMEN' ? value : 'ALL';

/** Reads the preference on the client, migrating a pre-cookie localStorage value. */
export const readStoredGender = (): GenderType | null => {
  if (typeof document === 'undefined') return null;

  const match = document.cookie.match(/(?:^|;\s*)ud_gender=(MEN|WOMEN|ALL)/);
  if (match) return match[1] as GenderType;

  try {
    const legacy = window.localStorage.getItem(GENDER_STORAGE_KEY);
    if (legacy === 'MEN' || legacy === 'WOMEN' || legacy === 'ALL') return legacy;
  } catch {
    // Private mode or blocked storage — fall through to the default.
  }
  return null;
};

/** Persists the preference so both the client and the next SSR request see it. */
export const persistGender = (gender: GenderType): void => {
  if (typeof document === 'undefined') return;
  // Lax keeps the cookie on normal top-level navigations, which is all the
  // server render needs, without sending it on cross-site subrequests.
  document.cookie = `${GENDER_COOKIE}=${gender}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
  try {
    window.localStorage.setItem(GENDER_STORAGE_KEY, gender);
  } catch {
    // Cookie alone is enough; storage is a convenience.
  }
};
