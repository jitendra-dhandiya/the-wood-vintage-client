'use client';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box, Container, Typography, TextField, Button, CircularProgress,
  InputAdornment, IconButton, Alert, Stack,
} from '@mui/material';
import { Visibility, VisibilityOff, AdminPanelSettings, ArrowBack } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../../hooks/useAuth';
import { useAppSelector } from '../../../store';

const schema = Yup.object({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
});

/**
 * Staff sign-in, kept apart from the customer one.
 *
 * Customers sign in with an emailed code and have no password at all. Staff
 * cannot: the shop's admin address is on a domain with no MX records, so a
 * code sent there would bounce and nobody could reach the panel. This is the
 * password door, deliberately unlinked from the storefront — it lives in the
 * (auth) group rather than under /admin so the admin guard cannot redirect
 * away the very page used to get past it.
 */
function AdminLoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { login } = useAuth();
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const redirect = params.get('redirect') || '/admin/dashboard';

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const staff = ['ADMIN', 'SUPER_ADMIN', 'SUB_ADMIN'].includes(user.role);
    router.replace(staff ? redirect : '/');
  }, [isAuthenticated, user, router, redirect]);

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: schema,
    onSubmit: async (values) => {
      setSubmitting(true);
      try {
        await login(values.email.trim().toLowerCase(), values.password);
      } catch {
        /* useAuth has already surfaced the reason */
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#111', py: 6 }}>
      <Container maxWidth="xs">
        <Button component={Link} href="/" startIcon={<ArrowBack />}
          sx={{ mb: 3, color: 'rgba(255,255,255,.55)', textTransform: 'none' }}>
          Back to shop
        </Button>

        <Box sx={{ bgcolor: '#fff', borderRadius: 2, p: { xs: 3, sm: 4 } }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 0.5 }}>
            <AdminPanelSettings sx={{ color: '#c9a84c' }} />
            <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800 }}>
              Staff sign in
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            For the admin panel. Customers sign in with an emailed code instead.
          </Typography>

          <form onSubmit={formik.handleSubmit} noValidate>
            <Stack spacing={2.25}>
              <TextField
                fullWidth label="Email" name="email" type="email"
                autoComplete="username"
                value={formik.values.email}
                onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.email && !!formik.errors.email}
                helperText={formik.touched.email && formik.errors.email}
              />
              <TextField
                fullWidth label="Password" name="password"
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                value={formik.values.password}
                onChange={formik.handleChange} onBlur={formik.handleBlur}
                error={formik.touched.password && !!formik.errors.password}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton size="small" edge="end" onClick={() => setShowPwd(v => !v)}>
                        {showPwd ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit" fullWidth size="large" variant="contained" disabled={submitting}
                sx={{ py: 1.4, bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}
              >
                {submitting ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign in'}
              </Button>
            </Stack>
          </form>

          <Alert severity="info" sx={{ mt: 3, py: 0.5 }}>
            Not staff? <Link href="/login" style={{ fontWeight: 700, color: '#1a1a1a' }}>Sign in here</Link> — no password needed.
          </Alert>
        </Box>
      </Container>
    </Box>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginInner />
    </Suspense>
  );
}
