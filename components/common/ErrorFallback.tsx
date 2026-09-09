'use client';
import { Box, Button, Typography, Container } from '@mui/material';
import { WifiOff, RefreshRounded, ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
  variant?: 'page' | 'section';
}

export default function ErrorFallback({ error, reset, variant = 'page' }: Props) {
  const router = useRouter();

  const is429 = error.message?.includes('429');
  const is500 = error.message?.includes('500') || error.message?.includes('Server');
  const isNetwork = error.message?.includes('Network') || error.message?.includes('fetch');

  const title = is429
    ? 'Too Many Requests'
    : is500
    ? 'Server Error'
    : isNetwork
    ? 'Connection Problem'
    : 'Something Went Wrong';

  const description = is429
    ? 'You\'re making requests too quickly. Please wait a moment and try again.'
    : is500
    ? 'Our server ran into a problem. We\'re working on it. Please try again shortly.'
    : isNetwork
    ? 'Could not reach the server. Please check your internet connection.'
    : 'An unexpected error occurred. Try refreshing the page.';

  if (variant === 'section') {
    return (
      <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', py: 8, gap: 2,
      }}>
        <WifiOff sx={{ fontSize: 40, color: 'text.disabled' }} />
        <Typography variant="body1" color="text.secondary" textAlign="center">
          {description}
        </Typography>
        <Button variant="outlined" startIcon={<RefreshRounded />} onClick={reset} size="small">
          Try Again
        </Button>
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{
        minHeight: '60vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 8, gap: 2,
      }}>
        <Box sx={{
          width: 72, height: 72, borderRadius: '50%',
          bgcolor: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1,
        }}>
          <WifiOff sx={{ fontSize: 32, color: '#ef4444' }} />
        </Box>

        <Typography variant="h5" fontWeight={700} sx={{ fontFamily: 'var(--font-playfair)' }}>
          {title}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, lineHeight: 1.7 }}>
          {description}
        </Typography>

        {process.env.NODE_ENV === 'development' && error.message && (
          <Box sx={{
            mt: 1, px: 2, py: 1.5, bgcolor: '#f5f5f5', borderRadius: 1,
            maxWidth: 480, width: '100%', textAlign: 'left',
          }}>
            <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#666', wordBreak: 'break-all' }}>
              {error.message}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="contained"
            startIcon={<RefreshRounded />}
            onClick={reset}
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        </Box>
      </Box>
    </Container>
  );
}
