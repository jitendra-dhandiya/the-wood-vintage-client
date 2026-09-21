'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box, Container, Grid, Typography, TextField, Button,
  Radio, RadioGroup, FormControlLabel,
  Card, CardContent, Stack, Divider,
  CircularProgress, Dialog, DialogContent, Chip,
} from '@mui/material';
import {
  CheckCircle, Error as ErrorIcon, HourglassEmpty,
  CreditCard, LocalShipping, FlashOn, Payments,
} from '@mui/icons-material';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { useCart } from '../../../../hooks/useCart';
import { orderApi, paymentApi, userApi } from '../../../../services/api.service';
import { useCoupon, useCouponOffers, clearStoredCoupon } from '../../../../hooks/useCoupon';
import CouponBox from '../../../../components/cart/CouponBox';
import { trackEvent } from '../../../../lib/analytics';
import { readStoredAttribution } from '../../../../lib/attribution';
import { formatPrice } from '../../../../utils/format';
import { SHIPPING_METHODS, FREE_SHIPPING_THRESHOLD, type ShippingMethodId } from '../../../../constants';
import { useAppSelector, useAppDispatch } from '../../../../store';
import { openLoginModal } from '../../../../store/slices/uiSlice';
import { useCountry } from '../../../../contexts/CountryContext';
import { withCountry } from '../../../../lib/withCountry';
import type { Address } from '../../../../types';
import toast from 'react-hot-toast';

const addressSchema = Yup.object({
  firstName:    Yup.string().required('Required'),
  lastName:     Yup.string().required('Required'),
  phone:        Yup.string().required('Required'),
  addressLine1: Yup.string().required('Required'),
  city:         Yup.string().required('Required'),
  state:        Yup.string().required('Required'),
  pincode:      Yup.string().required('Required'),
});

declare global { interface Window { Razorpay: any } }

type PayStatus = 'idle' | 'processing' | 'success' | 'failed' | 'pending';

const SHIPPING_ICONS: Record<string, React.ReactNode> = {
  STANDARD: <LocalShipping sx={{ fontSize: 20, color: '#A0693A' }} />,
  COD:      <Payments     sx={{ fontSize: 20, color: '#ed6c02' }} />,
  EXPRESS:  <FlashOn      sx={{ fontSize: 20, color: '#1976d2' }} />,
};

