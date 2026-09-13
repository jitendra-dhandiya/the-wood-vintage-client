import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GenderType } from '../../lib/genderPreference';

export type { GenderType };

interface GenderState {
  selected: GenderType;
  /**
   * True once the persisted preference has been applied on the client.
   *
   * The store is a module singleton shared across SSR requests, so it cannot be
   * seeded per request — it always starts at the ALL (no-filter) default on
   * the server. Consumers that render gender-dependent content use this to
   * keep showing the server's value until the real preference has landed,
   * instead of flashing the default for a render.
   */
  initialized: boolean;
}

// 'ALL' — no gender filter, the full catalogue — not 'WOMEN'. See
// lib/genderPreference.ts's doc comment (Phase 4 §1): with the gender toggle
// hidden by default, defaulting here to a specific gender would silently
// scope the entire storefront to it.
const genderSlice = createSlice({
  name: 'gender',
  initialState: { selected: 'ALL', initialized: false } as GenderState,
  reducers: {
    setGender(state, action: PayloadAction<GenderType>) {
      state.selected = action.payload;
    },
    /** Applies the stored preference on first mount. */
    initGender(state, action: PayloadAction<GenderType>) {
      state.selected = action.payload;
      state.initialized = true;
    },
  },
});

export const { setGender, initGender } = genderSlice.actions;
export default genderSlice.reducer;
