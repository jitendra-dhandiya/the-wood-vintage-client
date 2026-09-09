'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AppBar, Toolbar, Box, IconButton, Badge, Typography,
  Drawer, List, ListItem, ListItemText, InputBase, Container,
  Divider, Avatar, Menu, MenuItem,
  useMediaQuery, useTheme, Button, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import {
  Search, ShoppingBag, FavoriteBorder, PersonOutline,
  Menu as MenuIcon, Close,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppSelector, useAppDispatch } from '../../store';
import { toggleCart } from '../../store/slices/cartSlice';
import { setGender, type GenderType } from '../../store/slices/genderSlice';
import { persistGender } from '../../lib/genderPreference';
import { openLoginModal } from '../../store/slices/uiSlice';
import { useAuth } from '../../hooks/useAuth';
import { productApi } from '../../services/api.service';
import { MegaMenuDesktop, MegaMenuMobile, resolveQuickLinks, type NavCategory, type QuickLink } from './MegaMenu';
import { visibleNavCategories } from '../../lib/navMenu';
import { resolveNavLayout } from '../../lib/navLayout';
import {
  HEADER_BEFORE, HEADER_AFTER, fromApi, resolveHeaderLinks, visibleHeaderLinks,
} from '../../lib/headerLinks';

/**
 * Intrinsic aspect ratio of the brand lockup (public/logo-mark.png, 1092x240).
 *
 * Two problems are fixed by this asset + ratio pair:
 *
 *   1. The original /logo.jpg was 4500x4500 — a perfect square with ~60% white
 *      padding. `width: auto` against a fixed height can only ever render a
 *      square from a square source, which is why the logo looked 1:1 no matter
 *      what width/height props were passed.
 *
 *   2. The artwork is a STACKED lockup (monogram above wordmark). Constraining
 *      a stacked mark by height crushes the type: at a 72px navbar height the
 *      wordmark rendered ~10px tall and was unreadable. It is now recomposed
 *      horizontally — monogram left, wordmark right — legible down to 30px.
 *
 * Keep this value in step with the shipped asset.
 */
const LOGO_ASPECT = '1092 / 240';

/** Rows as the nav-menus endpoint returns them. */
interface NavLinkRow {
  id?: string;
  label?: string;
  url?: string | null;
  gender?: string | null;
}

interface NavbarProps {
  settings?: Record<string, string>;
  navCategories?: NavCategory[];
  /** Admin-managed quick links for the Shop menu; empty falls back to defaults. */
  quickLinks?: QuickLink[];
  /** Admin-managed header links left and right of the Shop trigger. */
  headerBefore?: NavLinkRow[];
  headerAfter?: NavLinkRow[];
}

