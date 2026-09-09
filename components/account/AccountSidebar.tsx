'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box, Typography, List, ListItem, ListItemIcon, ListItemText,
  Avatar, Divider, Card, CardContent,
} from '@mui/material';
import {
  ShoppingBag, FavoriteBorder, Person, LocationOn,
  Lock, Notifications, Replay, Logout,
} from '@mui/icons-material';
import { useAppSelector } from '../../store';
import { useAuth } from '../../hooks/useAuth';
import { getInitials } from '../../utils/format';

const NAV_ITEMS = [
  { label: 'My Orders', href: '/account/orders', icon: <ShoppingBag fontSize="small" /> },
  { label: 'Wishlist', href: '/account/wishlist', icon: <FavoriteBorder fontSize="small" /> },
  { label: 'Profile', href: '/account/profile', icon: <Person fontSize="small" /> },
  { label: 'Addresses', href: '/account/addresses', icon: <LocationOn fontSize="small" /> },
  { label: 'Returns', href: '/account/returns', icon: <Replay fontSize="small" /> },
  { label: 'Notifications', href: '/account/notifications', icon: <Notifications fontSize="small" /> },
  { label: 'Change Password', href: '/account/security', icon: <Lock fontSize="small" /> },
];

export default function AccountSidebar() {
  const pathname = usePathname();
  const { user } = useAppSelector((s) => s.auth);
  const { logout } = useAuth();

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, position: 'sticky', top: 88 }}>
      <CardContent sx={{ p: 2.5 }}>
        {/* User info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
          <Avatar
            src={user?.avatar}
            sx={{ width: 48, height: 48, bgcolor: '#1a1a1a', fontWeight: 700 }}
          >
            {user ? getInitials(user.firstName, user.lastName) : '?'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="subtitle2" fontWeight={700} noWrap>
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <List dense sx={{ p: 0 }}>
          {NAV_ITEMS.map((item) => (
            <ListItem
              key={item.href}
              component={Link}
              href={item.href}
              sx={{
                px: 1.5, py: 1, borderRadius: 1, mb: 0.25,
                bgcolor: pathname === item.href ? '#1a1a1a' : 'transparent',
                color: pathname === item.href ? 'white' : 'inherit',
                '&:hover': { bgcolor: pathname === item.href ? '#1a1a1a' : '#f5f5f5' },
                textDecoration: 'none',
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: pathname === item.href ? 700 : 500 }}
              />
            </ListItem>
          ))}

          <Divider sx={{ my: 1 }} />

          <ListItem
            onClick={logout}
            sx={{ px: 1.5, py: 1, borderRadius: 1, cursor: 'pointer', color: '#d32f2f', '&:hover': { bgcolor: '#fdf5f5' } }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: 'inherit' }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
            />
          </ListItem>
        </List>
      </CardContent>
    </Card>
  );
}
