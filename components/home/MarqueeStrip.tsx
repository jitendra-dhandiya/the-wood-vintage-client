'use client';
import { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

// ── Types ──────────────────────────────────────────────────────
export interface MarqueeItem {
  text: string;
  icon?: string;
  link?: string;
}

export interface MarqueeConfig {
  items?: MarqueeItem[];
  speed?: number;           // seconds per full cycle — lower = faster (default 35)
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  separatorStyle?: 'diamond' | 'dot' | 'star' | 'slash' | 'line' | 'none';
  variant?: 'dark' | 'light' | 'gold' | 'accent';
  fontSize?: 'xs' | 'sm' | 'md';
  pauseOnHover?: boolean;
  uppercase?: boolean;
}

const SEPARATORS: Record<string, string> = {
  diamond: '◆',
  dot: '•',
  star: '★',
  slash: '/',
  line: '|',
  none: '',
};

const VARIANT_STYLES: Record<string, { bg: string; text: string; accent: string }> = {
  dark:   { bg: '#1a1a1a', text: '#ffffff', accent: '#c9a84c' },
  light:  { bg: '#f5f5f5', text: '#1a1a1a', accent: '#c9a84c' },
  gold:   { bg: '#c9a84c', text: '#1a1a1a', accent: '#1a1a1a' },
  accent: { bg: '#0d0d0d', text: '#c9a84c', accent: '#ffffff' },
};

const FONT_SIZES: Record<string, string> = {
  xs: '0.65rem',
  sm: '0.72rem',
  md: '0.8rem',
};

const DEFAULT_ITEMS: MarqueeItem[] = [
  { text: 'Free Shipping on Orders Above ₹999', icon: '🚚' },
  { text: 'Easy Size Exchange', icon: '↩' },
  { text: 'New Arrivals Every Week', icon: '✨' },
  { text: 'Exclusive Offers for Members', icon: '🎁' },
  { text: 'Secure Payments — UPI · Cards · COD', icon: '🔒' },
];

interface Props {
  config?: MarqueeConfig;
}

export default function MarqueeStrip({ config = {} }: Props) {
  const {
    items = DEFAULT_ITEMS,
    speed = 35,
    separatorStyle = 'diamond',
    variant = 'dark',
    fontSize = 'sm',
    pauseOnHover = true,
    uppercase = true,
  } = config;

  const variantStyle = VARIANT_STYLES[variant] || VARIANT_STYLES.dark;
  const bg       = config.bgColor    || variantStyle.bg;
  const textClr  = config.textColor  || variantStyle.text;
  const accentClr = config.accentColor || variantStyle.accent;
  const sep       = SEPARATORS[separatorStyle] ?? '◆';
  const fSize     = FONT_SIZES[fontSize] || '0.72rem';

  const trackRef = useRef<HTMLDivElement>(null);

  // Pause animation on hover via JS (CSS :hover can't reliably target animation-play-state inside MUI sx)
  useEffect(() => {
    if (!pauseOnHover) return;
    const el = trackRef.current;
    if (!el) return;
    const pause = () => { el.style.animationPlayState = 'paused'; };
    const play  = () => { el.style.animationPlayState = 'running'; };
    el.addEventListener('mouseenter', pause);
    el.addEventListener('mouseleave', play);
    return () => {
      el.removeEventListener('mouseenter', pause);
      el.removeEventListener('mouseleave', play);
    };
  }, [pauseOnHover]);

  // Build the items array doubled for seamless infinite loop
  const displayItems = [...items, ...items];

  return (
    <Box
      sx={{
        bgcolor: bg,
        overflow: 'hidden',
        position: 'relative',
        py: 0,
        // Top/bottom border lines as an accent
        borderTop: `1px solid ${accentClr}22`,
        borderBottom: `1px solid ${accentClr}22`,
      }}
    >
      {/* Fade masks on both edges */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: { xs: 40, md: 80 },
        background: `linear-gradient(to right, ${bg}, transparent)`,
        zIndex: 2, pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: { xs: 40, md: 80 },
        background: `linear-gradient(to left, ${bg}, transparent)`,
        zIndex: 2, pointerEvents: 'none',
      }} />

      {/* Scrolling track */}
      <Box
        ref={trackRef}
        sx={{
          display: 'flex',
          alignItems: 'center',
          width: 'max-content',
          // CSS keyframes animation — translate by -50% to loop the doubled items
          /* @keyframes marquee-scroll is defined in globals.css — NOT here.
             Defining keyframes inside sx causes Emotion to inject a new CSS
             rule on every render, triggering style recalculation in the browser. */
          animation: `marquee-scroll ${speed}s linear infinite`,
          py: 1.25,
          gap: 0,
          cursor: pauseOnHover ? 'default' : 'unset',
        }}
      >
        {displayItems.map((item, i) => (
          <Box
            key={i}
            component={item.link ? 'a' : 'div'}
            href={item.link || undefined}
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              whiteSpace: 'nowrap',
              px: { xs: 2.5, md: 3.5 },
              textDecoration: 'none',
              ...(item.link && {
                '&:hover .marquee-text': { color: accentClr, transition: 'color 0.15s' },
              }),
            }}
          >
            {/* Icon */}
            {item.icon && (
              <Box
                component="span"
                sx={{ fontSize: '0.85rem', lineHeight: 1, flexShrink: 0 }}
                aria-hidden="true"
              >
                {item.icon}
              </Box>
            )}

            {/* Text */}
            <Typography
              className="marquee-text"
              component="span"
              sx={{
                color: textClr,
                fontSize: fSize,
                fontWeight: 600,
                letterSpacing: uppercase ? '0.09em' : '0.03em',
                textTransform: uppercase ? 'uppercase' : 'none',
                transition: 'color 0.15s',
                lineHeight: 1,
              }}
            >
              {item.text}
            </Typography>

            {/* Separator (hidden after last duplicated item to avoid trailing) */}
            {sep && (
              <Box
                component="span"
                sx={{
                  color: accentClr,
                  fontSize: fSize,
                  fontWeight: 700,
                  mx: { xs: 1, md: 1.5 },
                  opacity: 0.8,
                  lineHeight: 1,
                }}
                aria-hidden="true"
              >
                {sep}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
