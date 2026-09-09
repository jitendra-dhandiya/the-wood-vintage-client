'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * A thin progress bar across the top during navigation.
 *
 * Next's App Router keeps the current page on screen while the next one is
 * fetched, which is good for perceived speed but leaves a click with no
 * feedback at all — on a slow connection the site simply looks broken until
 * the new page appears. This is the acknowledgement.
 *
 * Deliberately CSS-driven rather than framer-motion: MobileMotionConfig turns
 * framer-motion off below 900px, and this has to work on exactly the
 * connections where it matters most. Animating only `transform` and `opacity`
 * keeps it on the compositor, so it cannot contend with the render it is
 * reporting on.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const first = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // A navigation has COMPLETED by the time the new route's effects run, so this
  // shows the bar filling and then finishing, rather than tracking real
  // progress — which the router does not expose. Honest enough: the bar is a
  // "something happened" signal, and it always resolves.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    timers.current.forEach(clearTimeout);
    timers.current = [];

    setState('loading');
    timers.current.push(setTimeout(() => setState('done'), 320));
    timers.current.push(setTimeout(() => setState('idle'), 720));

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [pathname, searchParams]);

  if (state === 'idle') return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        // 2px read as a hairline on a busy header and was easy to miss —
        // which defeats the point of an acknowledgement.
        height: 4,
        zIndex: 2000,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          transformOrigin: '0 50%',
          background: 'linear-gradient(90deg, #c9a84c, #e6cf8a)',
          // A soft bloom so the bar reads against both the white header and a
          // dark hero without needing a heavier stroke.
          boxShadow: '0 0 8px rgba(201,168,76,0.6)',
          transform: state === 'done' ? 'scaleX(1)' : 'scaleX(0.65)',
          opacity: state === 'done' ? 0 : 1,
          transition: state === 'done'
            ? 'transform 0.28s ease-out, opacity 0.28s ease-in 0.12s'
            : 'transform 0.3s ease-out',
        }}
      />
    </div>
  );
}
