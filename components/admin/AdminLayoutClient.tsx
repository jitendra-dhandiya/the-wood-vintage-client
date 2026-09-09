'use client';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Box, AppBar, Toolbar, Typography, IconButton, Drawer, List,
  ListItem, ListItemIcon, ListItemText, Divider, Avatar, Menu,
  MenuItem, Collapse, useMediaQuery, useTheme, Badge, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button,
  Paper, InputBase, ClickAwayListener,
} from '@mui/material';
import {
  Dashboard, Inventory2, Category, ShoppingCart, People,
  BarChart, Settings, Image, Article, LocalOffer, Star, Replay,
  ExpandLess, ExpandMore, Menu as MenuIcon, ChevronLeft,
  Web, Collections, Tune, Policy, Logout, Person,
  ManageAccounts, AttachMoney, Search, LocalShipping,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useEffect } from 'react';

const DRAWER_WIDTH = 256;

const NAV_ITEMS = [
  { label: 'Dashboard', icon: <Dashboard fontSize="small" />, href: '/admin/dashboard' },
  { label: 'Orders', icon: <ShoppingCart fontSize="small" />, href: '/admin/orders' },
  {
    label: 'Catalog',
    icon: <Inventory2 fontSize="small" />,
    children: [
      { label: 'Products', href: '/admin/products' },
      { label: 'Categories', href: '/admin/categories' },
      { label: 'Collections', href: '/admin/collections' },
    ],
  },
  { label: 'Customers', icon: <People fontSize="small" />, href: '/admin/customers' },
  {
    label: 'Content',
    icon: <Web fontSize="small" />,
    children: [
      { label: 'Homepage Builder', href: '/admin/homepage' },
      { label: 'Menu Links', href: '/admin/menu-links' },
      { label: 'Marquee / Ticker', href: '/admin/marquee' },
      { label: 'Banners', href: '/admin/banners' },
      { label: 'Instagram Reels', href: '/admin/instagram-reels' },
      { label: 'Store Locations', href: '/admin/stores' },
      { label: 'Blogs', href: '/admin/blogs' },
    ],
  },
  { label: 'Coupons', icon: <LocalOffer fontSize="small" />, href: '/admin/coupons' },
  { label: 'Reviews', icon: <Star fontSize="small" />, href: '/admin/reviews' },
  { label: 'Returns', icon: <Replay fontSize="small" />, href: '/admin/returns' },
  {
    label: 'Shipping',
    icon: <LocalShipping fontSize="small" />,
    children: [
      { label: 'Shipments', href: '/admin/shipping' },
      { label: 'Settings', href: '/admin/shipping/settings' },
    ],
  },
  { label: 'Media', icon: <Image fontSize="small" />, href: '/admin/media' },
  { label: 'Reports', icon: <BarChart fontSize="small" />, href: '/admin/reports' },
  {
    label: 'Configure',
    icon: <Tune fontSize="small" />,
    children: [
      { label: 'SEO', href: '/admin/seo' },
      { label: 'Settings', href: '/admin/settings' },
    ],
  },
];

// Flat list of every nav destination for the search box
const FLAT_NAV = NAV_ITEMS.flatMap(item =>
  item.children
    ? item.children.map(child => ({ label: child.label, href: child.href, group: item.label, icon: item.icon }))
    : [{ label: item.label, href: item.href!, group: null as string | null, icon: item.icon }]
);

interface Props {
  children: React.ReactNode;
}

