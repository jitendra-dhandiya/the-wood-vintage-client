'use client';
/**
 * Quote / lead capture for the product page (decision 0034, spec
 * docs/architecture/quote-lead-capture-spec.md).
 *
 *  - QuoteCta        primary animated button
 *  - WhatsAppButton  strong secondary, wa.me link with a prefilled message
 *  - StickyQuoteBar  mobile bar that appears once the in-page CTA scrolls away
 *  - LeadDialog      2-step form (full-screen sheet on mobile)
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Button, Dialog, IconButton, Typography, TextField, Chip, Stack, Slide,
  Checkbox, FormControlLabel, MenuItem, ToggleButton, ToggleButtonGroup, LinearProgress,
  useMediaQuery, useTheme, Paper,
} from '@mui/material';
import { RequestQuoteOutlined, WhatsApp, Close, CheckCircleOutline, ArrowBack } from '@mui/icons-material';
import { forwardRef } from 'react';
import { createPortal } from 'react-dom';
import type { TransitionProps } from '@mui/material/transitions';
import { leadApi } from '../../services/api.service';
import { trackEvent } from '../../lib/analytics';
import { readStoredAttribution } from '../../lib/attribution';
import { buildWhatsAppLink, type LeadSettings } from '../../lib/leadSettings';
import { PHONE_COUNTRIES, findPhoneCountry, validatePhone, isValidEmail } from '../../lib/phone';

const WALNUT = '#3B2314';
const COPPER = '#A0693A';
const WA_GREEN = '#128C4A';

const ROOMS = ['Living room', 'Bedroom', 'Dining', 'Office', 'Outdoor / other'];
const STYLES = ['Traditional', 'Modern', 'Rustic', 'Not sure yet'];

/** `options` is the shopper's chosen variant, e.g. "Size: Queen (5×6.5 ft) · Finish: Walnut". */
export interface QuoteProduct { id: string; name: string; image?: string; options?: string }

// ─── Shared answers (step 1) so WhatsApp can echo them ────────────────
export interface QuoteAnswers { room: string; style: string; needs: string }
export const EMPTY_ANSWERS: QuoteAnswers = { room: '', style: '', needs: '' };

const productUrl = () => (typeof window === 'undefined' ? '' : `${window.location.origin}${window.location.pathname}`);

export function whatsAppHref(settings: LeadSettings, product: QuoteProduct, a: QuoteAnswers = EMPTY_ANSWERS) {
  if (!settings.whatsappNumber) return '';
  return buildWhatsAppLink(settings.whatsappNumber, {
    base: settings.whatsappMessage, productName: product.name, options: product.options, url: productUrl(),
    room: a.room, style: a.style, needs: a.needs,
  });
}

// ─── Primary CTA ─────────────────────────────────────────────────────
export function QuoteCta({ onClick, sublineText }: { onClick: () => void; sublineText?: string }) {
  const [quiet, setQuiet] = useState(false);
  const settle = () => setQuiet(true);
  return (
    <Box>
      <Box className={`quote-cta-wrap${quiet ? ' quiet' : ''}`} onMouseEnter={settle} onFocus={settle} onTouchStart={settle}>
        <Button
          className="quote-cta"
          fullWidth
          variant="contained"
          onClick={() => { settle(); onClick(); }}
          startIcon={<RequestQuoteOutlined />}
          sx={{
            bgcolor: WALNUT, color: '#FFFCF5', py: 1.9, fontSize: '0.92rem', letterSpacing: '0.08em', fontWeight: 700,
            boxShadow: '0 6px 18px rgba(59,35,20,0.28)',
            '&:hover': { bgcolor: COPPER, boxShadow: '0 8px 22px rgba(160,105,58,0.35)' },
          }}
        >
          Get Best Quote &amp; Price
        </Button>
      </Box>
      {sublineText && (
        <Typography sx={{ mt: 0.9, fontSize: '0.76rem', color: '#6b5a4c', textAlign: 'center' }}>{sublineText}</Typography>
      )}
    </Box>
  );
}

