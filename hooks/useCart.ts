'use client';
import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setCart, setLoading, openCart } from '../store/slices/cartSlice';
import { cartApi } from '../services/api.service';
import toast from 'react-hot-toast';

export const useCart = () => {
  const dispatch = useAppDispatch();
  const { cart, itemCount, subtotal, isLoading, isOpen } = useAppSelector((s) => s.cart);

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await cartApi.get();
      dispatch(setCart(data.data));
    } catch {}
  }, [dispatch]);

  const addToCart = useCallback(async (productId: string, variantId?: string, quantity = 1) => {
    dispatch(setLoading(true));
    try {
      await cartApi.addItem(productId, variantId, quantity);
      await fetchCart();
      dispatch(openCart());
      toast.success('Added to cart!');
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

  return { cart, itemCount, subtotal, isLoading, isOpen, fetchCart, addToCart, updateQuantity, removeFromCart, clearCart };
};
