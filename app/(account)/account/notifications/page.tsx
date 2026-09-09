'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box, Typography, Card, CardContent, Button, Skeleton, Alert, Chip, Stack, Divider,
} from '@mui/material';
import {
  NotificationsNone, DoneAll, Refresh, LocalShipping, ShoppingBag,
  LocalOffer, Campaign, Star,
} from '@mui/icons-material';
import { userApi } from '../../../../services/api.service';
import { formatDate } from '../../../../utils/format';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

/** A recognisable icon per type; anything unknown still gets something sensible. */
const ICONS: Record<string, React.ReactNode> = {
  ORDER: <ShoppingBag fontSize="small" />,
  ORDER_PLACED: <ShoppingBag fontSize="small" />,
  ORDER_SHIPPED: <LocalShipping fontSize="small" />,
  ORDER_DELIVERED: <LocalShipping fontSize="small" />,
  PROMOTION: <LocalOffer fontSize="small" />,
  OFFER: <LocalOffer fontSize="small" />,
  REVIEW: <Star fontSize="small" />,
  GENERAL: <Campaign fontSize="small" />,
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await userApi.getNotifications();
      setItems(((data as any).data || []) as Notification[]);
    } catch (e: any) {
      setError(
        e?.response?.status === 401
          ? 'Please sign in to see your notifications.'
          : 'We could not load your notifications just now.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const unread = items.filter(n => !n.isRead).length;

  const markAllRead = async () => {
    setMarking(true);
    try {
      await userApi.markNotificationsRead();
      // Updated locally rather than refetched — the server has no per-item
      // endpoint, and the whole list is now read either way.
      setItems(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All caught up');
    } catch {
      toast.error('Could not mark them as read');
    } finally {
      setMarking(false);
    }
  };

  const Header = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800 }}>
        Notifications
      </Typography>
      {unread > 0 && (
        <Chip size="small" label={`${unread} unread`} sx={{ fontWeight: 700, bgcolor: '#1a1a1a', color: '#fff' }} />
      )}
      <Box sx={{ flexGrow: 1 }} />
      {unread > 0 && (
        <Button
          size="small" startIcon={<DoneAll fontSize="small" />}
          onClick={markAllRead} disabled={marking}
          sx={{ fontWeight: 700, textTransform: 'none' }}
        >
          {marking ? 'Marking…' : 'Mark all as read'}
        </Button>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box>
        {Header}
        <Stack spacing={1.5}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={84} sx={{ borderRadius: 2 }} />
          ))}
        </Stack>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        {Header}
        <Alert severity="error" action={<Button size="small" startIcon={<Refresh />} onClick={load}>Retry</Button>}>
          {error}
        </Alert>
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box>
        {Header}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ textAlign: 'center', py: { xs: 6, md: 9 } }}>
            <NotificationsNone sx={{ fontSize: 56, color: '#e0e0e0', mb: 2 }} />
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 1 }}>
              Nothing here yet
            </Typography>
            <Typography color="text.secondary" sx={{ px: 2 }}>
              Updates about your orders will appear here.
            </Typography>
            <Button
              variant="contained" component={Link} href="/account/orders"
              sx={{ mt: 3, bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, px: 4 }}
            >
              View my orders
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      {Header}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        {items.map((n, i) => (
          <Box key={n.id}>
            {i > 0 && <Divider />}
            <Box
              sx={{
                display: 'flex', gap: 1.75, p: { xs: 2, md: 2.5 },
                // Unread rows carry a left rule and a tint; read rows go quiet.
                bgcolor: n.isRead ? 'transparent' : 'rgba(201,168,76,0.06)',
                borderLeft: '3px solid',
                borderLeftColor: n.isRead ? 'transparent' : '#c9a84c',
              }}
            >
              <Box sx={{
                width: 36, height: 36, flexShrink: 0, borderRadius: '50%',
                display: 'grid', placeItems: 'center',
                bgcolor: n.isRead ? '#f2f2f2' : '#1a1a1a',
                color: n.isRead ? 'text.secondary' : '#fff',
              }}>
                {ICONS[n.type] ?? <Campaign fontSize="small" />}
              </Box>

              <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: n.isRead ? 600 : 800, mb: 0.25 }}>
                  {n.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  {n.message}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {formatDate(n.createdAt)}
                </Typography>
              </Box>
            </Box>
          </Box>
        ))}
      </Card>
    </Box>
  );
}
