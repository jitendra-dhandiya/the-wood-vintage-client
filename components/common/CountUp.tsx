'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Counts a stat up from zero when it scrolls into view ("12,000+", "4.8", "40%").
 *
 * The final text is always in the DOM (SSR, screen readers, reduced motion) and
 * sizes the box, so the digits changing never move the layout. The animated
 * copy is an overlaid aria-hidden span, written straight to textContent, so
 * there are no React re-renders per frame.
 */
export default function CountUp({ value, duration = 1500 }: { value: string; duration?: number }) {
  const wrap = useRef<HTMLSpanElement>(null);
  const final = useRef<HTMLSpanElement>(null);
  const anim = useRef<HTMLSpanElement>(null);

  useIsoLayoutEffect(() => {
    const m = value.match(/^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/);
    const w = wrap.current, f = final.current, a = anim.current;
    if (!m || !w || !f || !a || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const [, pre, numStr, post] = m;
    const target = parseFloat(numStr.replace(/,/g, ''));
    const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
    const grouped = numStr.includes(',');
    const fmt = (n: number) =>
      pre + n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: grouped }) + post;

    f.style.opacity = '0';
    a.style.display = 'block';
    a.textContent = fmt(0);

    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        a.textContent = fmt(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
        else { a.style.display = 'none'; f.style.opacity = '1'; }
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(w);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      a.style.display = 'none';
      f.style.opacity = '1';
    };
  }, [value, duration]);

  return (
    <span ref={wrap} style={{ position: 'relative', display: 'inline-block', fontVariantNumeric: 'tabular-nums' }}>
      <span ref={final}>{value}</span>
      <span ref={anim} aria-hidden style={{ position: 'absolute', inset: 0, display: 'none', whiteSpace: 'nowrap' }} />
    </span>
  );
}
