'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

let observer: IntersectionObserver | null = null;
const callbacks = new WeakMap<Element, () => void>();

function getObserver(): IntersectionObserver {
  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          callbacks.get(e.target)?.();
          callbacks.delete(e.target);
          observer?.unobserve(e.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
    );
  }
  return observer;
}

/**
 * Scroll-reveal for one element. Attach the returned ref; the element (which
 * needs the `reveal` class, see globals.css) fades/rises once when it enters
 * the viewport.
 *
 * The element is visible in SSR and stays visible when it is already on screen
 * at mount, so above-the-fold content (LCP) is never held back. Only elements
 * below the fold are hidden, in a layout effect, i.e. before first paint.
 * Reduced motion and browsers without IntersectionObserver skip it entirely.
 * One shared observer serves the whole page.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    el.dataset.reveal = 'hidden';
    callbacks.set(el, () => { el.dataset.reveal = 'shown'; });
    getObserver().observe(el);
    return () => {
      callbacks.delete(el);
      observer?.unobserve(el);
      if (el.dataset.reveal === 'hidden') el.dataset.reveal = 'shown';
    };
  }, []);

  return ref;
}
