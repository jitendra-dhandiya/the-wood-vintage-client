import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Cart, CartItem, CartCombo } from '../../types';

interface CartState {
  cart: Cart | null;
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  isOpen: boolean;
}

// A combo bundle counts as `quantity` bundles at its server-priced combo price.
const calculateTotals = (items: CartItem[], combos: CartCombo[] = []) => ({
  itemCount: items.reduce((sum, i) => sum + i.quantity, 0) + combos.reduce((sum, c) => sum + c.quantity, 0),
  subtotal: items.reduce((sum, i) => sum + i.price * i.quantity, 0) + combos.reduce((sum, c) => sum + (c.lineTotal ?? 0), 0),
});

const initialState: CartState = {
  cart: null,
  itemCount: 0,
  subtotal: 0,
  isLoading: false,
  isOpen: false,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<Cart>) {
      state.cart = action.payload;
      const totals = calculateTotals(action.payload.items, action.payload.combos);
      state.itemCount = totals.itemCount;
      state.subtotal = totals.subtotal;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    toggleCart(state) {
      state.isOpen = !state.isOpen;
    },
    openCart(state) {
      state.isOpen = true;
    },
    closeCart(state) {
      state.isOpen = false;
    },
  },
});

export const { setCart, setLoading, toggleCart, openCart, closeCart } = cartSlice.actions;
export default cartSlice.reducer;
