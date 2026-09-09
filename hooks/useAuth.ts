'use client';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '../store';
import { setCredentials, logout as logoutAction, setLoading } from '../store/slices/authSlice';
import { authApi } from '../services/api.service';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const { user, isAuthenticated, isLoading } = useAppSelector((s) => s.auth);

  /**
   * Ask for a sign-in code. The same call covers a returning customer and a
   * brand-new one — the server answers which, so the UI never has to ask
   * "do you have an account?".
   */
  const requestOtp = useCallback(async (data: {
    email: string; firstName?: string; lastName?: string; phone?: string;
  }) => {
    dispatch(setLoading(true));
    try {
      const { data: res } = await authApi.requestOtp(data);
      return (res as any).data as { isNewUser: boolean; expiresAt: string; resendAvailableAt: string };
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not send the code');
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  /** The code is the sign-in, and for a new address it creates the account. */
  const verifyOtp = useCallback(async (email: string, otp: string, onSuccess?: () => void) => {
    dispatch(setLoading(true));
    try {
      const { data } = await authApi.verifyOtp(email, otp);
      dispatch(setCredentials((data as any).data));
      toast.success('Welcome!');
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'That code could not be verified');
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  /**
   * Password sign-in. No longer offered to customers, but kept because the
   * shop's only admin account is on a domain with no inbox — a code sent there
   * would bounce, and removing this would lock the panel.
   */
  const login = useCallback(async (email: string, password: string, onSuccess?: () => void) => {
    dispatch(setLoading(true));
    try {
      const { data } = await authApi.login(email, password);
      dispatch(setCredentials(data.data));
      toast.success('Welcome back!');
      onSuccess?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Login failed');
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    dispatch(logoutAction());
    router.push('/');
    toast.success('Logged out');
  }, [dispatch, router]);

  const isAdmin    = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isSubAdmin = user?.role === 'SUB_ADMIN';

  return { user, isAuthenticated, isLoading, isAdmin, isSubAdmin, login, requestOtp, verifyOtp, logout };
};
