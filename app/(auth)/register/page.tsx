'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Sign-up and sign-in are the same act now: one email, one code. Keeping a
 * separate page would ask a customer to decide something the server works out
 * on its own, so this forwards rather than duplicating the form.
 */
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, [router]);
  return null;
}
