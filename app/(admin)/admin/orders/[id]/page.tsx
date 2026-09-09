'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Avatar, Divider,
  IconButton, Button, TextField, MenuItem, Dialog, DialogTitle,
  DialogContent, DialogActions, Skeleton, Stack, Tooltip,
  ToggleButton, ToggleButtonGroup, InputAdornment, Alert,
} from '@mui/material';
import {
  ArrowBack, ContentCopy, Phone, Email, LocalShipping, DirectionsBike, Save,
} from '@mui/icons-material';
import { orderApi } from '../../../../../services/api.service';
import DeliveryOtpCard from '../../../../../components/admin/DeliveryOtpCard';
import { formatDate, formatPrice } from '../../../../../utils/format';
import { orderAddress, formatAddressBlock } from '../../../../../lib/orderAddress';
import { toast } from 'react-hot-toast';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'RETURNED'];
const STATUS_COLORS: Record<string, any> = {
  PENDING: 'warning', CONFIRMED: 'info', PROCESSING: 'info',
  SHIPPED: 'primary', OUT_FOR_DELIVERY: 'primary', DELIVERED: 'success',
  CANCELLED: 'error', RETURNED: 'default',
};

export default function OrderDetailAdminPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusDialog, setStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delivery method — edited in place rather than in a dialog, because it is
  // read on every visit and changed on some of them.
  const [fulfilment, setFulfilment] = useState<'SELF' | 'DELHIVERY'>('DELHIVERY');
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [codCollected, setCodCollected] = useState('');
  const [waybill, setWaybill] = useState('');
  const [savingFulfilment, setSavingFulfilment] = useState(false);
  // Only ever filled in when closing a self-delivery that has no confirmed
  // code — a customer with no email, a phone that never answered.
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    orderApi.getByIdAdmin(id).then(({ data }) => {
      const o = data.data as any;
      setOrder(o);
      setNewStatus(o.status);
      setTrackingNumber(o.trackingNumber || '');
      setFulfilment(o.fulfilmentType === 'SELF' ? 'SELF' : 'DELHIVERY');
      setPartnerName(o.deliveryPartnerName || '');
      setPartnerPhone(o.deliveryPartnerPhone || '');
      setDeliveryNotes(o.deliveryNotes || '');
      setCodCollected(o.codCollected != null ? String(o.codCollected) : '');
      setWaybill(o.trackingNumber || '');
    }).finally(() => setLoading(false));
  }, [id]);

  const saveFulfilment = async () => {
    if (fulfilment === 'SELF' && !partnerName.trim()) {
      toast.error('Add the name of the person delivering this order');
      return;
    }
    setSavingFulfilment(true);
    try {
      const { data } = await orderApi.updateFulfilment(id, {
        fulfilmentType: fulfilment,
        deliveryPartnerName:  fulfilment === 'SELF' ? partnerName.trim()  : null,
        deliveryPartnerPhone: fulfilment === 'SELF' ? partnerPhone.trim() : null,
        deliveryNotes: deliveryNotes.trim() || null,
        codCollected: codCollected.trim() === '' ? null : Number(codCollected),
        trackingNumber: fulfilment === 'DELHIVERY' ? (waybill.trim() || null) : null,
      });
      setOrder((o: any) => ({ ...o, ...(data as any).data }));
      toast.success('Delivery method saved');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Could not save the delivery method');
    } finally {
      setSavingFulfilment(false);
    }
  };

  const updateStatus = async () => {
    setUpdating(true);
    try {
      await orderApi.updateStatus(id, {
        status: newStatus,
        trackingNumber: trackingNumber || undefined,
        overrideReason: overrideReason.trim() || undefined,
      });
      toast.success('Status updated');
      setStatusDialog(false);
      setOverrideReason('');
      setOrder((o: any) => ({ ...o, status: newStatus, trackingNumber }));
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <Box>
      <Skeleton height={40} width={200} sx={{ mb: 2 }} />
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        </Grid>
      </Grid>
    </Box>
  );

  if (!order) return <Typography>Order not found</Typography>;

  const addr = orderAddress(order);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => router.push('/admin/orders')}><ArrowBack /></IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: 'var(--font-playfair)', fontWeight: 700 }}>
            Order #{order.orderNumber}
          </Typography>
          <Typography variant="caption" color="text.secondary">{formatDate(order.createdAt)}</Typography>
        </Box>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
          <Chip
            size="small"
            icon={order.fulfilmentType === 'SELF'
              ? <DirectionsBike sx={{ fontSize: 15 }} />
              : <LocalShipping sx={{ fontSize: 15 }} />}
            label={order.fulfilmentType === 'SELF' ? 'Self delivery' : 'Delhivery'}
            sx={{ fontWeight: 700, bgcolor: order.fulfilmentType === 'SELF' ? '#ede7f6' : '#e3f2fd' }}
          />
          <Chip label={order.status} color={STATUS_COLORS[order.status] || 'default'} sx={{ fontWeight: 700 }} />
          <Button variant="outlined" size="small" onClick={() => setStatusDialog(true)}
            sx={{ borderColor: '#1a1a1a', color: '#1a1a1a' }}>
            Update Status
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Order items */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Order Items</Typography>
              <Stack spacing={2}>
                {order.items?.map((item: any) => (
                  <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                    <Avatar src={item.product?.images?.[0]?.url || item.image} variant="rounded"
                      sx={{ width: 64, height: 80, bgcolor: '#f5f5f5' }} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600}>{item.name || item.product?.name}</Typography>
                      {/* Size and colour are snapshotted on the line; the variant
                          is only a fallback for orders placed before that. */}
                      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                        {(item.size || item.variant?.size) && (
                          <Chip size="small" label={`Size ${item.size || item.variant?.size}`}
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                        )}
                        {(item.color || item.variant?.color) && (
                          <Chip size="small" variant="outlined" label={item.color || item.variant?.color}
                            sx={{ height: 20, fontSize: '0.65rem' }} />
                        )}
                        {(item.sku || item.variant?.sku) && (
                          <Chip size="small" variant="outlined" label={item.sku || item.variant?.sku}
                            sx={{ height: 20, fontSize: '0.65rem', fontFamily: 'monospace' }} />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700}>{formatPrice(item.price * item.quantity)}</Typography>
                  </Box>
                ))}
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                  <Typography variant="body2">{formatPrice(order.subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Shipping{order.shippingMethod ? ` (${order.shippingMethod})` : ''}
                  </Typography>
                  <Typography variant="body2">
                    {Number(order.shippingCharge) === 0 ? 'Free' : formatPrice(order.shippingCharge)}
                  </Typography>
                </Box>
                {Number(order.discount) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      Discount{order.couponCode ? ` (${order.couponCode})` : ''}
                    </Typography>
                    <Typography variant="body2" color="success.main">-{formatPrice(order.discount)}</Typography>
                  </Box>
                )}
                {Number(order.taxAmount) > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Includes GST</Typography>
                    <Typography variant="caption" color="text.secondary">{formatPrice(order.taxAmount)}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 0.5 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" fontWeight={800}>Total</Typography>
                  <Typography variant="body2" fontWeight={800}>{formatPrice(order.total)}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Delivery confirmation — only for parcels we carry ourselves */}
          <DeliveryOtpCard
            orderId={id}
            order={order}
            onDelivered={(updated) => {
              setOrder((o: any) => ({ ...o, ...updated }));
              setNewStatus('DELIVERED');
              if (updated?.codCollected != null) setCodCollected(String(updated.codCollected));
            }}
          />

          {/* Delivery method */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Delivery Method</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Set automatically from the pincode. Change it here when this order is an exception.
              </Typography>

              <ToggleButtonGroup
                exclusive
                fullWidth
                value={fulfilment}
                onChange={(_, v) => v && setFulfilment(v)}
                sx={{ mb: 2.5 }}
              >
                <ToggleButton value="DELHIVERY" sx={{ py: 1.25, gap: 1, textTransform: 'none', fontWeight: 700 }}>
                  <LocalShipping sx={{ fontSize: 18 }} /> Delhivery
                </ToggleButton>
                <ToggleButton value="SELF" sx={{ py: 1.25, gap: 1, textTransform: 'none', fontWeight: 700 }}>
                  <DirectionsBike sx={{ fontSize: 18 }} /> Self delivery
                </ToggleButton>
              </ToggleButtonGroup>

              {fulfilment === 'SELF' ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Delivered by" size="small" fullWidth required
                      value={partnerName} onChange={e => setPartnerName(e.target.value)}
                      placeholder="Name of the person taking it" />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField label="Their phone" size="small" fullWidth
                      value={partnerPhone} onChange={e => setPartnerPhone(e.target.value)} />
                  </Grid>
                  {order.paymentMethod === 'COD' && (
                    <Grid item xs={12} sm={6}>
                      <TextField label="Cash collected" size="small" fullWidth type="number"
                        value={codCollected} onChange={e => setCodCollected(e.target.value)}
                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        helperText="Fill this in once the money is in hand" />
                    </Grid>
                  )}
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField label="Delhivery waybill number" size="small" fullWidth
                      value={waybill} onChange={e => setWaybill(e.target.value)}
                      placeholder="Paste it from the Delhivery panel"
                      helperText="The customer sees this as their tracking number" />
                  </Grid>
                </Grid>
              )}

              <TextField label="Delivery notes" size="small" fullWidth multiline rows={2} sx={{ mt: 2 }}
                value={deliveryNotes} onChange={e => setDeliveryNotes(e.target.value)}
                placeholder="Landmark, best time to call, gate code — anything the person delivering needs" />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                <Button variant="contained" size="small" startIcon={<Save sx={{ fontSize: 16 }} />}
                  onClick={saveFulfilment} disabled={savingFulfilment}
                  sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
                  {savingFulfilment ? 'Saving…' : 'Save delivery method'}
                </Button>
                {order.dispatchedAt && (
                  <Typography variant="caption" color="text.secondary">
                    Dispatched {formatDate(order.dispatchedAt)}
                  </Typography>
                )}
              </Box>

              {fulfilment === 'DELHIVERY' && (
                <Alert severity="info" sx={{ mt: 2, py: 0.5 }}>
                  Delhivery is not connected to this panel yet — create the shipment in the Delhivery
                  dashboard and paste the waybill number here.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700}>Shipping Address</Typography>
                {addr && (
                  <Tooltip title="Copy address">
                    <IconButton size="small" sx={{ ml: 'auto' }}
                      onClick={() => {
                        navigator.clipboard.writeText(formatAddressBlock(addr))
                          .then(() => toast.success('Address copied'))
                          .catch(() => toast.error('Could not copy'));
                      }}>
                      <ContentCopy sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>

              {addr ? (
                <Box>
                  <Typography variant="body2" fontWeight={600}>{addr.name || '—'}</Typography>
                  <Typography variant="body2" color="text.secondary">{addr.line1}</Typography>
                  {addr.line2 && <Typography variant="body2" color="text.secondary">{addr.line2}</Typography>}
                  <Typography variant="body2" color="text.secondary">
                    {addr.city}, {addr.state} — {addr.pincode}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">{addr.country}</Typography>
                  {addr.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1 }}>
                      <Phone sx={{ fontSize: 15, color: 'text.secondary' }} />
                      <Typography variant="body2" component="a" href={`tel:${addr.phone}`}
                        sx={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>
                        {addr.phone}
                      </Typography>
                    </Box>
                  )}
                  {addr.fromSavedAddress && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
                      Taken from the customer&apos;s saved address — this order predates the checkout fix,
                      so it has no address snapshot of its own.
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="error.main">
                  No delivery address was recorded for this order. Contact the customer before dispatch.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Customer</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar src={order.user?.avatar} sx={{ width: 40, height: 40 }}>
                  {order.user?.firstName?.[0]}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {[order.user?.firstName, order.user?.lastName].filter(Boolean).join(' ') || '—'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{order.user?.email}</Typography>
                </Box>
              </Box>
              <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                {(order.user?.phone || addr?.phone) && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Phone sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <Typography variant="caption" component="a" href={`tel:${order.user?.phone || addr?.phone}`}
                      sx={{ color: '#1a1a1a', fontWeight: 600, textDecoration: 'none' }}>
                      {order.user?.phone || addr?.phone}
                    </Typography>
                  </Box>
                )}
                {order.user?.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                    <Email sx={{ fontSize: 15, color: 'text.secondary' }} />
                    <Typography variant="caption" component="a" href={`mailto:${order.user.email}`} noWrap
                      sx={{ color: '#1a1a1a', textDecoration: 'none' }}>
                      {order.user.email}
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Payment</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Method</Typography>
                  <Typography variant="caption" fontWeight={600}>{order.paymentMethod}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="caption" color="text.secondary">Status</Typography>
                  <Chip label={order.paymentStatus} size="small"
                    color={order.paymentStatus === 'PAID' ? 'success' : 'warning'}
                    sx={{ height: 18, fontSize: '0.6rem' }} />
                </Box>
                {(order.payment?.razorpayPaymentId || order.payment?.cashfreePaymentId) && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">Payment ID</Typography>
                    <Typography variant="caption" fontFamily="monospace" noWrap>
                      {order.payment.razorpayPaymentId || order.payment.cashfreePaymentId}
                    </Typography>
                  </Box>
                )}
                {order.paymentMethod === 'COD' && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Delivery charge</Typography>
                    <Typography variant="caption" fontWeight={700}
                      color={order.deliveryChargePaid ? 'success.main' : 'warning.main'}>
                      {order.deliveryChargePaid ? 'Paid online' : 'Not paid'}
                    </Typography>
                  </Box>
                )}
                {order.paymentMethod === 'COD' && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">Collect on delivery</Typography>
                    <Typography variant="caption" fontWeight={800}>
                      {formatPrice(Number(order.total) - (order.deliveryChargePaid ? Number(order.shippingCharge) : 0))}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>

          {order.trackingNumber && (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>Tracking</Typography>
                <Typography variant="body2" fontFamily="monospace" fontWeight={600}>{order.trackingNumber}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Status update dialog */}
      <Dialog open={statusDialog} onClose={() => setStatusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Update Order Status</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField select label="Status" size="small" fullWidth value={newStatus}
            onChange={e => setNewStatus(e.target.value)}>
            {STATUS_OPTIONS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField label="Tracking Number (optional)" size="small" fullWidth
            value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} />

          {/* Closing a self-delivery without the customer's code is possible,
              but it has to be a deliberate, explained act. */}
          {newStatus === 'DELIVERED'
            && order?.fulfilmentType === 'SELF'
            && !order?.deliveryOtpVerifiedAt && (
            <>
              <Alert severity="warning" sx={{ py: 0.5 }}>
                No delivery code has been confirmed for this order. Use the Delivery
                Confirmation card instead — it is the proof the parcel was handed over.
              </Alert>
              <TextField label="Reason for closing it without a code" size="small" fullWidth
                multiline rows={2} value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="e.g. customer has no email, confirmed on call with the rider"
                helperText="Saved on the order. Only a full admin can do this." />
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setStatusDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={updateStatus} disabled={updating}
            sx={{ bgcolor: '#1a1a1a', '&:hover': { bgcolor: '#333' } }}>
            {updating ? 'Updating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