// ─── WhatsApp ────────────────────────────────────────────────────────
export function WhatsAppButton({
  href, productId, compact = false, iconOnly = false, sx,
}: { href: string; productId: string; compact?: boolean; iconOnly?: boolean; sx?: object }) {
  if (!href) return null;
  const onClick = () => trackEvent('WHATSAPP_CLICK', { productId, path: window.location.pathname });
  if (iconOnly) {
    return (
      <IconButton
        component="a" href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}
        aria-label="Chat on WhatsApp"
        sx={{ bgcolor: '#25D366', color: '#fff', borderRadius: 1, width: 48, height: 48, '&:hover': { bgcolor: WA_GREEN }, ...sx }}
      >
        <WhatsApp />
      </IconButton>
    );
  }
  return (
    <Button
      component="a" href={href} target="_blank" rel="noopener noreferrer" onClick={onClick}
      variant="outlined" startIcon={<WhatsApp />} aria-label="Chat on WhatsApp"
      sx={{
        flex: '1 1 0', minWidth: 0, py: compact ? 1.2 : 1.5, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.06em',
        color: WA_GREEN, borderColor: WA_GREEN, borderWidth: 1.5, whiteSpace: 'nowrap',
        '&:hover': { borderWidth: 1.5, borderColor: WA_GREEN, bgcolor: 'rgba(37,211,102,0.08)' }, ...sx,
      }}
    >
      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' }, mr: '0.3em' }}>Chat on</Box>WhatsApp
    </Button>
  );
}

