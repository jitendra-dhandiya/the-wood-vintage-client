'use client';
import { useEffect } from 'react';
import { Dialog, DialogContent, Box, Typography, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../store';
import { closeLoginModal } from '../../store/slices/uiSlice';
import PasswordlessAuth from './PasswordlessAuth';

/**
 * The in-place sign-in, opened from the navbar and from checkout.
 *
 * Was a 360-line two-tab form with password fields, a duplicate of the login
 * and register pages that had to be kept in step with them by hand. It now
 * wraps the same PasswordlessAuth the pages use, so there is one sign-in
 * journey in the app rather than three that can drift.
 */
export default function LoginModal() {
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.loginModalOpen);
  const isAuth = useAppSelector((s) => s.auth.isAuthenticated);

  // Someone signing in from checkout should land back on checkout, not be
  // left staring at a dialog that has served its purpose.
  useEffect(() => {
    if (isAuth && open) dispatch(closeLoginModal());
  }, [isAuth, open, dispatch]);

  const close = () => dispatch(closeLoginModal());

  return (
    <Dialog open={open} onClose={close} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogContent sx={{ p: { xs: 3, sm: 4 }, position: 'relative' }}>
        <IconButton onClick={close} size="small"
          sx={{ position: 'absolute', top: 10, right: 10, color: 'text.secondary' }}>
          <Close fontSize="small" />
        </IconButton>

        <Box sx={{ mb: 3, pr: 4 }}>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 800, mb: 0.5 }}>
            Sign in
          </Typography>
          <Typography variant="body2" color="text.secondary">
            New here? The same step creates your account.
          </Typography>
        </Box>

        <PasswordlessAuth dense onDone={close} />
      </DialogContent>
    </Dialog>
  );
}
