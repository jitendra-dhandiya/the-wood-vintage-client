'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Paper, BottomNavigation, BottomNavigationAction, Badge, useMediaQuery, useTheme } from '@mui/material';
import { Home, Search, ShoppingBag, FavoriteBorder, PersonOutline } from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store';
import { openCart } from '../../store/slices/cartSlice';

export default function MobileBottomNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const { itemCount } = useAppSelector((s) => s.cart);

  if (!isMobile || pathname.startsWith('/admin')) return null;

  const getActive = () => {
    if (pathname === '/') return 0;
    if (pathname.startsWith('/search')) return 1;
    if (pathname.startsWith('/account/wishlist')) return 3;
    if (pathname.startsWith('/account')) return 4;
    return -1;
  };

  return (
    <Paper
      className="mobile-bottom-nav"
      elevation={0}
      sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200,
        borderTop: '1px solid', borderColor: 'divider',
        display: { md: 'none' },
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* MUI gives each action an 80px minimum; five of them need 400px, which is
          wider than most phones (360-393). The overflow pushed the outer icons
          off both edges. flex:1 already shares the bar out evenly. */}
      <BottomNavigation
        value={getActive()}
        showLabels={false}
        sx={{ height: 58, touchAction: 'manipulation', '& .MuiBottomNavigationAction-root': { minWidth: 0 } }}
      >
        <BottomNavigationAction icon={<Home />} component={Link} href="/" />
        <BottomNavigationAction icon={<Search />} component={Link} href="/search" />
        <BottomNavigationAction
          icon={
            <Badge badgeContent={itemCount} sx={{ '& .MuiBadge-badge': { bgcolor: '#1a1a1a', color: 'white', minWidth: 16, height: 16, fontSize: '0.6rem' } }}>
              <ShoppingBag />
            </Badge>
          }
          onClick={() => dispatch(openCart())}
        />
        <BottomNavigationAction icon={<FavoriteBorder />} component={Link} href="/account/wishlist" />
        <BottomNavigationAction icon={<PersonOutline />} component={Link} href="/account/profile" />
      </BottomNavigation>
    </Paper>
  );
}
