'use client';
import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useReveal } from '../../hooks/useReveal';

interface RevealProps {
  children: ReactNode;
  /** Seconds. */
  delay?: number;
  /** Rise distance in px. */
  y?: number;
  /** Stagger position: adds 60ms per step (capped) on top of `delay`. */
  index?: number;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

/** Fade-and-rise when scrolled into view. See hooks/useReveal and decision 0033. */
export default function Reveal({ children, delay = 0, y = 24, index = 0, as: Tag = 'div', className, style }: RevealProps) {
  const ref = useReveal<HTMLElement>();
  const total = delay + Math.min(index, 8) * 0.06;
  return (
    <Tag
      ref={ref}
      className={`reveal${className ? ` ${className}` : ''}`}
      style={{ '--reveal-delay': `${total}s`, '--reveal-y': `${y}px`, ...style } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
