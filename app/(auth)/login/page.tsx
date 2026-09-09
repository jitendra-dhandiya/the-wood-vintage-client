'use client';
import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Box, Container, Typography, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import PasswordlessAuth from '../../../components/auth/PasswordlessAuth';
import { useAppSelector } from '../../../store';

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);
  const redirect = params.get('redirect') || '/';

  useEffect(() => { if (isAuth) router.replace(redirect); }, [isAuth, router, redirect]);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#fafafa', py: 6 }}>
      <Container maxWidth="xs">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Button component={Link} href="/" startIcon={<ArrowBack />}
            sx={{ mb: 3, color: 'text.secondary', textTransform: 'none' }}>
            Back to shop
          </Button>

          <Box sx={{ bgcolor: '#fff', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: { xs: 3, sm: 4 } }}>
            <Typography variant="h4" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, mb: 0.5 }}>
              Sign in
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              New here? The same step creates your account.
            </Typography>

            <PasswordlessAuth onDone={() => router.push(redirect)} />
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
}

/**
 * useSearchParams opts the whole route out of static rendering unless it sits
 * behind a Suspense boundary, and the build fails outright rather than warning.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
