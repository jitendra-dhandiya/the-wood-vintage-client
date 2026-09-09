'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, TextField, Button, Alert,
  InputAdornment, IconButton, LinearProgress, Stack,
} from '@mui/material';
import { Visibility, VisibilityOff, Lock } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { authApi } from '../../../../services/api.service';
import toast from 'react-hot-toast';

const schema = Yup.object({
  currentPassword: Yup.string().required('Enter your current password'),
  newPassword: Yup.string()
    .min(8, 'At least 8 characters')
    .notOneOf([Yup.ref('currentPassword')], 'Choose a password you have not used here before')
    .required('Enter a new password'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match')
    .required('Confirm your new password'),
});

/** Rough strength signal — length and variety, no library needed. */
function strengthOf(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '#e0e0e0' };
  let score = 0;
  if (pw.length >= 8) score += 25;
  if (pw.length >= 12) score += 15;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 20;
  if (/\d/.test(pw)) score += 20;
  if (/[^A-Za-z0-9]/.test(pw)) score += 20;
  score = Math.min(100, score);
  if (score < 40) return { score, label: 'Weak', color: '#d32f2f' };
  if (score < 70) return { score, label: 'Fair', color: '#ed6c02' };
  return { score, label: 'Strong', color: '#2e7d32' };
}

export default function SecurityPage() {
  const router = useRouter();
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [submitting, setSubmitting] = useState(false);

  const formik = useFormik({
    initialValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
    validationSchema: schema,
    onSubmit: async (values, { resetForm }) => {
      setSubmitting(true);
      try {
        await authApi.changePassword(values.currentPassword, values.newPassword);
        resetForm();
        // The server clears the refresh token, so every session — including
        // this one — is now invalid. Saying so is kinder than letting them
        // discover it at the next request.
        toast.success('Password changed. Please sign in again.');
        setTimeout(() => router.push('/login'), 1200);
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Could not change your password');
      } finally {
        setSubmitting(false);
      }
    },
  });

  const strength = strengthOf(formik.values.newPassword);

  const eye = (key: keyof typeof show) => (
    <InputAdornment position="end">
      <IconButton onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))} edge="end" size="small">
        {show[key] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, mb: 3 }}>
        Change Password
      </Typography>

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxWidth: 520 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
          <Alert severity="info" icon={<Lock fontSize="small" />} sx={{ mb: 3, py: 0.5 }}>
            Changing your password signs you out everywhere, including on this device.
          </Alert>

          <form onSubmit={formik.handleSubmit} noValidate>
            <Stack spacing={2.5}>
              <TextField
                fullWidth size="small" label="Current password"
                name="currentPassword"
                type={show.current ? 'text' : 'password'}
                autoComplete="current-password"
                value={formik.values.currentPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.currentPassword && !!formik.errors.currentPassword}
                helperText={formik.touched.currentPassword && formik.errors.currentPassword}
                InputProps={{ endAdornment: eye('current') }}
              />

              <Box>
                <TextField
                  fullWidth size="small" label="New password"
                  name="newPassword"
                  type={show.next ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formik.values.newPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.newPassword && !!formik.errors.newPassword}
                  helperText={formik.touched.newPassword && formik.errors.newPassword}
                  InputProps={{ endAdornment: eye('next') }}
                />
                {formik.values.newPassword && (
                  <Box sx={{ mt: 1 }}>
                    <LinearProgress
                      variant="determinate" value={strength.score}
                      sx={{
                        height: 4, borderRadius: 2, bgcolor: '#eee',
                        '& .MuiLinearProgress-bar': { bgcolor: strength.color },
                      }}
                    />
                    <Typography variant="caption" sx={{ color: strength.color, fontWeight: 700 }}>
                      {strength.label}
                    </Typography>
                  </Box>
                )}
              </Box>

              <TextField
                fullWidth size="small" label="Confirm new password"
                name="confirmPassword"
                type={show.confirm ? 'text' : 'password'}
                autoComplete="new-password"
                value={formik.values.confirmPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.confirmPassword && !!formik.errors.confirmPassword}
                helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                InputProps={{ endAdornment: eye('confirm') }}
              />

              <Button
                type="submit" variant="contained" size="large"
                disabled={submitting || !formik.isValid || !formik.dirty}
                sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' }, py: 1.25 }}
              >
                {submitting ? 'Saving…' : 'Change password'}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
