'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Box, Typography, Container, Divider, IconButton,
  Collapse, ListItemButton, ListItemText,
} from '@mui/material';
import { ExpandMore, ExpandLess, ArrowForward, GridView } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { NAV_LAYOUT_DEFAULTS, type NavLayout } from '../../lib/navLayout';

// ── Types ─────────────────────────────────────────────────────────
export interface NavChild {
  id: string;
  name: string;
  slug: string;
  gender?: string | null;
}

export interface NavCategory {
  id: string;
  name: string;
  slug: string;
  image?: string;
  gender?: string | null;
  children: NavChild[];
}

interface MegaMenuProps {
  categories: NavCategory[];
  /** Admin-managed; falls back to DEFAULT_QUICK_LINKS when empty. */
  quickLinks?: QuickLink[];
  /** Mobile only — pass true when the mobile drawer is open */
  mobileMode?: boolean;
  onLinkClick?: () => void;
  /** Admin-managed layout; omitted falls back to the shipped defaults. */
  layout?: NavLayout;
}

// ── Quick-link chips at the top of the mega panel ─────────────────
export interface QuickLink {
  id?: string;
  label: string;
  url: string;
  gender?: string | null;
}

/**
 * Used only while the admin has configured no quick links of their own.
 *
 * Applied by the Navbar BEFORE the gender filter, deliberately: if an admin
 * configures links for MEN only, women should see none — not have these
 * quietly reinstated because the filtered list came out empty.
 *
 * Keeping a fallback means turning this into an admin-managed list cannot
 * empty the top of the menu — a fresh install, or a database where every link
 * was deleted, still shows something sensible. "Shop All" leads because the
 * bar's SHOP entry is a menu trigger rather than a link to the full catalogue.
 */
const DEFAULT_QUICK_LINKS: QuickLink[] = [
  { label: 'Shop All',      url: '/shop'                   },
  { label: 'New Arrivals',  url: '/shop?isNewArrival=true' },
  { label: 'Best Sellers',  url: '/shop?sort=best-sellers' },
  { label: 'On Sale',       url: '/shop?discount=true'     },
];

export const resolveQuickLinks = (links?: QuickLink[] | null): QuickLink[] =>
  links && links.length ? links : DEFAULT_QUICK_LINKS;

