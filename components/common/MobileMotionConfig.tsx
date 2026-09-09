'use client';
import { useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';

function getIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 900;
}

/*
 * Disables ALL framer-motion animations on mobile.
 *
 * Critical: useState initializer runs synchronously on the client, so the
 * VERY FIRST render already has the correct isMobile value. The previous
 * version started with false → triggered a second full render on mount with
 * all motion components re-mounting simultaneously → scroll freeze burst.
 */
export default function MobileMotionConfig({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', check, { passive: true });
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <MotionConfig reducedMotion={isMobile ? 'always' : 'never'}>
      {children}
    </MotionConfig>
  );
}