export default function Navbar({
  settings = {}, navCategories = [], quickLinks = [],
  headerBefore = [], headerAfter = [],
}: NavbarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { itemCount } = useAppSelector((s) => s.cart);
  const gender = useAppSelector((s) => s.gender.selected);

  // Parents AND their children are filtered — see lib/navMenu. Previously only
  // the parents were, which is how "Mens denim" appeared under DENIM while the
  // shopper was browsing WOMEN.
  const filteredNavCategories = useMemo(
    () => visibleNavCategories(navCategories, gender),
    [navCategories, gender]
  );

  // A link tagged ALL shows on both storefronts; WOMEN/MEN show only on theirs.
  const filteredQuickLinks = useMemo(
    () => resolveQuickLinks(quickLinks).filter(link => {
      const g = (link.gender || 'ALL').toUpperCase();
      return g === 'ALL' || g === gender;
    }),
    [quickLinks, gender]
  );
  // Same contract as the quick links: fall back to the built-in set BEFORE
  // filtering by gender, so targeting every link at one storefront empties the
  // other run rather than quietly reinstating the defaults there.
  const linksBefore = useMemo(
    () => visibleHeaderLinks(resolveHeaderLinks(fromApi(headerBefore), HEADER_BEFORE), gender),
    [headerBefore, gender]
  );
  const linksAfter = useMemo(
    () => visibleHeaderLinks(resolveHeaderLinks(fromApi(headerAfter), HEADER_AFTER), gender),
    [headerAfter, gender]
  );
  /** The drawer lists both runs together, left-of-Shop first. */
  const drawerLinks = useMemo(() => [...linksBefore, ...linksAfter], [linksBefore, linksAfter]);

  const { user, isAuthenticated, logout, isAdmin } = useAuth();

  const handleGenderChange = (g: GenderType) => {
    if (gender === g) return;
    dispatch(setGender(g));
    // Cookie, not just localStorage: the next server render reads this to pick
    // which gender's catalogue to send.
    persistGender(g);
  };

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let rafId = 0;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => setScrolled(window.scrollY > 50));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const { data } = await productApi.search({ q: searchQuery.trim(), limit: 6 });
        setSearchResults((data as any).data || []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => { if (searchDebounce.current) clearTimeout(searchDebounce.current); };
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const genderToggleEnabled = settings.gender_toggle_enabled !== 'false';

  // Admin-managed drawer and mega-panel geometry. Derived, never stored: the
  // settings object is re-fetched on every request, so a saved change shows up
  // on the next page load without anything here to invalidate.
  const navLayout = useMemo(() => resolveNavLayout(settings), [settings]);
  const drawerCentred = navLayout.mobile.align === 'center';

  return (
    <>
      {/* Announcement Bar */}
      <Box
        sx={{
          bgcolor: '#1a1a1a',
          py: 0.75,
          textAlign: 'center',
          color: 'white',
          fontSize: '0.75rem',
          letterSpacing: '0.08em',
          fontWeight: 500,
        }}
      >
        {settings.announcement_text || 'FREE SHIPPING ON ORDERS ABOVE ₹999'}
      </Box>

      {/* Gender Toggle Bar */}
      {genderToggleEnabled && (
        <Box
          sx={{
            bgcolor: 'white',
            borderBottom: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            justifyContent: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 1200,
          }}
        >
          {(['WOMEN', 'MEN'] as const).map((g) => (
            <Button
              key={g}
              onClick={() => handleGenderChange(g)}
              disableRipple
              sx={{
                px: { xs: 4, md: 6 },
                py: 0.9,
                borderRadius: 0,
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                color: gender === g ? '#1a1a1a' : '#aaa',
                borderBottom: gender === g ? '2px solid #1a1a1a' : '2px solid transparent',
                transition: 'color 0.2s, border-color 0.2s',
                minWidth: 0,
                '&:hover': {
                  bgcolor: 'transparent',
                  color: '#1a1a1a',
                },
              }}
            >
              {g}
            </Button>
          ))}
        </Box>
      )}

      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: scrolled ? 'rgba(255,255,255,0.98)' : 'white',
          color: 'text.primary',
          borderBottom: '1px solid',
          borderColor: 'divider',
          transition: 'background-color 0.25s ease, box-shadow 0.25s ease',
          boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters sx={{ height: { xs: 64, md: 88 }, gap: 1 }}>
            {/* Mobile menu button */}
            {isMobile && (
              <IconButton onClick={() => setMobileOpen(true)} sx={{ ml: -1 }}>
                <MenuIcon />
              </IconButton>
            )}

            {/* Logo */}
            <Box sx={{ flexGrow: { xs: 1, md: 0 }, display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, mr: { md: 5 } }}>
              <Link href="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                {settings.logo_url ? (
                  /**
                   * Height is set per breakpoint and the width follows from
                   * aspect-ratio, so the box is reserved before the image loads
                   * (no layout shift) and there is no useMediaQuery hydration
                   * flash on first paint.
                   */
                  <Box
                    sx={{
                      position: 'relative',
                      // Widths that follow: 143px / 171px / 209px.
                      height: { xs: 30, sm: 36, md: 44 },
                      aspectRatio: LOGO_ASPECT,
                      flexShrink: 0,
                      // Never let the lockup crowd out the nav actions on a
                      // narrow phone.
                      maxWidth: { xs: '58vw', sm: 'none' },
                    }}
                  >
                    <Image
                      src={settings.logo_url}
                      alt={settings.site_name || 'Unique Dressup'}
                      fill
                      // Already sized and compressed at build time; skip the
                      // loader so we don't emit a srcset of identical URLs.
                      unoptimized
                      style={{ objectFit: 'contain', objectPosition: 'left center' }}
                      priority
                    />
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: 'var(--font-playfair)',
                        fontWeight: 800,
                        letterSpacing: '0.18em',
                        color: '#1a1a1a',
                        fontSize: { xs: '1.25rem', md: '1.8rem' },
                        lineHeight: 1,
                        textTransform: 'uppercase',
                      }}
                    >
                      {settings.site_name || 'Unique Dressup'}
                    </Typography>
                    <Typography sx={{ fontSize: '0.52rem', letterSpacing: '0.35em', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', mt: 0.5 }}>
                      Fashion &amp; Lifestyle
                    </Typography>
                  </Box>
                )}
              </Link>
            </Box>

            {/* Desktop nav links */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 0, flexGrow: 1, height: '100%' }}>
                {linksBefore.map((link) => (
                  <Button
                    key={link.id || link.href}
                    component={Link}
                    href={link.href}
                    sx={{
                      color: 'text.primary',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      px: 1.5,
                      borderRadius: 0,
                      borderBottom: '2px solid transparent',
                      '&:hover': { color: '#1a1a1a', bgcolor: 'transparent', borderBottomColor: '#1a1a1a' },
                      transition: 'color 0.2s, border-color 0.2s',
                    }}
                  >
                    {link.label}
                  </Button>
                ))}

                {/* Shop sits second, where shoppers look for it — not after Blog. */}
                {filteredNavCategories.length > 0 && (
                  <MegaMenuDesktop categories={filteredNavCategories} quickLinks={filteredQuickLinks} layout={navLayout} />
                )}

                {linksAfter.map((link) => (
                  <Button
                    key={link.id || link.href}
                    component={Link}
                    href={link.href}
                    sx={{
                      color: 'text.primary',
                      fontWeight: 500,
                      fontSize: '0.8rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      px: 1.5,
                      borderRadius: 0,
                      borderBottom: '2px solid transparent',
                      '&:hover': { color: '#1a1a1a', bgcolor: 'transparent', borderBottomColor: '#1a1a1a' },
                      transition: 'color 0.2s, border-color 0.2s',
                    }}
                  >
                    {link.label}
                  </Button>
                ))}
              </Box>
            )}

            {/* Icons */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton onClick={() => setSearchOpen(true)} size="small">
                <Search fontSize="small" />
              </IconButton>

              {isAuthenticated ? (
                <>
                  <IconButton component={Link} href="/account/wishlist" size="small">
                    <FavoriteBorder fontSize="small" />
                  </IconButton>
                  <IconButton
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    size="small"
                  >
                    <Avatar
                      src={user?.avatar}
                      sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: '#1a1a1a' }}
                    >
                      {user?.firstName?.charAt(0)}
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={() => setAnchorEl(null)}
                    PaperProps={{ sx: { mt: 1, minWidth: 180, boxShadow: 3 } }}
                  >
                    <MenuItem component={Link} href="/account/orders" onClick={() => setAnchorEl(null)}>
                      My Orders
                    </MenuItem>
                    <MenuItem component={Link} href="/account/profile" onClick={() => setAnchorEl(null)}>
                      Profile
                    </MenuItem>
                    <MenuItem component={Link} href="/account/addresses" onClick={() => setAnchorEl(null)}>
                      Addresses
                    </MenuItem>
                    {isAdmin && (
                      <MenuItem component={Link} href="/admin/dashboard" onClick={() => setAnchorEl(null)}>
                        Admin Panel
                      </MenuItem>
                    )}
                    <Divider />
                    <MenuItem onClick={() => { setAnchorEl(null); setLogoutConfirm(true); }} sx={{ color: 'error.main' }}>
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <IconButton size="small" onClick={() => dispatch(openLoginModal())}>
                  <PersonOutline fontSize="small" />
                </IconButton>
              )}

              <IconButton onClick={() => dispatch(toggleCart())} size="small" sx={{ position: 'relative' }}>
                <Badge
                  badgeContent={itemCount}
                  sx={{
                    '& .MuiBadge-badge': {
                      bgcolor: '#1a1a1a',
                      color: 'white',
                      minWidth: 18,
                      height: 18,
                      fontSize: '0.65rem',
                    },
                  }}
                >
                  <ShoppingBag fontSize="small" />
                </Badge>
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 1400,
              background: 'rgba(0,0,0,0.85)', display: 'flex',
              flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
              paddingTop: '15vh',
            }}
            onClick={(e) => e.target === e.currentTarget && closeSearch()}
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              style={{ width: '100%', maxWidth: 640, padding: '0 24px' }}
            >
              <Typography sx={{ color: 'white', textAlign: 'center', mb: 3, fontFamily: 'var(--font-playfair)', fontSize: '1.5rem' }}>
                Search for anything
              </Typography>
              <form onSubmit={handleSearch}>
                <Box sx={{
                  display: 'flex', alignItems: 'center', bgcolor: 'white',
                  borderRadius: searchResults.length > 0 || searchLoading ? '8px 8px 0 0' : 1,
                  overflow: 'hidden', px: 2, py: 1,
                }}>
                  <Search sx={{ color: '#666', mr: 1 }} />
                  <InputBase
                    autoFocus
                    placeholder="T-shirts, dresses, jeans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1, fontSize: '1rem' }}
                  />
                  {searchLoading ? (
                    <CircularProgress size={16} sx={{ color: '#666', mr: 0.5 }} />
                  ) : searchQuery ? (
                    <IconButton size="small" onClick={() => { setSearchQuery(''); setSearchResults([]); }}>
                      <Close fontSize="small" />
                    </IconButton>
                  ) : null}
                </Box>
              </form>

              {/* Search suggestions */}
              {(searchResults.length > 0 || (searchLoading && searchQuery.length >= 2)) && (
                <Box sx={{ bgcolor: 'white', borderRadius: '0 0 8px 8px', overflow: 'hidden', boxShadow: 4 }}>
                  {searchResults.map((p: any) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug}`}
                      onClick={closeSearch}
                      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.25,
                        '&:hover': { bgcolor: '#f5f5f5' }, transition: 'background 0.15s',
                        borderTop: '1px solid #f0f0f0',
                        cursor: 'pointer',
                      }}>
                        {p.images?.[0]?.url ? (
                          <Box
                            component="img"
                            src={p.images[0].url}
                            alt={p.name}
                            sx={{ width: 40, height: 48, objectFit: 'cover', borderRadius: 0.5, flexShrink: 0 }}
                          />
                        ) : (
                          <Box sx={{ width: 40, height: 48, bgcolor: '#f0f0f0', borderRadius: 0.5, flexShrink: 0 }} />
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#1a1a1a', lineHeight: 1.3 }} noWrap>
                            {p.name}
                          </Typography>
                          {p.category && (
                            <Typography variant="caption" sx={{ color: '#999' }}>{p.category.name}</Typography>
                          )}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a1a1a', flexShrink: 0 }}>
                          ₹{p.salePrice || p.basePrice}
                        </Typography>
                      </Box>
                    </Link>
                  ))}
                  {searchQuery.trim().length >= 2 && (
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery.trim())}`}
                      onClick={closeSearch}
                      style={{ textDecoration: 'none', display: 'block' }}
                    >
                      <Box sx={{
                        px: 2, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderTop: '1px solid #f0f0f0', bgcolor: '#fafafa',
                        '&:hover': { bgcolor: '#f0f0f0' }, cursor: 'pointer',
                      }}>
                        <Search sx={{ fontSize: 14, mr: 0.75, color: '#666' }} />
                        <Typography variant="caption" sx={{ color: '#444', fontWeight: 500 }}>
                          View all results for &quot;{searchQuery}&quot;
                        </Typography>
                      </Box>
                    </Link>
                  )}
                </Box>
              )}
            </motion.div>
            <IconButton
              onClick={closeSearch}
              sx={{ position: 'absolute', top: 16, right: 16, color: 'white' }}
            >
              <Close />
            </IconButton>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        {/* The admin range tops out at 420px, which is wider than a 360-390px
            phone. The vw ceiling keeps the close button on screen whatever is set. */}
        <Box sx={{ width: navLayout.mobile.drawerWidth, maxWidth: '85vw' }}>
          <Box sx={{ px: 2.5, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
            {settings.logo_url ? (
              <Box sx={{ position: 'relative', height: 34, aspectRatio: LOGO_ASPECT, flexShrink: 1, minWidth: 0, maxWidth: '70%' }}>
                <Image
                  src={settings.logo_url}
                  alt={settings.site_name || 'Unique Dressup'}
                  fill
                  unoptimized
                  style={{ objectFit: 'contain', objectPosition: 'left center' }}
                />
              </Box>
            ) : (
              <Box>
                <Typography sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, letterSpacing: '0.15em', fontSize: '1.15rem', textTransform: 'uppercase', lineHeight: 1 }}>
                  {settings.site_name || 'Unique Dressup'}
                </Typography>
                <Typography sx={{ fontSize: '0.52rem', letterSpacing: '0.3em', color: '#aaa', fontWeight: 600, textTransform: 'uppercase', mt: 0.4 }}>
                  Fashion &amp; Lifestyle
                </Typography>
              </Box>
            )}
            <IconButton onClick={() => setMobileOpen(false)} sx={{ ml: 1 }}>
              <Close />
            </IconButton>
          </Box>
          {/* Gender toggle in mobile drawer */}
          {genderToggleEnabled && (
            <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider' }}>
              {(['WOMEN', 'MEN'] as const).map((g) => (
                <Button
                  key={g}
                  fullWidth
                  onClick={() => { handleGenderChange(g); }}
                  disableRipple
                  sx={{
                    py: 1.25,
                    borderRadius: 0,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    letterSpacing: '0.15em',
                    color: gender === g ? '#1a1a1a' : '#aaa',
                    borderBottom: gender === g ? '2px solid #1a1a1a' : '2px solid transparent',
                    '&:hover': { bgcolor: 'transparent', color: '#1a1a1a' },
                  }}
                >
                  {g}
                </Button>
              ))}
            </Box>
          )}
          <List>
            {drawerLinks.map((link) => (
              <ListItem key={link.id || link.href} component={Link} href={link.href} onClick={() => setMobileOpen(false)}
                sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { bgcolor: '#f5f5f5' } }}>
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem', letterSpacing: '0.04em', color: '#1a1a1a' }}
                  sx={{ textAlign: drawerCentred ? 'center' : 'left' }}
                />
              </ListItem>
            ))}
            {filteredNavCategories.length > 0 && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ px: 2, py: 0.75, textAlign: drawerCentred ? 'center' : 'left' }}>
                  <Typography variant="overline" sx={{ fontSize: '0.6rem', letterSpacing: '0.15em', color: '#aaa' }}>
                    Shop by Category
                  </Typography>
                </Box>
                <MegaMenuMobile categories={filteredNavCategories} quickLinks={filteredQuickLinks} layout={navLayout} onLinkClick={() => setMobileOpen(false)} />
              </>
            )}
            <Divider sx={{ my: 1 }} />
            {isAuthenticated ? (
              <>
                <ListItem component={Link} href="/account/orders" onClick={() => setMobileOpen(false)}
                  sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <ListItemText primary="My Orders" primaryTypographyProps={{ color: '#1a1a1a', fontWeight: 500, fontSize: '0.9rem' }} sx={{ textAlign: drawerCentred ? 'center' : 'left' }} />
                </ListItem>
                <ListItem component={Link} href="/account/profile" onClick={() => setMobileOpen(false)}
                  sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { bgcolor: '#f5f5f5' } }}>
                  <ListItemText primary="Profile" primaryTypographyProps={{ color: '#1a1a1a', fontWeight: 500, fontSize: '0.9rem' }} sx={{ textAlign: drawerCentred ? 'center' : 'left' }} />
                </ListItem>
                <ListItem onClick={() => { setMobileOpen(false); setLogoutConfirm(true); }}
                  sx={{ '&:hover': { bgcolor: '#fff5f5' }, cursor: 'pointer' }}>
                  <ListItemText primary="Logout" primaryTypographyProps={{ color: 'error.main', fontWeight: 500, fontSize: '0.9rem' }} sx={{ textAlign: drawerCentred ? 'center' : 'left' }} />
                </ListItem>
              </>
            ) : (
              <>
                <ListItem
                  onClick={() => { setMobileOpen(false); dispatch(openLoginModal()); }}
                  sx={{ '&:hover': { bgcolor: '#f5f5f5' }, cursor: 'pointer' }}
                >
                  <ListItemText primary="Login" sx={{ textAlign: drawerCentred ? 'center' : 'left' }} />
                </ListItem>
                <ListItem
                  onClick={() => { setMobileOpen(false); dispatch(openLoginModal()); }}
                  sx={{ '&:hover': { bgcolor: '#f5f5f5' }, cursor: 'pointer' }}
                >
                  <ListItemText primary="Register" sx={{ textAlign: drawerCentred ? 'center' : 'left' }} />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>

      {/* Logout confirmation */}
      <Dialog open={logoutConfirm} onClose={() => setLogoutConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to log out?</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setLogoutConfirm(false)} variant="outlined" sx={{ borderColor: '#ccc', color: 'text.primary' }}>
            Cancel
          </Button>
          <Button
            onClick={() => { logout(); setLogoutConfirm(false); }}
            variant="contained"
            sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}
          >
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
