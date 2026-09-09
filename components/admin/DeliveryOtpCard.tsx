'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Card, CardContent, Typography, Box, Button, TextField, Alert, Chip,
  Stack, InputAdornment, CircularProgress,
} from '@mui/material';
import { LockClock, CheckCircle, Send, MarkEmailRead } from '@mui/icons-material';
import { orderApi } from '../../services/api.service';
import { formatDate, formatPrice } from '../../utils/format';
import { toast } from 'react-hot-toast';

interface OtpStatus {
  eligible: boolean;
  verifiedAt: string | null;
  channel: string | null;
  sentTo: string | null;
  hasEmail: boolean;
  mailConfigured: boolean;
  codeLive: boolean;
  expiresAt: string | null;
  resendAvailableAt: string | null;
  sendsRemaining: number;
  attemptsRemaining: number;
  otpLength: number;
}

interface Props {
  orderId: string;
  order: any;
  /** Told when the order becomes DELIVERED so the page above can redraw. */
  onDelivered: (order: any) => void;
}

/** mm:ss left until `iso`, or 0 once it has passed. */
function secondsUntil(iso: string | null): number {
  if (!iso) return 0;
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 1000));
}

function mmss(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Proof of handover for orders we deliver ourselves.
 *
 * The office sends a code to the customer, the customer reads it out to the
 * person at their door, that person relays it back on the phone, and the
 * office types it in here. The code is deliberately not shown anywhere in this
 * panel — if the office could read it, confirming a delivery would prove
 * nothing.
 */
export default function DeliveryOtpCard({ orderId, order, onDelivered }: Props) {
  const [status, setStatus] = useState<OtpStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otp, setOtp] = useState('');
  const [cash, setCash] = useState('');
  const [tick, setTick] = useState(0);
  const otpRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await orderApi.getDeliveryOtp(orderId);
      setStatus((data as any).data);
    } catch {
      /* The card simply does not draw if the status cannot be read. */
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { load(); }, [load]);

  // Drives the two countdowns. One second is the right granularity here:
  // somebody is standing at a door watching it.
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const amountDue = order?.paymentMethod === 'COD' && order?.paymentStatus !== 'PAID'
    ? Number(order?.total ?? 0)
    : 0;

  useEffect(() => {
    if (amountDue > 0 && cash === '') setCash(String(amountDue));
  }, [amountDue]); // eslint-disable-line react-hooks/exhaustive-deps

  const send = async () => {
    setSending(true);
    try {
      const { data } = await orderApi.sendDeliveryOtp(orderId);
      const r = (data as any).data;
      toast.success(`Code sent to ${r.sentTo}`);
      await load();
      otpRef.current?.focus();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not send the code');
      await load();
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const { data } = await orderApi.verifyDeliveryOtp(orderId, {
        otp,
        codCollected: cash.trim() === '' ? null : Number(cash),
      });
      toast.success('Delivery confirmed — hand over the parcel');
      setOtp('');
      onDelivered((data as any).data);
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'That code could not be verified');
      setOtp('');
      await load();
    } finally {
      setVerifying(false);
    }
  };

  if (loading || !status) return null;
  // Only ours to carry. A Delhivery parcel is confirmed by Delhivery.
  if (order?.fulfilmentType !== 'SELF') return null;

  // Read purely so the countdowns below re-render once a second.
  void tick;

  const verified   = Boolean(status.verifiedAt);
  const expiresIn  = secondsUntil(status.expiresAt);
  const resendIn   = secondsUntil(status.resendAvailableAt);
  const codeLive   = status.codeLive && expiresIn > 0;
  const canSend    = status.eligible && status.hasEmail && status.mailConfigured
                     && status.sendsRemaining > 0 && resendIn === 0;

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: verified ? 'success.light' : codeLive ? 'primary.light' : 'divider',
        borderRadius: 2, mb: 3,
        bgcolor: verified ? 'rgba(46,125,50,0.04)' : 'transparent',
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          {verified
            ? <CheckCircle sx={{ fontSize: 18, color: 'success.main' }} />
            : <LockClock sx={{ fontSize: 18, color: 'text.secondary' }} />}
          <Typography variant="subtitle2" fontWeight={700}>Delivery Confirmation</Typography>
        </Stack>

        {verified ? (
          <>
            <Typography variant="body2" color="success.dark" sx={{ mb: 0.5 }}>
              The customer confirmed this delivery with their code.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Confirmed {formatDate(status.verifiedAt!)}
              {order?.codCollected != null && ` · ₹${order.codCollected} collected`}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              When the rider reaches the customer, send the code, then ask the rider to read
              back what the customer received. The code is never shown here — only the
              customer has it.
            </Typography>

            {!status.eligible && (
              <Alert severity="info" sx={{ mb: 2, py: 0.5 }}>
                This order is marked {order?.status}. Move it to Out for delivery before
                confirming a handover.
              </Alert>
            )}
            {!status.hasEmail && (
              <Alert severity="warning" sx={{ mb: 2, py: 0.5 }}>
                This customer has no email address on file, so a code cannot be sent to them.
              </Alert>
            )}
            {status.hasEmail && !status.mailConfigured && (
              <Alert severity="error" sx={{ mb: 2, py: 0.5 }}>
                Email is not set up on the server yet, so codes cannot be sent. Ask your
                developer to add the SMTP settings.
              </Alert>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <Button
                variant={codeLive ? 'outlined' : 'contained'}
                size="small"
                startIcon={sending ? <CircularProgress size={14} /> : <Send sx={{ fontSize: 16 }} />}
                onClick={send}
                disabled={!canSend || sending}
                sx={!codeLive ? { bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } } : undefined}
              >
                {sending ? 'Sending…' : codeLive ? 'Send a new code' : 'Send code to customer'}
              </Button>

              {status.sentTo && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <MarkEmailRead sx={{ fontSize: 15, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">{status.sentTo}</Typography>
                </Stack>
              )}

              {resendIn > 0 && (
                <Typography variant="caption" color="text.secondary">
                  New code in {mmss(resendIn)}
                </Typography>
              )}
            </Stack>

            {codeLive && (
              <Box sx={{ mt: 2.5 }}>
                <Chip
                  size="small"
                  label={`Code expires in ${mmss(expiresIn)}`}
                  sx={{ mb: 1.5, fontWeight: 700, bgcolor: '#e3f2fd' }}
                />
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    inputRef={otpRef}
                    label="Code from the customer"
                    size="small"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, status.otpLength))}
                    onKeyDown={e => { if (e.key === 'Enter' && otp.length === status.otpLength) verify(); }}
                    placeholder={'0'.repeat(status.otpLength)}
                    inputProps={{
                      inputMode: 'numeric',
                      style: { letterSpacing: 6, fontWeight: 700, fontFamily: 'monospace' },
                    }}
                    sx={{ width: { xs: '100%', sm: 190 } }}
                    helperText={`${status.attemptsRemaining} ${status.attemptsRemaining === 1 ? 'try' : 'tries'} left`}
                  />
                  {amountDue > 0 && (
                    <TextField
                      label="Cash collected"
                      size="small"
                      type="number"
                      value={cash}
                      onChange={e => setCash(e.target.value)}
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      helperText={`${formatPrice(amountDue)} due on this order`}
                      sx={{ width: { xs: '100%', sm: 190 } }}
                    />
                  )}
                </Stack>
                <Button
                  variant="contained"
                  size="small"
                  sx={{ mt: 2, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                  onClick={verify}
                  disabled={otp.length !== status.otpLength || verifying}
                  startIcon={verifying ? <CircularProgress size={14} /> : <CheckCircle sx={{ fontSize: 16 }} />}
                >
                  {verifying ? 'Checking…' : 'Verify & mark delivered'}
                </Button>
              </Box>
            )}

            {status.sendsRemaining === 0 && !codeLive && (
              <Alert severity="warning" sx={{ mt: 2, py: 0.5 }}>
                No codes left to send for this order. Speak to the customer before trying again.
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
