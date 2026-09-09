import { createSlice } from '@reduxjs/toolkit';

interface UIState {
  loginModalOpen: boolean;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { loginModalOpen: false } as UIState,
  reducers: {
    openLoginModal:  (state) => { state.loginModalOpen = true; },
    closeLoginModal: (state) => { state.loginModalOpen = false; },
  },
});

export const { openLoginModal, closeLoginModal } = uiSlice.actions;
export default uiSlice.reducer;
