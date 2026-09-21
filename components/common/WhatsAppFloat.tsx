'use client';
import { usePathname } from 'next/navigation';
import { Fab } from '@mui/material';
import { WhatsApp } from '@mui/icons-material';
import { trackEvent } from '../../lib/analytics';

/**
 * Optional site-wide floating WhatsApp button (decision 0034). Off unless the
 * `whatsapp_float_sitewide` setting is "true". Never rendered on product pages,
 * which already carry the WhatsApp button and the sticky quote bar.
 */
export default function WhatsAppFloat({ settings }: { settings: Record<string, string> }) {
  const pathname = usePathname();
  const number = (settings.whatsapp_number || '').replace(/\D/g, '');
  if (settings.whatsapp_float_sitewide !== 'true' || !number) return null;
  if (/\/product\//.test(pathname) || pathname.startsWith('/admin')) return null;
  const text = encodeURIComponent(settings.whatsapp_default_message || 'Hi The Wood Vintage, I would like some help.');
  return (
    <Fab
      component="a" href={`https://wa.me/${number}?text=${text}`} target="_blank" rel="noopener noreferrer"
      aria-label="Chat on WhatsApp" size="medium"
      onClick={() => trackEvent('WHATSAPP_CLICK', { path: pathname })}
      sx={{
        position: 'fixed', right: 16, zIndex: 1150, bgcolor: '#25D366', color: '#fff',
        bottom: { xs: 'calc(74px + env(safe-area-inset-bottom, 0px))', md: 24 },
        '&:hover': { bgcolor: '#128C4A' },
      }}
    >
      <WhatsApp />
    </Fab>
  );
}