export default function CheckoutPage() {
  const router        = useRouter();
  const { cart, subtotal, clearCart } = useCart();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const { country, countries, currencySymbol } = useCountry();

  const [shippingMethod, setShippingMethod] = useState<ShippingMethodId>('STANDARD');
  const [paymentMethod,  setPaymentMethod]  = useState('CASHFREE');
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [loading,    setLoading]    = useState(false);
  const [payStatus,  setPayStatus]  = useState<PayStatus>('idle');
  const [successOrder, setSuccessOrder] = useState<{ orderNumber: string; orderId: string } | null>(null);

  // The coupon code is remembered client-side (cart -> checkout), but every
  // figure comes from the server's preview of this cart. The cart drawer skips
  // /cart entirely, so this is the only place most customers can enter one.
  const coupon = useCoupon(shippingMethod);
  const offers = useCouponOffers();
  const couponCode = coupon.code ?? undefined;
  const couponDiscount = coupon.discount;
  const freeShipping = coupon.freeShipping;

  // Resolve shipping charge from selected method. Mirrors order.service.ts's
  // server-side logic exactly: a per-product shipping-charge override (set on
  // the product, one field per method) wins over the flat SHIPPING_METHODS
  // rate when present, taking the highest override across the cart's items.
  // The backend was always authoritative for what actually gets charged —
  // this fixes what was *shown* before checkout to match it, so a product
  // with an override doesn't display one number and charge another.
  const selectedShipping = SHIPPING_METHODS.find(m => m.id === shippingMethod)!;
  const shippingChargeField: Partial<Record<ShippingMethodId, 'standardShippingCharge' | 'codShippingCharge' | 'expressShippingCharge'>> = {
    STANDARD: 'standardShippingCharge',
    COD: 'codShippingCharge',
    EXPRESS: 'expressShippingCharge',
  };
  const overrideField = shippingChargeField[shippingMethod];
  const productOverrides = overrideField
    ? (cart?.items ?? [])
        .map(item => Number(item.product?.[overrideField] ?? 0))
        .filter(charge => charge > 0)
    : [];
  // Storewide threshold: Standard delivery is free above it (mirrors order.service.ts).
  const qualifiesForFreeStandard =
    shippingMethod === 'STANDARD' && subtotal - couponDiscount >= FREE_SHIPPING_THRESHOLD;
  const localShipping = freeShipping || qualifiesForFreeStandard
    ? 0
    : productOverrides.length > 0
      ? Math.max(...productOverrides)
      : selectedShipping.charge;
  // With a coupon on, the server's preview (same engine that prices the order)
  // supplies the delivery charge and total, so what is shown is what is charged.
  const pv = coupon.preview && !coupon.checking ? coupon.preview : null;
  const shippingCharge = pv ? pv.shippingCharge : localShipping;
  const total            = pv ? pv.total : subtotal - couponDiscount + shippingCharge;

  // When COD shipping is chosen, payment is always COD. When switching away, default to Cashfree.
  useEffect(() => {
    if (shippingMethod === 'COD') {
      setPaymentMethod('COD');
    } else if (paymentMethod === 'COD') {
      setPaymentMethod('CASHFREE');
    }
  }, [shippingMethod]);

  useEffect(() => {
    if (!isAuthenticated) { dispatch(openLoginModal()); return; }
    userApi.getAddresses().then(({ data }) => {
      setSavedAddresses(data.data || []);
      const def = data.data?.find((a: Address) => a.isDefault);
      if (def) setSelectedAddressId(def.id);
    });
  }, [isAuthenticated, router]);

  // Phase 7 (Analytics) CHECKOUT_STARTED -- once on mount, the standard
  // fire-once pattern used elsewhere in this codebase (empty dependency array).
  useEffect(() => {
    trackEvent('CHECKOUT_STARTED');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Razorpay loader ────────────────────────────────────────────
  const loadRazorpay = () => new Promise<boolean>((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s   = document.createElement('script');
    s.src     = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  // ── Shared Cashfree loader ─────────────────────────────────────
  const loadCashfreeSDK = async (sessionId: string) => {
    const { load } = await import('@cashfreepayments/cashfree-js');
    const cashfree = await load({ mode: 'production' });
    await cashfree.checkout({ paymentSessionId: sessionId, redirectTarget: '_modal' });
  };

  // ── Poll for full-payment status ──────────────────────────────
  const pollPaymentStatus = useCallback(async (orderId: string, orderNumber: string) => {
    const MAX = 6;
    for (let i = 0; i < MAX; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 1500 : 5000));
      try {
        const { data: s } = await paymentApi.getCashfreePaymentStatus(orderId);
        const { paymentStatus } = (s as any).data;
        if (paymentStatus === 'PAID') {
          await clearCart();
          setSuccessOrder({ orderNumber, orderId });
          setPayStatus('success');
          return;
        } else if (paymentStatus === 'FAILED') {
          setPayStatus('failed');
          return;
        }
      } catch { /* keep polling */ }
    }
    setPayStatus('pending');
  }, [clearCart]);

  // ── Poll for COD delivery-deposit status ──────────────────────
  const pollCodDepositStatus = useCallback(async (orderId: string, orderNumber: string) => {
    const MAX = 6;
    for (let i = 0; i < MAX; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 1500 : 5000));
      try {
        const { data: s } = await paymentApi.getCashfreePaymentStatus(orderId);
        const d = (s as any).data;
        // deliveryChargePaid=true → deposit collected; order confirmed; product paid on delivery
        if (d.deliveryChargePaid === true) {
          await clearCart();
          setSuccessOrder({ orderNumber, orderId });
          setPayStatus('success');
          return;
        } else if (d.paymentStatus === 'FAILED') {
          setPayStatus('failed');
          return;
        }
      } catch { /* keep polling */ }
    }
    setPayStatus('pending');
  }, [clearCart]);

  // ── Open Cashfree modal for full payment ──────────────────────
  const openCashfreeModal = async (orderId: string, orderNumber: string) => {
    setPayStatus('processing');
    try {
      const { data: cfRes } = await paymentApi.createCashfreeOrder(orderId);
      const { paymentSessionId } = (cfRes as any).data;
      if (!paymentSessionId) throw new Error('No payment session ID returned');
      await loadCashfreeSDK(paymentSessionId);
      setPayStatus('processing');
      await pollPaymentStatus(orderId, orderNumber);
    } catch (err: any) {
      console.error('Cashfree error:', err);
      setPayStatus('failed');
    }
  };

  // ── Open Cashfree modal for COD delivery deposit ──────────────
  const openCashfreeCodDeposit = async (orderId: string, orderNumber: string) => {
    setPayStatus('processing');
    try {
      const { data: cfRes } = await paymentApi.createCashfreeCodDeposit(orderId);
      const { paymentSessionId } = (cfRes as any).data;
      if (!paymentSessionId) throw new Error('No deposit session ID returned');
      await loadCashfreeSDK(paymentSessionId);
      setPayStatus('processing');
      await pollCodDepositStatus(orderId, orderNumber);
    } catch (err: any) {
      console.error('COD deposit error:', err);
      setPayStatus('failed');
    }
  };

  // ── Place order ────────────────────────────────────────────────
  const handlePlaceOrder = async (shippingAddress: object) => {
    if (loading) return; // double-submit guard (Enter key, double click)
    if (!cart?.items.length) { toast.error('Your cart is empty'); return; }
    setLoading(true);
    try {
      // `POST /orders` hard-400s on a country it cannot resolve (unlike the
      // read-only product endpoints, which degrade gracefully) — see
      // docs/decisions/0009-country-architecture-implemented.md. A stale
      // `wv_country` cookie from a market that has since been disabled must
      // not be forwarded blindly, so only a value CountryContext has itself
      // confirmed against the live `GET /countries` list is sent; otherwise
      // the field is simply omitted, which the backend treats exactly like
      // the default country (unchanged, pre-existing behaviour).
      const validCountry = country && countries.some((c) => c.code === country) ? country : undefined;

      // Phase 7 (Analytics) marketing attribution -- first-touch utm_*
      // params captured by AttributionInitializer into the `wv_attribution`
      // cookie, threaded through here so the resulting Order carries them
      // (see phase-7-analytics-spec.md §4). Absent entirely when no
      // attribution was ever captured, same as every other optional field.
      const attribution = readStoredAttribution();

      const { data: orderData } = await orderApi.create({
        addressId:      selectedAddressId || undefined,
        paymentMethod,
        shippingMethod,
        couponCode,
        shippingAddress,
        country: validCountry,
        utmSource: attribution?.utmSource,
        utmMedium: attribution?.utmMedium,
        utmCampaign: attribution?.utmCampaign,
        items: cart.items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity:  i.quantity,
          price:     i.price,
        })),
      });
      const order = orderData.data;
      // The order now carries (and has redeemed) the coupon: forget the code.
      clearStoredCoupon();

      // COD — collect delivery charge upfront via Cashfree, product paid on delivery
      if (paymentMethod === 'COD') {
        await openCashfreeCodDeposit(order.id, order.orderNumber);
        return;
      }

      // Razorpay
      if (paymentMethod === 'RAZORPAY') {
        const loaded = await loadRazorpay();
        if (!loaded) { toast.error('Payment gateway failed to load'); return; }
        const { data: rpData } = await paymentApi.createRazorpayOrder(order.id);
        new window.Razorpay({
          key:         process.env.NEXT_PUBLIC_RAZORPAY_KEY,
          amount:      (rpData as any).data.amount,
          currency:    (rpData as any).data.currency,
          order_id:    (rpData as any).data.razorpayOrderId,
          name:        'The Wood Vintage',
          description: `Order ${order.orderNumber}`,
          prefill:     { name: `${user?.firstName} ${user?.lastName}`, email: user?.email, contact: user?.phone },
          theme:       { color: '#3B2314' },
          handler: async (response: any) => {
            try {
              await paymentApi.verifyPayment({ ...response, orderId: order.id });
              await clearCart();
              router.push(withCountry(`/order-success?orderNumber=${order.orderNumber}`, country));
            } catch { toast.error('Payment verification failed'); }
          },
          modal: { ondismiss: () => toast.error('Payment cancelled') },
        }).open();
        return;
      }

      // Cashfree (default)
      await openCashfreeModal(order.id, order.orderNumber);

    } catch (e: any) {
      const body = e?.response?.data;
      if (String(body?.code ?? '').startsWith('COUPON_')) {
        // The coupon stopped qualifying between preview and placing the order
        // (limit reached, expired...). Nothing was charged; drop it and say why.
        coupon.dropWithError(body.message);
        toast.error(`${body.message} Your order was not placed. Review the total and try again.`);
      } else {
        toast.error(body?.message || 'Failed to place order');
      }
    } finally {
      setLoading(false);
    }
  };

  const closeStatusModal = () => {
    if (payStatus === 'success' && successOrder) {
      router.push(withCountry(`/order-success?orderNumber=${successOrder.orderNumber}`, country));
    } else {
      setPayStatus('idle');
    }
  };

  return (
    <>
      <Container maxWidth="xl" sx={{ py: 4, pb: { xs: 10, md: 6 } }}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700, mb: 4 }}>
          Checkout
        </Typography>

        <Grid container spacing={4}>
          {/* ── Left ─────────────────────────────────────── */}
          <Grid item xs={12} md={7} lg={8}>
            <Formik
              initialValues={{
                firstName: user?.firstName || '', lastName: user?.lastName || '',
                phone: user?.phone || '', addressLine1: '', addressLine2: '',
                city: '', state: '', pincode: '', country: 'India',
              }}
              validationSchema={selectedAddressId ? undefined : addressSchema}
              onSubmit={(values) => handlePlaceOrder(values)}
            >
              {({ errors, touched }) => (
                <Form>
                  {/* Saved addresses */}
                  {savedAddresses.length > 0 && (
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Saved Addresses</Typography>
                        <RadioGroup value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)}>
                          {savedAddresses.map((addr) => (
                            <FormControlLabel
                              key={addr.id}
                              value={addr.id}
                              control={<Radio sx={{ '&.Mui-checked': { color: '#3B2314' } }} />}
                              label={
                                <Box>
                                  <Typography variant="body2" fontWeight={600}>
                                    {addr.firstName} {addr.lastName} — {addr.type}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}
                                  </Typography>
                                </Box>
                              }
                              sx={{ mb: 1, alignItems: 'flex-start', '& .MuiRadio-root': { mt: -0.5 } }}
                            />
                          ))}
                          <FormControlLabel
                            value=""
                            control={<Radio sx={{ '&.Mui-checked': { color: '#3B2314' } }} />}
                            label="Use a new address"
                          />
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  )}

                  {/* New address form */}
                  {!selectedAddressId && (
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>
                          {savedAddresses.length > 0 ? 'New Address' : 'Delivery Address'}
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Field as={TextField} name="firstName" label="First Name" fullWidth size="small"
                              error={touched.firstName && !!errors.firstName} helperText={touched.firstName && errors.firstName} />
                          </Grid>
                          <Grid item xs={6}>
                            <Field as={TextField} name="lastName" label="Last Name" fullWidth size="small"
                              error={touched.lastName && !!errors.lastName} helperText={touched.lastName && errors.lastName} />
                          </Grid>
                          <Grid item xs={12}>
                            <Field as={TextField} name="phone" label="Phone Number" fullWidth size="small"
                              error={touched.phone && !!errors.phone} helperText={touched.phone && errors.phone} />
                          </Grid>
                          <Grid item xs={12}>
                            <Field as={TextField} name="addressLine1" label="Address Line 1" fullWidth size="small"
                              error={touched.addressLine1 && !!errors.addressLine1} helperText={touched.addressLine1 && errors.addressLine1} />
                          </Grid>
                          <Grid item xs={12}>
                            <Field as={TextField} name="addressLine2" label="Address Line 2 (Optional)" fullWidth size="small" />
                          </Grid>
                          {/* One line of three only from sm up. At xs the Pincode field
                              came out around 53px wide — too narrow to read what you typed. */}
                          <Grid item xs={12} sm={5}>
                            <Field as={TextField} name="city" label="City" fullWidth size="small"
                              error={touched.city && !!errors.city} helperText={touched.city && errors.city} />
                          </Grid>
                          <Grid item xs={6} sm={4}>
                            <Field as={TextField} name="state" label="State" fullWidth size="small"
                              error={touched.state && !!errors.state} helperText={touched.state && errors.state} />
                          </Grid>
                          <Grid item xs={6} sm={3}>
                            <Field as={TextField} name="pincode" label="Pincode" fullWidth size="small"
                              error={touched.pincode && !!errors.pincode} helperText={touched.pincode && errors.pincode} />
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  )}

                  {/* ── Shipping method ───────────────────────── */}
                  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Shipping Method</Typography>
                      <Stack spacing={1.5}>
                        {SHIPPING_METHODS.map((method) => {
                          const selected = shippingMethod === method.id;
                          return (
                            <Box
                              key={method.id}
                              onClick={() => setShippingMethod(method.id as ShippingMethodId)}
                              sx={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                p: 2, borderRadius: 1.5, cursor: 'pointer',
                                border: '1.5px solid',
                                borderColor: selected ? '#3B2314' : '#e0e0e0',
                                bgcolor: selected ? '#FFFCF5' : 'white',
                                transition: 'all 0.15s',
                                '&:hover': { borderColor: '#999' },
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Radio
                                  checked={selected}
                                  onChange={() => setShippingMethod(method.id as ShippingMethodId)}
                                  sx={{ p: 0, '&.Mui-checked': { color: '#3B2314' } }}
                                />
                                {SHIPPING_ICONS[method.id]}
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight={700}>{method.label}</Typography>
                                    {method.id === 'EXPRESS' && (
                                      <Chip label="FASTEST" size="small" sx={{
                                        height: 16, fontSize: '0.55rem', fontWeight: 700,
                                        bgcolor: '#1976d2', color: 'white', letterSpacing: '0.05em',
                                      }} />
                                    )}
                                    {method.id === 'STANDARD' && (
                                      <Chip label="POPULAR" size="small" sx={{
                                        height: 16, fontSize: '0.55rem', fontWeight: 700,
                                        bgcolor: '#2e7d32', color: 'white', letterSpacing: '0.05em',
                                      }} />
                                    )}
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    {method.description}
                                  </Typography>
                                </Box>
                              </Box>
                              <Typography variant="body2" fontWeight={800} sx={{ flexShrink: 0, ml: 2 }}>
                                {formatPrice(method.charge, currencySymbol)}
                              </Typography>
                            </Box>
                          );
                        })}
                      </Stack>
                    </CardContent>
                  </Card>

                  {/* ── Payment method (hidden when COD shipping) ── */}
                  {shippingMethod !== 'COD' && (
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Payment</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                          All transactions are secure and encrypted.
                        </Typography>
                        <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                          {/* Razorpay */}
                          <Box
                            onClick={() => setPaymentMethod('RAZORPAY')}
                            sx={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              // Measured at 424px inside a 311px card on a 393px phone: the
                              // provider name and the card badges could neither wrap nor
                              // shrink, so the right of the row was simply cut off.
                              flexWrap: 'wrap', gap: 1,
                              p: 2, mb: 1.5, borderRadius: 1.5, cursor: 'pointer',
                              border: '1.5px solid',
                              borderColor: paymentMethod === 'RAZORPAY' ? '#3B2314' : '#e0e0e0',
                              bgcolor: paymentMethod === 'RAZORPAY' ? '#FFFCF5' : 'white',
                              transition: 'all 0.15s',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: '1 1 200px' }}>
                              <Radio checked={paymentMethod === 'RAZORPAY'} onChange={() => setPaymentMethod('RAZORPAY')}
                                sx={{ p: 0, '&.Mui-checked': { color: '#3B2314' } }} />
                              <CreditCard sx={{ color: '#3B2314', fontSize: 20, flexShrink: 0 }} />
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={600}>
                                  Razorpay Secure (UPI, Cards, Int'l Cards, Wallets)
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Cards, UPI, Net Banking · Powered by Razorpay
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 1 }}>
                              {['UPI', 'VISA', 'MC'].map(b => (
                                <Box key={b} sx={{ border: '1px solid #e0e0e0', borderRadius: 0.5, px: 0.75, py: 0.25 }}>
                                  <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#555' }}>{b}</Typography>
                                </Box>
                              ))}
                              <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 0.5, px: 0.75, py: 0.25 }}>
                                <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#555' }}>+11</Typography>
                              </Box>
                            </Box>
                          </Box>

                          {/* Cashfree */}
                          <Box
                            onClick={() => setPaymentMethod('CASHFREE')}
                            sx={{
                              p: 2, borderRadius: 1.5, cursor: 'pointer',
                              border: '1.5px solid',
                              borderColor: paymentMethod === 'CASHFREE' ? '#3B2314' : '#e0e0e0',
                              bgcolor: paymentMethod === 'CASHFREE' ? '#FFFCF5' : 'white',
                              transition: 'all 0.15s',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: '1 1 200px' }}>
                                <Radio checked={paymentMethod === 'CASHFREE'} onChange={() => setPaymentMethod('CASHFREE')}
                                  sx={{ p: 0, '&.Mui-checked': { color: '#3B2314' } }} />
                                <CreditCard sx={{ color: '#3B2314', fontSize: 20 }} />
                                <Box sx={{ minWidth: 0 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography variant="body2" fontWeight={700}>
                                      PhonePe Payment Gateway (UPI, Cards & NetBanking)
                                    </Typography>
                                    <Box sx={{
                                      bgcolor: '#4caf50', color: 'white', fontSize: '0.55rem', fontWeight: 700,
                                      px: 0.75, py: 0.2, borderRadius: 0.75, letterSpacing: '0.05em',
                                    }}>
                                      RECOMMENDED
                                    </Box>
                                  </Box>
                                  <Typography variant="caption" color="text.secondary">
                                    UPI, Cards, Net Banking, Wallets · Powered by Cashfree
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0, ml: 1 }}>
                                {['UPI', 'VISA', 'MC'].map(b => (
                                  <Box key={b} sx={{ border: '1px solid #e0e0e0', borderRadius: 0.5, px: 0.75, py: 0.25 }}>
                                    <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#555' }}>{b}</Typography>
                                  </Box>
                                ))}
                                <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 0.5, px: 0.75, py: 0.25 }}>
                                  <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#555' }}>+4</Typography>
                                </Box>
                              </Box>
                            </Box>
                            {paymentMethod === 'CASHFREE' && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, pl: 4.5 }}>
                                You'll be redirected to PhonePe Payment Gateway (UPI, Cards & NetBanking) to complete your purchase.
                              </Typography>
                            )}
                          </Box>
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  )}

                  {/* COD info banner */}
                  {shippingMethod === 'COD' && (
                    <Card elevation={0} sx={{ border: '1px solid #ed6c02', borderRadius: 2, mb: 3, bgcolor: '#fff8f0' }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                          <Payments sx={{ color: '#ed6c02', fontSize: 22, mt: 0.2 }} />
                          <Box>
                            <Typography variant="body2" fontWeight={700} color="#ed6c02">
                              Pay Delivery Charge Online · Pay Products on Delivery
                            </Typography>
                            <Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.5 }}>
                              You pay <strong>₹{selectedShipping.charge} now</strong> (delivery charge) via UPI / Card / Net Banking.
                              The remaining <strong>{formatPrice(subtotal - couponDiscount, currencySymbol)}</strong> is paid in cash when your order arrives.
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  )}

                  <Button
                    type="submit" fullWidth variant="contained" size="large"
                    disabled={loading}
                    aria-busy={loading}
                    sx={{
                      bgcolor: '#3B2314', py: 2, fontSize: '0.85rem',
                      letterSpacing: '0.12em', fontWeight: 700,
                      '&:hover': { bgcolor: '#A0693A' },
                      '&.Mui-disabled': { bgcolor: '#5A3D2B', color: '#fff' },
                    }}
                  >
                    {loading
                      ? <><CircularProgress size={18} thickness={5} sx={{ color: 'white', mr: 1.25 }} />Placing your order…</>
                      : shippingMethod === 'COD'
                        ? `Pay Delivery ₹${selectedShipping.charge} & Place Order`
                        : `Place Order & Pay — ${formatPrice(total, currencySymbol)}`
                    }
                  </Button>
                </Form>
              )}
            </Formik>
          </Grid>

          {/* ── Order summary ─────────────────────────────── */}
          <Grid item xs={12} md={5} lg={4}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, position: 'sticky', top: 88 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ mb: 2.5 }}>Order Summary</Typography>

                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  {cart?.items.map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{
                          bgcolor: '#3B2314', color: 'white', borderRadius: '50%',
                          width: 18, height: 18, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: '0.6rem', flexShrink: 0,
                        }}>
                          {item.quantity}
                        </Typography>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>{item.product?.name}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={600}>{formatPrice(item.price * item.quantity, currencySymbol)}</Typography>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <CouponBox
                    code={coupon.code} preview={coupon.preview} applying={coupon.applying}
                    checking={coupon.checking} error={coupon.error} appliedTick={coupon.appliedTick}
                    offers={offers} onApply={coupon.apply} onRemove={coupon.remove}
                    onInputChange={coupon.clearError} currencySymbol={currencySymbol}
                  />
                </Box>

                <Stack spacing={1} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                    <Typography variant="body2">{formatPrice(subtotal, currencySymbol)}</Typography>
                  </Box>
                  {couponDiscount > 0 && (
                    <Box key={coupon.appliedTick} className={coupon.appliedTick ? 'coupon-flash' : undefined} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="success.main">Coupon ({couponCode})</Typography>
                      <Typography variant="body2" color="success.main">-{formatPrice(couponDiscount, currencySymbol)}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Typography variant="body2" color="text.secondary">Shipping</Typography>
                      <Typography variant="caption" sx={{
                        bgcolor: '#f5f5f5', px: 0.75, py: 0.2,
                        borderRadius: 0.5, fontSize: '0.6rem', fontWeight: 600, color: '#666',
                      }}>
                        {selectedShipping.label}
                      </Typography>
                    </Box>
                    {freeShipping ? (
                      <Typography variant="body2" fontWeight={700} color="success.main">FREE</Typography>
                    ) : (
                      <Typography variant="body2" fontWeight={600}>{formatPrice(shippingCharge, currencySymbol)}</Typography>
                    )}
                  </Box>
                  <Divider />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography fontWeight={800}>Total</Typography>
                    <Typography fontWeight={800} fontSize="1.1rem">{formatPrice(total, currencySymbol)}</Typography>
                  </Box>
                </Stack>

                {/* Delivery estimate */}
                <Box sx={{
                  bgcolor: '#f9f9f9', borderRadius: 1.5, p: 1.5,
                  display: 'flex', alignItems: 'center', gap: 1,
                }}>
                  {SHIPPING_ICONS[shippingMethod]}
                  <Typography variant="caption" color="text.secondary">
                    <strong>{selectedShipping.label} Delivery:</strong> {selectedShipping.days}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* ── Payment status modal ─────────────────────────────── */}
      <Dialog
        open={payStatus !== 'idle'}
        onClose={payStatus === 'success' || payStatus === 'failed' || payStatus === 'pending' ? closeStatusModal : undefined}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogContent sx={{ p: 0 }}>
          {payStatus === 'processing' && (
            <Box sx={{ textAlign: 'center', py: 6, px: 4 }}>
              <CircularProgress size={52} sx={{ color: '#3B2314', mb: 2.5 }} />
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Verifying Payment</Typography>
              <Typography variant="body2" color="text.secondary">
                Please wait while we confirm your payment…
              </Typography>
            </Box>
          )}

          {payStatus === 'success' && (
            <Box sx={{ textAlign: 'center', py: 5, px: 4 }}>
              <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
                <CheckCircle sx={{ fontSize: 40, color: '#4caf50' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Payment Successful!</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your order <strong>#{successOrder?.orderNumber}</strong> has been confirmed.
              </Typography>
              <Button variant="contained" fullWidth onClick={closeStatusModal} sx={{ bgcolor: '#3B2314', py: 1.5, fontWeight: 700 }}>
                View Order
              </Button>
            </Box>
          )}

          {payStatus === 'failed' && (
            <Box sx={{ textAlign: 'center', py: 5, px: 4 }}>
              <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: '#ffebee', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
                <ErrorIcon sx={{ fontSize: 40, color: '#f44336' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Payment Failed</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your payment was not completed. No amount has been deducted.
              </Typography>
              <Button variant="contained" fullWidth onClick={closeStatusModal} sx={{ bgcolor: '#3B2314', py: 1.5, fontWeight: 700 }}>
                Try Again
              </Button>
            </Box>
          )}

          {payStatus === 'pending' && (
            <Box sx={{ textAlign: 'center', py: 5, px: 4 }}>
              <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: '#fff8e1', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5 }}>
                <HourglassEmpty sx={{ fontSize: 40, color: '#ff9800' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Payment Pending</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                We're still waiting for your bank to confirm. Check your orders in a few minutes — your order has been saved.
              </Typography>
              <Stack spacing={1.5}>
                <Button variant="contained" fullWidth onClick={() => router.push('/account/orders')} sx={{ bgcolor: '#3B2314', py: 1.5, fontWeight: 700 }}>
                  Go to My Orders
                </Button>
                <Button variant="outlined" fullWidth onClick={closeStatusModal} sx={{ py: 1.5 }}>
                  Close
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
