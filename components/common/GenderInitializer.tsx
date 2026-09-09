'use client';
import { useEffect } from 'react';
import { useAppDispatch } from '../../store';
import { initGender } from '../../store/slices/genderSlice';
import { readStoredGender, persistGender } from '../../lib/genderPreference';

export default function GenderInitializer() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const stored = readStoredGender();
    // Dispatch either way: `initialized` is what tells gender-dependent
    // components that the real preference has landed, and they stay on the
    // server-rendered value until it has.
    dispatch(initGender(stored ?? 'WOMEN'));
    // Writes the cookie the server reads, including for shoppers whose
    // preference only existed in localStorage before.
    persistGender(stored ?? 'WOMEN');
  }, [dispatch]);
  return null;
}