// ─── Sticky mobile bar ───────────────────────────────────────────────
export function StickyQuoteBar({
  targetRef, hidden, onQuote, waHref, productId,
}: { targetRef: React.RefObject<HTMLElement | null>; hidden: boolean; onQuote: () => void; waHref: string; productId: string }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [ctaVisible, setCtaVisible] = useState(true);

  useEffect(() => {
    const el = targetRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setCtaVisible(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetRef]);

  if (!isMobile || typeof document === 'undefined') return null;
  const show = !ctaVisible && !hidden;
  // Portaled to <body>: page transitions leave a transformed ancestor that would
  // otherwise become the containing block of `position: fixed`.
  return createPortal(
    <Paper
      className="quote-sticky"
      elevation={0}
      aria-hidden={!show}
      sx={{
        position: 'fixed', left: 0, right: 0, zIndex: 1190,
        // sits directly above the 58px MobileBottomNav (+ its safe-area padding)
        bottom: 'calc(58px + env(safe-area-inset-bottom, 0px))',
        display: 'flex', gap: 1, p: 1, bgcolor: '#FFFCF5', borderTop: '1px solid', borderColor: 'divider',
        boxShadow: '0 -6px 20px rgba(59,35,20,0.10)',
        transform: show ? 'translateY(0)' : 'translateY(120%)', opacity: show ? 1 : 0,
        pointerEvents: show ? 'auto' : 'none', visibility: show ? 'visible' : 'hidden',
      }}
    >
      <Button
        fullWidth variant="contained" onClick={onQuote} tabIndex={show ? 0 : -1}
        startIcon={<RequestQuoteOutlined />}
        sx={{ bgcolor: WALNUT, color: '#FFFCF5', py: 1.25, fontWeight: 700, letterSpacing: '0.05em', fontSize: '0.85rem', '&:hover': { bgcolor: COPPER } }}
      >
        Get Best Quote &amp; Price
      </Button>
      {waHref && <WhatsAppButton href={waHref} productId={productId} iconOnly sx={{ flexShrink: 0, height: 'auto', alignSelf: 'stretch' }} />}
    </Paper>,
    document.body,
  );
}

// ─── Dialog ──────────────────────────────────────────────────────────
const SlideUp = forwardRef(function SlideUp(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

type FieldErrors = Partial<Record<'name' | 'phone' | 'email' | 'consent', string>>;

export function LeadDialog({
  open, onClose, product, settings, defaultCountry, prefill, answers, setAnswers,
}: {
  open: boolean; onClose: () => void; product: QuoteProduct; settings: LeadSettings;
  defaultCountry: string; prefill: { name?: string; email?: string };
  answers: QuoteAnswers; setAnswers: React.Dispatch<React.SetStateAction<QuoteAnswers>>;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [step, setStep] = useState<1 | 2>(1);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState('IN');
  const [contact, setContact] = useState<'WHATSAPP' | 'CALL' | 'EMAIL'>('WHATSAPP');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot
  const submitting = useRef(false);

  useEffect(() => {
    if (!open) return;
    setPhoneCountry(PHONE_COUNTRIES.some((c) => c.code === defaultCountry.toUpperCase()) ? defaultCountry.toUpperCase() : 'IN');
    setName((n) => n || prefill.name || '');
    setEmail((e) => e || prefill.email || '');
    // reopening after success starts a fresh request
    if (status === 'done') { setStep(1); setStatus('idle'); setConsent(false); setPhone(''); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const waHref = useMemo(() => whatsAppHref(settings, product, answers), [settings, product, answers]);
  const dial = findPhoneCountry(phoneCountry).dial;

  const continueStep1 = () => {
    trackEvent('QUOTE_STEP1_DONE', { productId: product.id, path: window.location.pathname });
    setStep(2);
  };

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (name.trim().length < 2) e.name = 'Please tell us your name';
    const pe = validatePhone(phoneCountry, phone);
    if (pe) e.phone = pe;
    if (!isValidEmail(email)) e.email = 'Enter a valid email, e.g. name@example.com';
    if (!consent) e.consent = 'Please tick to let us contact you about this request';
    return e;
  };

  const submit = async () => {
    if (submitting.current) return;
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    submitting.current = true;
    setStatus('sending');
    setServerError('');
    const utm = readStoredAttribution() ?? {};
    try {
      await leadApi.create({
        name: name.trim(), phone: phone.trim(), phoneCountry, email: email.trim(),
        preferredContact: contact, productId: product.id,
        room: answers.room, style: answers.style, requirement: [product.options, answers.needs].filter(Boolean).join(' | ').slice(0, 500),
        source: 'PRODUCT_QUOTE',
        utmSource: utm.utmSource, utmMedium: utm.utmMedium, utmCampaign: utm.utmCampaign,
        sessionId: (() => { try { return localStorage.getItem('sessionId') || undefined; } catch { return undefined; } })(),
        country: defaultCountry, pageUrl: window.location.href.slice(0, 500),
        consent: true, website,
      });
      trackEvent('LEAD_SUBMITTED', { productId: product.id, path: window.location.pathname });
      setStatus('done');
    } catch (err: any) {
      const res = err?.response;
      if (res?.status === 422 && Array.isArray(res.data?.errors)) {
        const fe: FieldErrors = {};
        for (const d of res.data.errors) if (d.field in { name: 1, phone: 1, email: 1, consent: 1 }) (fe as any)[d.field] = d.message;
        setErrors(fe);
        setStatus('idle');
      } else if (res?.status === 400 && Array.isArray(res.data?.errors)) {
        setErrors({ phone: res.data.errors[0]?.message || 'Check your phone number' });
        setStatus('idle');
      } else if (res?.status === 429) {
        setServerError('You have sent several requests. Please chat with us on WhatsApp instead.');
        setStatus('error');
      } else {
        setServerError('We could not send that just now. Your details are still here, so please try again or chat with us on WhatsApp.');
        setStatus('error');
      }
    } finally {
      submitting.current = false;
    }
  };

  const firstName = name.trim().split(/\s+/)[0];
  const contactLabel = { WHATSAPP: 'WhatsApp', CALL: 'phone call', EMAIL: 'email' }[contact];

  return (
    <Dialog
      open={open} onClose={onClose} fullScreen={isMobile} fullWidth maxWidth="sm"
      TransitionComponent={isMobile ? SlideUp : undefined}
      aria-labelledby="lead-title"
      PaperProps={{ sx: { borderRadius: isMobile ? 0 : 2, bgcolor: '#FFFCF5' } }}
    >
      {/* header */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 2, bgcolor: '#FFFCF5', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 1.75, pt: 'max(14px, env(safe-area-inset-top, 0px))' }}>
          {step === 2 && status !== 'done' && (
            <IconButton size="small" aria-label="Back to step 1" onClick={() => setStep(1)}><ArrowBack fontSize="small" /></IconButton>
          )}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: '0.68rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: COPPER, fontWeight: 700 }}>
              {status === 'done' ? 'Request received' : `Step ${step} of 2`}
            </Typography>
            <Typography noWrap sx={{ fontSize: '0.8rem', color: '#6b5a4c' }}>{product.name}</Typography>
          </Box>
          <IconButton aria-label="Close" onClick={onClose}><Close /></IconButton>
        </Box>
        <LinearProgress
          variant="determinate" value={status === 'done' ? 100 : step === 1 ? 50 : 90} aria-hidden
          sx={{ height: 3, bgcolor: '#efe6da', '& .MuiLinearProgress-bar': { bgcolor: COPPER, transition: 'transform .4s ease' } }}
        />
      </Box>

      <Box sx={{ px: { xs: 2.5, sm: 4 }, py: 3, pb: 'max(24px, env(safe-area-inset-bottom, 0px))' }} aria-live="polite">
        {status === 'done' ? (
          <Box role="status" sx={{ textAlign: 'center' }}>
            <CheckCircleOutline sx={{ fontSize: 56, color: COPPER, mb: 1 }} />
            <Typography id="lead-title" component="h2" sx={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.6rem', fontWeight: 700, color: WALNUT, mb: 0.5 }}>
              Thank you{firstName ? `, ${firstName}` : ''}.
            </Typography>
            <Typography sx={{ color: '#6b5a4c', mb: 3 }}>Your request is with our design team.</Typography>
            <Stack spacing={1.5} sx={{ textAlign: 'left', mb: 3 }}>
              {[
                ['1', 'We review your room and needs', [answers.room, answers.style].filter(Boolean).join(', ') || [product.name, product.options].filter(Boolean).join(' - ')],
                ['2', `You hear from us ${settings.responsePromise}`, `by ${contactLabel}`],
                ['3', 'We share a quote with options', 'Price, size and finish choices for this piece'],
              ].map(([n, t, s]) => (
                <Box key={n} sx={{ display: 'flex', gap: 1.5 }}>
                  <Box sx={{ width: 26, height: 26, borderRadius: '50%', bgcolor: WALNUT, color: '#fff', fontSize: '0.78rem', fontWeight: 700, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{n}</Box>
                  <Box><Typography sx={{ fontWeight: 700, fontSize: '0.92rem' }}>{t}</Typography><Typography sx={{ fontSize: '0.82rem', color: '#6b5a4c' }}>{s}</Typography></Box>
                </Box>
              ))}
            </Stack>
            <Stack spacing={1.25}>
              {waHref && (
                <Button component="a" href={waHref} target="_blank" rel="noopener noreferrer" variant="contained" startIcon={<WhatsApp />}
                  onClick={() => trackEvent('WHATSAPP_CLICK', { productId: product.id, path: window.location.pathname })}
                  sx={{ bgcolor: WA_GREEN, color: '#fff', py: 1.4, fontWeight: 700, '&:hover': { bgcolor: '#0e7139' } }}>
                  Chat on WhatsApp now
                </Button>
              )}
              <Button onClick={onClose} sx={{ color: WALNUT, fontWeight: 700 }}>Keep browsing</Button>
            </Stack>
          </Box>
        ) : step === 1 ? (
          <Box>
            <Typography id="lead-title" component="h2" sx={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.55rem', fontWeight: 700, color: WALNUT, mb: 0.5 }}>
              Let&apos;s find the right piece for you
            </Typography>
            <Typography sx={{ color: '#6b5a4c', fontSize: '0.9rem', mb: 3 }}>
              Free design guidance from our team. Two quick questions, about a minute.
            </Typography>

            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', mb: 1 }}>Which room are you furnishing?</Typography>
            <Box role="group" aria-label="Room" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
              {ROOMS.map((r) => (
                <Chip key={r} label={r} clickable onClick={() => setAnswers((a) => ({ ...a, room: a.room === r ? '' : r }))}
                  aria-pressed={answers.room === r}
                  sx={chipSx(answers.room === r)} />
              ))}
            </Box>

            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', mb: 1 }}>What style do you like?</Typography>
            <Box role="group" aria-label="Style" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
              {STYLES.map((r) => (
                <Chip key={r} label={r} clickable onClick={() => setAnswers((a) => ({ ...a, style: a.style === r ? '' : r }))}
                  aria-pressed={answers.style === r}
                  sx={chipSx(answers.style === r)} />
              ))}
            </Box>

            {product.options && (
              <Typography sx={{ fontSize: '0.84rem', mb: 1.5, color: '#3B2314', bgcolor: '#F6EEDF', borderRadius: 1, px: 1.5, py: 1 }}>
                <strong>Your selection:</strong> {product.options}
              </Typography>
            )}
            <TextField
              label="Custom size or changes (optional)" placeholder="Any dimensions, finish or changes you have in mind?"
              fullWidth multiline minRows={2} value={answers.needs} slotProps={{ htmlInput: { maxLength: 500 } }}
              onChange={(e) => setAnswers((a) => ({ ...a, needs: e.target.value }))}
              sx={{ mb: 3 }}
            />
            <Button fullWidth variant="contained" onClick={continueStep1}
              sx={{ bgcolor: WALNUT, py: 1.6, fontWeight: 700, letterSpacing: '0.08em', '&:hover': { bgcolor: COPPER } }}>
              Continue
            </Button>
            {waHref && (
              <Typography sx={{ mt: 2, textAlign: 'center', fontSize: '0.82rem', color: '#6b5a4c' }}>
                Prefer to talk now?{' '}
                <Box component="a" href={waHref} target="_blank" rel="noopener noreferrer"
                  onClick={() => trackEvent('WHATSAPP_CLICK', { productId: product.id, path: window.location.pathname })}
                  sx={{ color: WA_GREEN, fontWeight: 700 }}>Chat on WhatsApp</Box>
              </Typography>
            )}
          </Box>
        ) : (
          <Box component="form" noValidate onSubmit={(ev: React.FormEvent) => { ev.preventDefault(); submit(); }}>
            <Typography id="lead-title" component="h2" sx={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: '1.55rem', fontWeight: 700, color: WALNUT, mb: 0.5 }}>
              Where should we send your quote?
            </Typography>
            <Typography sx={{ color: '#6b5a4c', fontSize: '0.9rem', mb: 3 }}>
              Our design team replies {settings.responsePromise}. No obligation.
            </Typography>

            <Stack spacing={2.25}>
              <TextField label="Your name" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)}
                error={!!errors.name} helperText={errors.name} fullWidth sx={fieldSx} />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField select label="Code" value={phoneCountry} onChange={(e) => setPhoneCountry(e.target.value)}
                  sx={{ width: 128, flexShrink: 0 }} slotProps={{ select: { renderValue: (v) => `${v} +${findPhoneCountry(v as string).dial}` } }}>
                  {PHONE_COUNTRIES.map((c) => <MenuItem key={c.code} value={c.code}>{c.name} +{c.dial}</MenuItem>)}
                </TextField>
                <TextField label="Mobile number" required type="tel" autoComplete="tel-national" value={phone}
                  slotProps={{ htmlInput: { inputMode: 'tel', 'aria-describedby': 'phone-help' } }}
                  onChange={(e) => setPhone(e.target.value)} error={!!errors.phone}
                  helperText={errors.phone || `We will use +${dial} numbers only for this request`} fullWidth sx={fieldSx} />
              </Box>
              <TextField label="Email" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email} helperText={errors.email} fullWidth sx={fieldSx} />

              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', mb: 0.75 }}>Best way to reach you</Typography>
                <ToggleButtonGroup exclusive fullWidth size="small" value={contact} onChange={(_, v) => v && setContact(v)} aria-label="Preferred contact">
                  {(['WHATSAPP', 'CALL', 'EMAIL'] as const).map((v) => (
                    <ToggleButton key={v} value={v} sx={{ fontWeight: 700, fontSize: '0.75rem', '&.Mui-selected': { bgcolor: WALNUT, color: '#fff', '&:hover': { bgcolor: WALNUT } } }}>
                      {v === 'WHATSAPP' ? 'WhatsApp' : v === 'CALL' ? 'Call' : 'Email'}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {/* Honeypot: hidden from people and assistive tech, bots fill it. */}
              <Box aria-hidden sx={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
                <label>Website<input tabIndex={-1} autoComplete="off" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
              </Box>

              <Box>
                <FormControlLabel
                  control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} sx={{ color: errors.consent ? '#c0392b' : undefined, '&.Mui-checked': { color: WALNUT } }} />}
                  label={<Typography sx={{ fontSize: '0.82rem', color: '#4a3b30' }}>I agree to be contacted about this enquiry. We never share your details.</Typography>}
                />
                {errors.consent && <Typography role="alert" sx={{ color: '#c0392b', fontSize: '0.75rem', ml: 4 }}>{errors.consent}</Typography>}
              </Box>

              {status === 'error' && (
                <Box role="alert" sx={{ bgcolor: '#fdf1ee', border: '1px solid #f0c9c0', color: '#8a2d1c', borderRadius: 1, p: 1.5, fontSize: '0.85rem' }}>
                  {serverError}
                  {waHref && <> <Box component="a" href={waHref} target="_blank" rel="noopener noreferrer" sx={{ color: WA_GREEN, fontWeight: 700 }}>Chat on WhatsApp</Box></>}
                </Box>
              )}

              <Button type="submit" fullWidth variant="contained" loading={status === 'sending'} loadingPosition="start"
                sx={{ bgcolor: WALNUT, py: 1.6, fontWeight: 700, letterSpacing: '0.08em', '&:hover': { bgcolor: COPPER },
                  '&.MuiButton-loading': { color: 'transparent' }, '& .MuiButton-loadingIndicator': { color: '#fff' } }}>
                {status === 'sending' ? 'Sending' : 'Send My Request'}
              </Button>
              <Typography sx={{ fontSize: '0.72rem', color: '#8a7a6c', textAlign: 'center' }}>
                Used only to reply to this request. See our privacy policy.
              </Typography>
            </Stack>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}

const fieldSx = { '& .MuiFormHelperText-root.Mui-error': { color: '#b3261e', opacity: 1 } };

const chipSx = (selected: boolean) => ({
  fontWeight: 600, fontSize: '0.85rem', height: 38, borderRadius: 19,
  bgcolor: selected ? WALNUT : '#fff', color: selected ? '#fff' : WALNUT,
  border: '1.5px solid', borderColor: selected ? WALNUT : '#d9cbbb',
  '&:hover': { bgcolor: selected ? WALNUT : '#f6ede2' },
});
