'use client';
import { usePathname } from 'next/navigation';

/**
 * A short rise-and-fade applied to each page as it mounts.
 *
 * Used from a `template.tsx`, which Next remounts on every navigation — that
 * remount is what replays the animation, and it is why this cannot live in a
 * layout.
 *
 * Plain CSS, for the same reason as NavigationProgress: framer-motion is
 * switched off below 900px, and a page transition that only exists on desktop
 * is not a page transition. `opacity` and `translate3d` are compositor
 * properties, so this costs nothing on a phone.
 *
 * The keyed element matters: without `key={pathname}` React reuses the node
 * across navigations and the animation never replays.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
