'use client';
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setCart, setLoading, openCart } from '../store/slices/cartSlice';
import { cartApi } from '../services/api.service';
import toast from 'react-hot-toast';
import { trackEvent } from '../lib/analytics';
import { useCountry } from '../contexts/CountryContext';

export const useCart = () => {
  const dispatch = useAppDispatch();
  const { cart, itemCount, subtotal, isLoading, isOpen } = useAppSelector((s) => s.cart);
  // Combo bundles are priced per market; the server locks the market to the visitor (decision 0036).
  const { country } = useCountry();

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await cartApi.get(country);
      dispatch(setCart(data.data));
    } catch {}
  }, [dispatch, country]);

  const addToCart = useCallback(async (productId: string, variantId?: string, quantity = 1) => {
    dispatch(setLoading(true));
    try {
      await cartApi.addItem(productId, variantId, quantity);
      await fetchCart();
      dispatch(openCart());
      toast.success('Added to cart!');
      // Phase 7 (Analytics) ADD_TO_CART -- only after the call above actually
      // succeeded (the catch block below is what "failed" means in this hook).
      trackEvent('ADD_TO_CART', { productId });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to add to cart');
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, fetchCart]);

  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      await cartApi.updateItem(itemId, quantity);
      await fetchCart();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update cart');
    }
  }, [fetchCart]);

  const addComboToCart = useCallback(async (comboId: string, quantity = 1): Promise<boolean> => {
    dispatch(setLoading(true));
    try {
      await cartApi.addCombo(comboId, quantity, country);
      await fetchCart();
      dispatch(openCart());
      toast.success('Combo added to cart!');
      trackEvent('ADD_TO_CART');
      return true;
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not add this combo');
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch, fetchCart, country]);

  const updateComboQuantity = useCallback(async (id: string, quantity: number) => {
    try {
      await cartApi.updateCombo(id, quantity, country);
      await fetchCart();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to update cart');
    }
  }, [fetchCart, country]);

  const removeCombo = useCallback(async (id: string) => {
    try {
      await cartApi.removeCombo(id);
      await fetchCart();
      toast.success('Combo removed');
    } catch {}
  }, [fetchCart]);

  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      await cartApi.removeItem(itemId);
      await fetchCart();
      toast.success('Item removed');
    } catch {}
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    try {
      await cartApi.clear();
      await fetchCart();
    } catch {}
  }, [fetchCart]);

  return { cart, itemCount, subtotal, isLoading, isOpen, fetchCart, addToCart, addComboToCart, updateComboQuantity, removeCombo, updateQuantity, removeFromCart, clearCart };
};
