import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { GenderType } from '../../lib/genderPreference';

export type { GenderType };

interface GenderState {
  selected: GenderType;
  /**
   * True once the persisted preference has been applied on the client.
   *
   * The store is a module singleton shared across SSR requests, so it cannot be
   * seeded per request — it always starts at the WOMEN default on the server.
   * Consumers that render gender-dependent content use this to keep showing the
   * server's value until the real preference has landed, instead of flashing
   * the default for a render.
   */
  initialized: boolean;
}

const genderSlice = createSlice({
  name: 'gender',
  initialState: { selected: 'WOMEN', initialized: false } as GenderState,
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