// ── Desktop MegaMenu ──────────────────────────────────────────────
export function MegaMenuDesktop({ categories, quickLinks, onLinkClick, layout }: MegaMenuProps) {
  const links = quickLinks ?? [];
  const L = (layout ?? NAV_LAYOUT_DEFAULTS).desktop;
  const [open, setOpen]             = useState(false);
  const [hovered, setHovered]       = useState<string | null>(null);
  const closeTimer                  = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu  = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }, []);

  const closeMenu = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Lock body scroll while the panel is open — desktop only, never on mobile
  useEffect(() => {
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 900;
    if (!isDesktop) return;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const activeCategory = categories.find(c => c.id === hovered) ?? categories[0] ?? null;

  return (
    <Box
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      sx={{ position: 'relative' }}
    >
      {/* Trigger */}
      <Box
        component="button"
        onClick={() => setOpen(v => !v)}
        sx={{
          background: 'none', border: 'none', cursor: 'pointer', padding: '0 12px',
          fontWeight: 500, fontSize: '0.8rem', letterSpacing: '0.06em',
          textTransform: 'uppercase', color: open ? '#1a1a1a' : 'text.primary',
          fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', gap: 0.5, height: '100%',
          borderBottom: open ? '2px solid #1a1a1a' : '2px solid transparent',
          transition: 'color 0.15s, border-color 0.15s',
          '&:hover': { color: '#1a1a1a' },
        }}
      >
        Shop
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}
        >
          ▾
        </motion.span>
      </Box>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              top: 'var(--navbar-height, 132px)',
              zIndex: 1300,
              background: 'white',
              borderTop: '1px solid #ebebeb',
              borderBottom: '1px solid #ebebeb',
              boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
            }}
            onMouseEnter={openMenu}
            onMouseLeave={closeMenu}
          >
            <Container maxWidth="xl">
              <Box sx={{ display: 'grid', gridTemplateColumns: `${L.sidebarWidth}px 1fr auto`, gap: 0, height: `${L.panelHeight}vh`, minHeight: 420, overflow: 'hidden' }}>

                {/* ── Left sidebar: all categories ─────────── */}
                <Box sx={{
                  borderRight: '1px solid #f0f0f0', py: 3, pr: 3,
                  overflowY: 'auto',
                }}>
                  {/* Quick links */}
                  <Typography variant="overline" sx={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#999', px: 1 }}>
                    Quick Links
                  </Typography>
                  {links.map(q => (
                    <Box
                      key={q.id || q.url}
                      component={Link}
                      href={q.url}
                      onClick={() => { setOpen(false); onLinkClick?.(); }}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        px: 1, py: 0.75, borderRadius: 1, mb: 0.25,
                        textDecoration: 'none', color: '#333',
                        fontSize: '0.8rem', fontWeight: 600,
                        '&:hover': { bgcolor: '#f5f5f5', color: '#1a1a1a' },
                        transition: 'all 0.15s',
                      }}
                    >
                      {L.quickLinkIcon && <ArrowForward sx={{ fontSize: 13, color: '#b0a090' }} />}
                      {q.label}
                    </Box>
                  ))}

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="overline" sx={{ fontSize: '0.65rem', letterSpacing: '0.15em', color: '#999', px: 1 }}>
                    Categories
                  </Typography>
                  {categories.map(cat => (
                    <Box
                      key={cat.id}
                      onMouseEnter={() => setHovered(cat.id)}
                      onClick={() => { setOpen(false); onLinkClick?.(); }}
                      component={Link}
                      href={`/category/${cat.slug}`}
                      sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 1, py: 0.85, borderRadius: 1, mb: 0.25,
                        textDecoration: 'none',
                        bgcolor: hovered === cat.id || (!hovered && cat.id === categories[0]?.id)
                          ? '#1a1a1a' : 'transparent',
                        color: hovered === cat.id || (!hovered && cat.id === categories[0]?.id)
                          ? 'white' : '#333',
                        fontSize: '0.82rem', fontWeight: hovered === cat.id ? 700 : 500,
                        transition: 'all 0.12s',
                        '&:hover': { bgcolor: '#1a1a1a', color: 'white' },
                      }}
                    >
                      <span>{cat.name}</span>
                      {cat.children.length > 0 && (
                        <ArrowForward sx={{ fontSize: 12, opacity: 0.6 }} />
                      )}
                    </Box>
                  ))}

                  <Divider sx={{ my: 1.5 }} />
                  <Box
                    component={Link}
                    href="/categories"
                    onClick={() => { setOpen(false); onLinkClick?.(); }}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      px: 1, py: 0.75, borderRadius: 1,
                      textDecoration: 'none', color: '#888',
                      fontSize: '0.78rem', fontWeight: 500,
                      '&:hover': { color: '#1a1a1a' },
                    }}
                  >
                    <GridView sx={{ fontSize: 14 }} />
                    View All Categories
                  </Box>
                </Box>

                {/* ── Center: subcategories grid ────────────── */}
                <Box sx={{ py: 3, px: 4, overflowY: 'auto' }}>
                  <AnimatePresence mode="wait">
                    {activeCategory && (
                      <motion.div
                        key={activeCategory.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 2.5 }}>
                          <Typography
                            sx={{
                              fontFamily: 'var(--font-playfair)',
                              fontSize: '1.35rem',
                              fontWeight: 800,
                              letterSpacing: '0.02em',
                              color: '#1a1a1a',
                            }}
                          >
                            {activeCategory.name}
                          </Typography>
                          <Box
                            component={Link}
                            href={`/category/${activeCategory.slug}`}
                            onClick={() => { setOpen(false); onLinkClick?.(); }}
                            sx={{
                              fontSize: '0.75rem', color: '#888', textDecoration: 'none',
                              fontWeight: 500, letterSpacing: '0.06em',
                              '&:hover': { color: '#1a1a1a' },
                            }}
                          >
                            Shop all →
                          </Box>
                        </Box>

                        {activeCategory.children.length > 0 ? (
                          <Box sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: 0.5,
                          }}>
                            {activeCategory.children.map(child => (
                              <Box
                                key={child.id}
                                component={Link}
                                href={`/category/${child.slug}`}
                                onClick={() => { setOpen(false); onLinkClick?.(); }}
                                sx={{
                                  display: 'block', px: 1.5, py: 0.9,
                                  borderRadius: 1, textDecoration: 'none',
                                  color: '#444', fontSize: '0.82rem', fontWeight: 400,
                                  '&:hover': { bgcolor: '#f5f5f5', color: '#1a1a1a', fontWeight: 600 },
                                  transition: 'all 0.12s',
                                }}
                              >
                                {child.name}
                              </Box>
                            ))}

                            {/* "See all" link */}
                            <Box
                              component={Link}
                              href={`/category/${activeCategory.slug}`}
                              onClick={() => { setOpen(false); onLinkClick?.(); }}
                              sx={{
                                display: 'flex', alignItems: 'center', gap: 0.5,
                                px: 1.5, py: 0.9, borderRadius: 1, textDecoration: 'none',
                                color: '#b0a090', fontSize: '0.78rem', fontWeight: 600,
                                letterSpacing: '0.04em',
                                '&:hover': { color: '#1a1a1a' },
                              }}
                            >
                              See all {activeCategory.name} →
                            </Box>
                          </Box>
                        ) : (
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                              Browse our complete {activeCategory.name} collection.
                            </Typography>
                            <Box
                              component={Link}
                              href={`/category/${activeCategory.slug}`}
                              onClick={() => { setOpen(false); onLinkClick?.(); }}
                              sx={{
                                display: 'inline-flex', alignItems: 'center', gap: 1,
                                px: 2.5, py: 1, bgcolor: '#1a1a1a', color: 'white',
                                textDecoration: 'none', fontSize: '0.78rem',
                                fontWeight: 600, letterSpacing: '0.08em',
                                borderRadius: 0.5,
                                '&:hover': { bgcolor: '#333' },
                                transition: 'bg 0.15s',
                              }}
                            >
                              Shop All {activeCategory.name}
                              <ArrowForward sx={{ fontSize: 13 }} />
                            </Box>
                          </Box>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>

                {/* ── Right: category image panel ───────────── */}
                <Box sx={{ width: 240, py: 3, pl: 2, borderLeft: '1px solid #f0f0f0', display: { xs: 'none', lg: 'block' } }}>
                  <AnimatePresence mode="wait">
                    {activeCategory?.image && (
                      <motion.div
                        key={activeCategory.id + '-img'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Box
                          component={Link}
                          href={`/category/${activeCategory.slug}`}
                          onClick={() => { setOpen(false); onLinkClick?.(); }}
                          sx={{ display: 'block', textDecoration: 'none' }}
                        >
                          <Box
                            component="img"
                            src={activeCategory.image}
                            alt={activeCategory.name}
                            sx={{
                              width: '100%',
                              height: 280,
                              objectFit: 'cover',
                              borderRadius: 1.5,
                              display: 'block',
                              mb: 1.5,
                            }}
                          />
                          <Typography
                            sx={{
                              fontSize: '0.78rem', fontWeight: 600,
                              letterSpacing: '0.08em', textTransform: 'uppercase',
                              color: '#1a1a1a',
                            }}
                          >
                            Shop {activeCategory.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            View Collection →
                          </Typography>
                        </Box>
                      </motion.div>
                    )}
                    {(!activeCategory?.image) && (
                      <motion.div
                        key="editorial"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Box sx={{
                          height: 280, borderRadius: 1.5,
                          background: 'linear-gradient(135deg, #1a1a1a 0%, #3a3a3a 100%)',
                          display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', p: 3, mb: 1.5,
                        }}>
                          <Typography sx={{ color: '#c9a96e', fontSize: '0.65rem', letterSpacing: '0.2em', mb: 1 }}>
                            DISCOVER
                          </Typography>
                          <Typography sx={{
                            fontFamily: 'var(--font-playfair)', color: 'white',
                            fontSize: '1.3rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.3,
                          }}>
                            New Season
                          </Typography>
                          <Typography sx={{
                            fontFamily: 'var(--font-playfair)', color: 'white',
                            fontSize: '1.3rem', fontWeight: 700, textAlign: 'center', lineHeight: 1.3,
                          }}>
                            Styles
                          </Typography>
                          <Box
                            component={Link}
                            href="/shop?isNewArrival=true"
                            onClick={() => { setOpen(false); onLinkClick?.(); }}
                            sx={{
                              mt: 2.5, px: 2.5, py: 0.75,
                              border: '1px solid #c9a96e', color: '#c9a96e',
                              textDecoration: 'none', fontSize: '0.72rem',
                              letterSpacing: '0.1em', fontWeight: 600, borderRadius: 0.5,
                              '&:hover': { bgcolor: '#c9a96e', color: '#1a1a1a' },
                              transition: 'all 0.2s',
                            }}
                          >
                            SHOP NOW
                          </Box>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Box>

              </Box>
            </Container>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

// ── Mobile menu ───────────────────────────────────────────────────
/**
 * Rebuilt as a browsable list rather than a text accordion.
 *
 * The previous version was three sizes of the same grey text: a shopper on a
 * phone had to read every row to find anything, and the category images the
 * catalogue already carries went unused. Each row now leads with its own
 * thumbnail and says how many subcategories sit under it, so the menu can be
 * scanned instead of read.
 */
export function MegaMenuMobile({ categories, quickLinks, onLinkClick, layout }: MegaMenuProps) {
  const [expanded, setExpanded] = useState<string | false>(false);
  const links = quickLinks ?? [];
  const L = (layout ?? NAV_LAYOUT_DEFAULTS).mobile;

  // Centred labels have no shared left edge to hold, so the rows centre their
  // whole content instead; left-aligned rows keep the 16px gutter that the
  // drawer's other blocks use.
  const centred = L.align === 'center';
  const rowJustify = centred ? 'center' : 'flex-start';
  const showThumb = L.thumbWidth > 0;

  return (
    <Box>
      {/* Quick links as chips — three taps' worth of intent, one row. */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: rowJustify, gap: 0.75, px: 2, pb: 1.5 }}>
        {links.map(q => (
          <Box
            key={q.id || q.url}
            component={Link}
            href={q.url}
            onClick={onLinkClick}
            sx={{
              px: 1.5, py: 0.6,
              border: '1px solid #e6e2dc', borderRadius: 5,
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
              color: '#6b5f4e', textDecoration: 'none', bgcolor: '#fdfcfa',
              '&:active': { bgcolor: '#1a1a1a', color: '#fff' },
            }}
          >
            {q.label}
          </Box>
        ))}
      </Box>

      <Divider sx={{ mb: 0.5 }} />

      {categories.map(cat => {
        const isOpen = expanded === cat.id;
        const childCount = cat.children.length;
        return (
          <Box key={cat.id} sx={{ borderBottom: '1px solid #f4f4f4' }}>
            <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
              {/* The name is a link, always. Tapping a category should reach
                  that category — expanding is the secondary action, which is
                  why it has its own hit area on the right. */}
              <Box
                component={Link}
                href={`/category/${cat.slug}`}
                onClick={onLinkClick}
                sx={{
                  flex: 1, minWidth: 0,
                  display: 'flex', alignItems: 'center', justifyContent: rowJustify, gap: 1.5,
                  px: 2, py: L.rowPadding,
                  textDecoration: 'none', color: 'inherit',
                  '&:active': { bgcolor: '#fafafa' },
                }}
              >
                {showThumb && (
                <Box sx={{
                  width: L.thumbWidth, height: L.thumbHeight, borderRadius: 1, flexShrink: 0,
                  overflow: 'hidden', bgcolor: '#f3f1ee',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {cat.image ? (
                    <Box
                      component="img"
                      src={cat.image}
                      alt=""
                      loading="lazy"
                      sx={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }}
                    />
                  ) : (
                    <Typography sx={{
                      fontFamily: 'var(--font-playfair)', fontSize: '1.1rem',
                      fontWeight: 700, color: '#c9b79a',
                    }}>
                      {cat.name.charAt(0)}
                    </Typography>
                  )}
                </Box>
                )}

                <Box sx={{ minWidth: 0, textAlign: centred ? 'center' : 'left' }}>
                  <Typography sx={{
                    fontSize: '0.9rem', fontWeight: 700, color: '#1a1a1a',
                    lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {cat.name}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: '#9a9a9a', letterSpacing: '0.03em' }}>
                    {childCount > 0 ? `${childCount} ${childCount === 1 ? 'category' : 'categories'}` : 'Shop now'}
                  </Typography>
                </Box>
              </Box>

              {childCount > 0 && (
                <IconButton
                  onClick={() => setExpanded(isOpen ? false : cat.id)}
                  aria-label={isOpen ? `Collapse ${cat.name}` : `Expand ${cat.name}`}
                  sx={{ px: 2, borderRadius: 0, color: '#bbb', '&:active': { bgcolor: '#fafafa' } }}
                >
                  {isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
                </IconButton>
              )}
            </Box>

            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Box sx={{ pl: 2, pr: 2, pb: 1.5, display: 'flex', flexWrap: 'wrap', justifyContent: rowJustify, gap: 0.75 }}>
                <Box
                  component={Link}
                  href={`/category/${cat.slug}`}
                  onClick={onLinkClick}
                  sx={{
                    px: 1.5, py: 0.65, borderRadius: 5,
                    bgcolor: '#1a1a1a', color: '#fff',
                    fontSize: '0.74rem', fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  All {cat.name}
                </Box>
                {cat.children.map(child => (
                  <Box
                    key={child.id}
                    component={Link}
                    href={`/category/${child.slug}`}
                    onClick={onLinkClick}
                    sx={{
                      px: 1.5, py: 0.65, borderRadius: 5,
                      border: '1px solid #e8e8e8', bgcolor: '#fff',
                      fontSize: '0.74rem', fontWeight: 500, color: '#444',
                      textDecoration: 'none',
                      '&:active': { bgcolor: '#1a1a1a', color: '#fff', borderColor: '#1a1a1a' },
                    }}
                  >
                    {child.name}
                  </Box>
                ))}
              </Box>
            </Collapse>
          </Box>
        );
      })}

      <ListItemButton
        component={Link}
        href="/categories"
        onClick={onLinkClick}
        sx={{ py: 1.4, px: 2, justifyContent: rowJustify, color: 'inherit', textDecoration: 'none' }}
      >
        {/* Default is 'after': a leading icon pushed this label to 39px from the
            drawer edge, lining up with nothing — the links above sit at 16px.
            Trailing, it reads as an affordance instead of shifting the text. */}
        {L.viewAllIcon === 'before' && <GridView sx={{ fontSize: 15, color: '#aaa', mr: 1 }} />}
        <ListItemText
          primary="View All Categories"
          primaryTypographyProps={{ fontSize: '0.82rem', color: '#888', fontWeight: 600 }}
          sx={{ flex: centred ? '0 1 auto' : '1 1 auto', textAlign: centred ? 'center' : 'left' }}
        />
        {L.viewAllIcon === 'after' && <GridView sx={{ fontSize: 15, color: '#aaa', ml: 1 }} />}
      </ListItemButton>
    </Box>
  );
}