export default function AdminLayoutClient({ children }: Props) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [expanded, setExpanded] = useState<string>('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin && user.role !== 'SUB_ADMIN') {
      // Not "/" — the customer sign-in has no password field, so a signed-out
      // admin sent there has no way back in.
      router.push('/admin-login');
    }
  }, [user, isAdmin, router]);

  const toggleExpand = (label: string) => {
    setExpanded(expanded === label ? '' : label);
  };

  const isActive = (href?: string) => href && pathname.startsWith(href);

  const DrawerContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0d0d0d' }}>
      {/* Logo */}
      <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 600, color: 'white', letterSpacing: '0.1em' }}>
          Unique Dressup
        </Typography>
        {/* <Typography variant="caption" sx={{ color: '#c9a84c', fontWeight: 600 }}>Admin</Typography> */}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        <List dense>
          {NAV_ITEMS.map((item) => (
            <Box key={item.label}>
              {item.children ? (
                <>
                  <ListItem
                    onClick={() => toggleExpand(item.label)}
                    sx={{
                      px: 2.5, py: 1, cursor: 'pointer', borderRadius: 1, mx: 1,
                      color: 'rgba(255,255,255,0.7)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: 'white' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{item.icon}</ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: 500 }} />
                    {expanded === item.label ? <ExpandLess fontSize="small" sx={{ opacity: 0.5 }} /> : <ExpandMore fontSize="small" sx={{ opacity: 0.5 }} />}
                  </ListItem>
                  <Collapse in={expanded === item.label}>
                    {item.children.map((child) => (
                      <ListItem
                        key={child.href}
                        component={Link}
                        href={child.href}
                        sx={{
                          pl: 6, py: 0.75, cursor: 'pointer', borderRadius: 1, mx: 1,
                          textDecoration: 'none',
                          color: isActive(child.href) ? '#c9a84c' : 'rgba(255,255,255,0.55)',
                          bgcolor: isActive(child.href) ? 'rgba(201,168,76,0.1)' : 'transparent',
                          '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.04)' },
                        }}
                      >
                        <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: isActive(child.href) ? 700 : 400 }} />
                      </ListItem>
                    ))}
                  </Collapse>
                </>
              ) : (
                <ListItem
                  component={Link}
                  href={item.href!}
                  sx={{
                    px: 2.5, py: 1, borderRadius: 1, mx: 1, mb: 0.25,
                    textDecoration: 'none',
                    color: isActive(item.href) ? '#c9a84c' : 'rgba(255,255,255,0.7)',
                    bgcolor: isActive(item.href) ? 'rgba(201,168,76,0.1)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: 'white' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.82rem', fontWeight: isActive(item.href) ? 700 : 500 }} />
                </ListItem>
              )}
            </Box>
          ))}
        </List>
      </Box>

      {/* User info */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, bgcolor: '#c9a84c', fontSize: '0.8rem', fontWeight: 700 }}>
          {user?.firstName?.charAt(0)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="caption" sx={{ color: 'white', fontWeight: 700, display: 'block' }} noWrap>
            Unique Dreessup
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.65rem', textTransform: 'uppercase' }}>
            {user?.role}
          </Typography>
        </Box>
        <Tooltip title="Logout">
          <IconButton size="small" onClick={() => setLogoutConfirm(true)} sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ef5350' } }}>
            <Logout fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f7' }}>
      {/* Sidebar */}
      {isMobile ? (
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: DRAWER_WIDTH } }}>
          <DrawerContent />
        </Drawer>
      ) : (
        <Box sx={{ width: drawerOpen ? DRAWER_WIDTH : 0, flexShrink: 0, transition: 'width 0.2s' }}>
          <Box sx={{ width: DRAWER_WIDTH, position: 'fixed', top: 0, left: 0, height: '100vh', overflowY: 'auto' }}>
            <DrawerContent />
          </Box>
        </Box>
      )}

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <AppBar elevation={0} position="sticky" sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', color: 'text.primary' }}>
          <Toolbar sx={{ gap: 2 }}>
            <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
              <MenuIcon />
            </IconButton>

            {/* Nav search */}
            <ClickAwayListener onClickAway={() => { setNavSearch(''); setSearchFocused(false); }}>
              <Box sx={{ position: 'relative', flex: 1, maxWidth: 360 }}>
                <Box sx={{
                  display: 'flex', alignItems: 'center', gap: 1,
                  bgcolor: searchFocused ? 'white' : '#f5f5f7',
                  border: '1px solid', borderColor: searchFocused ? '#1a1a1a' : 'transparent',
                  borderRadius: 2, px: 1.5, py: 0.5,
                  transition: 'all 0.2s',
                }}>
                  <Search sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <InputBase
                    placeholder="Search navigation…"
                    value={navSearch}
                    onChange={e => setNavSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    inputProps={{ 'aria-label': 'search navigation' }}
                    sx={{ fontSize: '0.85rem', flex: 1 }}
                  />
                  {navSearch && (
                    <IconButton size="small" onClick={() => setNavSearch('')} sx={{ p: 0.25 }}>
                      <Box sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1 }}>✕</Box>
                    </IconButton>
                  )}
                </Box>

                {/* Dropdown results */}
                {searchFocused && navSearch.trim() && (() => {
                  const q = navSearch.toLowerCase();
                  const results = FLAT_NAV.filter(n =>
                    n.label.toLowerCase().includes(q) || (n.group?.toLowerCase().includes(q) ?? false)
                  );
                  return results.length > 0 ? (
                    <Paper elevation={8} sx={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 1400, borderRadius: 2, overflow: 'hidden', maxHeight: 320, overflowY: 'auto' }}>
                      {results.map(item => (
                        <Box
                          key={item.href}
                          component={Link}
                          href={item.href}
                          onClick={() => { setNavSearch(''); setSearchFocused(false); }}
                          sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            px: 2, py: 1.25, textDecoration: 'none', color: 'text.primary',
                            '&:hover': { bgcolor: '#f5f5f7' },
                            borderBottom: '1px solid', borderColor: 'divider',
                            '&:last-child': { borderBottom: 'none' },
                          }}
                        >
                          <Box sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                            {item.icon}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>{item.label}</Typography>
                            {item.group && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{item.group}</Typography>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Paper>
                  ) : (
                    <Paper elevation={8} sx={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 1400, borderRadius: 2, px: 2, py: 2 }}>
                      <Typography variant="body2" color="text.secondary">No results for &quot;{navSearch}&quot;</Typography>
                    </Paper>
                  );
                })()}
              </Box>
            </ClickAwayListener>

            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" sx={{ bgcolor: '#f0f0f0', px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 600 }}>
              {user?.role}
            </Typography>
            <IconButton component={Link} href="/" target="_blank" title="View Store">
              <Web fontSize="small" />
            </IconButton>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
          {children}
        </Box>
      </Box>
      <Dialog open={logoutConfirm} onClose={() => setLogoutConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Logout</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to log out?</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setLogoutConfirm(false)} variant="outlined" sx={{ borderColor: '#ccc', color: 'text.primary' }}>
            Cancel
          </Button>
          <Button onClick={() => { logout(); setLogoutConfirm(false); }} variant="contained" sx={{ bgcolor: '#d32f2f', '&:hover': { bgcolor: '#b71c1c' } }}>
            Logout
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
