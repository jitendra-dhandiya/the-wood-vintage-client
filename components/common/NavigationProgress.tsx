'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * A thin progress bar across the top during navigation.
 *
 * Next's App Router keeps the current page on screen while the next one is
 * fetched, so a click gets no feedback on a slow connection. The bar starts on
 * the CLICK of an internal link (a capture-phase listener, so it works for
 * every next/link including the country-prefixed /in/... routes and needs no
 * per-link wiring) and completes when the pathname/search params change.
 * Navigations that finish in under ~120ms never show it, so fast pages do not
 * flicker. Programmatic router.push() calls, which have no click, get a short
 * completion flash instead.
 *
 * CSS-driven (transform + opacity only) so it works where framer-motion is off
 * (< 900px). It is a status indicator and keeps running under reduced motion.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [overlay, setOverlay] = useState(false);
  const first = useRef(true);
  const pending = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const here = useRef('');
  here.current = pathname + (search ? `?${search}` : '');

  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  // Start on click of an internal link.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      let url: URL;
      try { url = new URL(a.href, window.location.href); } catch { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname + url.search === here.current) return;
      if (url.pathname === window.location.pathname && url.hash) return;

      clear();
      pending.current = true;
      // Only show if it is still pending after 120ms; give up after 10s.
      timers.current.push(setTimeout(() => { if (pending.current) setState('loading'); }, 120));
      // Slow navigation (still pending after 450ms): add the branded overlay.
      timers.current.push(setTimeout(() => { if (pending.current) setOverlay(true); }, 450));
      timers.current.push(setTimeout(() => { pending.current = false; setOverlay(false); setState('idle'); }, 10000));
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  // The route changed: finish.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    clear();
    const wasShown = pending.current;
    pending.current = false;
    setOverlay(false);
    setState('done');
    timers.current.push(setTimeout(() => setState('idle'), wasShown ? 500 : 450));
    return clear;
  }, [pathname, search]);

  if (state === 'idle' && !overlay) return null;

  return (
    <>
    {overlay && (
      <div className="nav-overlay" role="status" aria-live="polite" aria-label="Loading page">
        <div className="nav-overlay__box">
          <div className="nav-overlay__ring">
            <svg viewBox="0 0 100 100" aria-hidden>
              <circle className="nav-overlay__track" cx="50" cy="50" r="44" />
              <circle className="nav-overlay__arc" cx="50" cy="50" r="44" />
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mark.png" alt="" className="nav-overlay__mark" />
          </div>
          <span className="nav-overlay__text">Crafting your page…</span>
        </div>
      </div>
    )}
    {state !== 'idle' && (
    <div
      className="nav-progress"
      role="progressbar"
      aria-label="Loading page"
      aria-hidden
      style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 2000, pointerEvents: 'none' }}
    >
      <div
        style={{
          height: '100%',
          width: '100%',
          transformOrigin: '0 50%',
          background: 'linear-gradient(90deg, #A0693A, #D9A66E)',
          boxShadow: '0 0 8px rgba(160,105,58,0.55)',
          ...(state === 'loading'
            ? { animation: 'wvTrickle 9s cubic-bezier(0.05, 0.7, 0.1, 1) forwards' }
            : { transform: 'scaleX(1)', opacity: 0, transition: 'opacity 0.35s ease-in 0.08s' }),
        }}
      />
    </div>
    )}
    </>
  );
}
