'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Box, TextField, Button, Typography, CircularProgress, Stack, Link as MuiLink,
} from '@mui/material';
import { ArrowBack, MarkEmailRead } from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

/**
 * The whole sign-in and sign-up experience, in one place.
 *
 * There is no password and no separate "register" — the customer types an
 * email, we send a code, and entering it either signs them in or creates the
 * account. The server decides which, so the customer is never asked whether
 * they already have an account, and the two journeys cannot drift apart.
 *
 * Used by the login page, the register page and the checkout modal so all
 * three behave identically.
 */
interface Props {
  /** Shown once we know the address is new and a name is needed. */
  onDone?: () => void;
  /** Compact spacing for the modal. */
  dense?: boolean;
}

export default function PasswordlessAuth({ onDone, dense = false }: Props) {
  const { requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [needsName, setNeedsName] = useState(false);
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => { if (step === 'code') codeRef.current?.focus(); }, [step]);

  const send = useCallback(async () => {
    const addr = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(addr)) { toast.error('Enter a valid email address'); return; }
    if (needsName && !firstName.trim()) { toast.error('Please tell us your name'); return; }

    setBusy(true);
    try {
      const res = await requestOtp({
        email: addr,
        ...(firstName.trim() && { firstName: firstName.trim() }),
        ...(lastName.trim() && { lastName: lastName.trim() }),
      });
      setStep('code');
      setCooldown(45);
      toast.success(res.isNewUser ? 'Code sent — check your email to finish signing up' : 'Code sent to your email');
    } catch (e: any) {
      // The server is the only thing that knows the address is new, so the
      // name fields appear only once it says so — a returning customer is
      // never asked for a name they already gave us.
      if (e?.response?.data?.code === 'NAME_REQUIRED') {
        setNeedsName(true);
        toast('Looks like you’re new here — what should we call you?', { icon: '\u{1F44B}' });
      }
    } finally {
      setBusy(false);
    }
  }, [email, firstName, lastName, needsName, requestOtp]);

  const verify = useCallback(async (code: string) => {
    if (code.length !== 6 || busy) return;
    setBusy(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), code, onDone);
    } catch {
      setOtp('');
      codeRef.current?.focus();
    } finally {
      setBusy(false);
    }
  }, [email, busy, verifyOtp, onDone]);

  const gap = dense ? 1.75 : 2.25;

  if (step === 'code') {
    return (
      <Box>
        <Button
          size="small" startIcon={<ArrowBack sx={{ fontSize: 16 }} />}
          onClick={() => { setStep('email'); setOtp(''); }}
          sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'none' }}
        >
          Use a different email
        </Button>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <MarkEmailRead sx={{ fontSize: 20, color: 'secondary.main' }} />
          <Typography variant="body2" color="text.secondary">
            Code sent to <strong style={{ color: '#1a1a1a' }}>{email}</strong>
          </Typography>
        </Stack>

        <TextField
          inputRef={codeRef}
          fullWidth label="6-digit code" value={otp}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, '').slice(0, 6);
            setOtp(next);
            if (next.length === 6) verify(next);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') verify(otp); }}
          placeholder="000000"
          inputProps={{
            inputMode: 'numeric', autoComplete: 'one-time-code',
            style: { letterSpacing: 12, fontSize: 24, fontWeight: 700, textAlign: 'center', fontFamily: 'monospace' },
          }}
          sx={{ mb: gap }}
        />

        <Button
          fullWidth size="large" variant="contained"
          onClick={() => verify(otp)} disabled={otp.length !== 6 || busy}
          sx={{ py: 1.4, bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}
        >
          {busy ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Continue'}
        </Button>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Didn&apos;t get it? Check your spam folder.
          </Typography>
          <MuiLink
            component="button" type="button" underline="hover"
            onClick={() => cooldown === 0 && send()}
            sx={{
              mt: 0.5, fontWeight: 700, fontSize: '0.85rem',
              color: cooldown > 0 ? 'text.disabled' : '#1a1a1a',
              cursor: cooldown > 0 ? 'default' : 'pointer',
            }}
          >
            {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
          </MuiLink>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      {needsName && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: gap }}>
          <TextField
            fullWidth label="First name" value={firstName} autoFocus
            onChange={(e) => setFirstName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          />
          <TextField
            fullWidth label="Last name (optional)" value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          />
        </Stack>
      )}

      <TextField
        fullWidth label="Email address" type="email" value={email}
        autoFocus={!needsName} autoComplete="email"
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        sx={{ mb: gap }}
      />

      <Button
        fullWidth size="large" variant="contained" onClick={send} disabled={busy || !email.trim()}
        sx={{ py: 1.4, bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}
      >
        {busy ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Continue with email'}
      </Button>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1.75 }}>
        No password needed — we&apos;ll email you a 6-digit code.
      </Typography>
    </Box>
  );
}
