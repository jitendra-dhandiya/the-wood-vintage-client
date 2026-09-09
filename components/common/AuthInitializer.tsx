'use client';
import { useEffect } from 'react';
import { useAppDispatch } from '../../store';
import { setUser, setLoading } from '../../store/slices/authSlice';
import { authApi } from '../../services/api.service';
import { useCart } from '../../hooks/useCart';

export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  const { fetchCart } = useCart();

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const { data } = await authApi.me();
          dispatch(setUser(data.data));
        } catch {
          dispatch(setLoading(false));
        }
      } else {
        dispatch(setLoading(false));
      }
      fetchCart();
    };
    init();
  }, [dispatch, fetchCart]);

  return null;
}
