'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { couponApi } from '../services/api.service';
import { useCart } from './useCart';
import { useCountry } from '../contexts/CountryContext';

/**
 * The shopper's coupon, shared by the cart page and checkout.
 *
 * Only the CODE is kept (localStorage `wv_coupon`, so it survives cart ->
 * checkout and a reload). Every figure shown — discount, subtotal, delivery,
 * total — comes from the server's preview of the shopper's own cart
 * (`POST /coupons/validate`), which runs the same pricing engine that creates
 * the order. The URL no longer carries a `discount=` value. Decision 0035.
 */

const KEY = 'wv_coupon';

export interface CouponPreview {
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING';
  description: string | null;
  discount: number;
  freeShipping: boolean;
  shippingWaived: number;
  needsLogin: boolean;
  subtotal: number;
  shippingCharge: number;
  total: number;
  currency: string;
  currencySymbol: string;
}

const read = (): string | null => {
  try { return localStorage.getItem(KEY); } catch { return null; }
};
const write = (code: string | null) => {
  try { code ? localStorage.setItem(KEY, code) : localStorage.removeItem(KEY); } catch { /* private mode */ }
};

export const clearStoredCoupon = () => write(null);

const messageOf = (e: any) =>
  e?.response?.data?.message || 'That coupon could not be applied. Please try again.';

export function useCoupon(shippingMethod: string = 'STANDARD') {
  const { cart } = useCart();
  const { country, countries } = useCountry();
  // POST /orders and the preview both hard-fail on a code they cannot resolve,
  // so only forward a market the context has confirmed against GET /countries.
  const market = country && countries.some((c) => c.code === country) ? country : null;

  const [code, setCode] = useState<string | null>(null);
  const [preview, setPreview] = useState<CouponPreview | null>(null);
  const [applying, setApplying] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Bumps on each successful user-initiated apply, to replay the success animation. */
  const [appliedTick, setAppliedTick] = useState(0);
  const seq = useRef(0);

  const signature = [
    ...(cart?.items ?? []).map((i) => `${i.productId}:${i.variantId ?? ''}:${i.quantity}`),
    ...(cart?.combos ?? []).map((c) => `combo:${c.comboId}:${c.quantity}`),
  ].join('|');
  const hasItems = !!(cart?.items?.length || cart?.combos?.length);

  const run = useCallback(
    async (candidate: string): Promise<CouponPreview> => {
      const { data } = await couponApi.preview(candidate, { country: market, shippingMethod });
      const d = (data as any).data;
      return {
        code: d.coupon.code, type: d.coupon.type, description: d.coupon.description ?? null,
        discount: Number(d.discountAmount) || 0,
        freeShipping: !!d.freeShipping, shippingWaived: Number(d.shippingWaived) || 0,
        needsLogin: !!d.needsLogin,
        subtotal: Number(d.subtotal), shippingCharge: Number(d.shippingCharge), total: Number(d.total),
        currency: d.currency, currencySymbol: d.currencySymbol,
      };
    },
    [market, shippingMethod],
  );

  // Restore a remembered code once.
  useEffect(() => { setCode(read()); }, []);

  // Re-check against the server whenever anything that affects the maths moves:
  // the cart's contents, the market, or the delivery method.
  useEffect(() => {
    if (!code || !hasItems) { if (!code) setPreview(null); return; }
    const mine = ++seq.current;
    setChecking(true);
    run(code)
      .then((p) => { if (mine === seq.current) { setPreview(p); setError(null); } })
      .catch((e) => {
        if (mine !== seq.current) return;
        // The coupon stopped qualifying (item removed, expired, limit hit, market changed):
        // take it off and say exactly why, rather than leaving a stale discount up.
        setError(`${code} was removed: ${messageOf(e)}`);
        setPreview(null); setCode(null); write(null);
      })
      .finally(() => { if (mine === seq.current) setChecking(false); });
  }, [code, signature, hasItems, run]);

  const apply = useCallback(async (raw: string): Promise<boolean> => {
    const candidate = raw.trim().toUpperCase();
    if (!candidate) { setError('Enter a coupon code.'); return false; }
    if (!hasItems) { setError('Add something to your bag first.'); return false; }
    setApplying(true); setError(null);
    const mine = ++seq.current;
    try {
      const p = await run(candidate);
      if (mine !== seq.current) return false;
      setPreview(p); setCode(p.code); write(p.code);
      setAppliedTick((t) => t + 1);
      return true;
    } catch (e) {
      if (mine === seq.current) setError(messageOf(e));
      return false;
    } finally {
      setApplying(false);
    }
  }, [hasItems, run]);

  const remove = useCallback(() => {
    seq.current++;
    setCode(null); setPreview(null); setError(null); write(null);
  }, []);

  /** The order was refused over the coupon: drop it and show the server's reason. */
  const dropWithError = useCallback((message: string) => {
    seq.current++;
    setCode(null); setPreview(null); write(null); setError(message);
  }, []);

  return {
    dropWithError,
    /** The applied code, null when none. */
    code, preview, applying, checking, error, appliedTick,
    apply, remove, clearError: () => setError(null),
    /** Goods discount (0 when none / free-shipping type). */
    discount: preview?.discount ?? 0,
    freeShipping: !!preview?.freeShipping,
  };
}

export interface Offer { code: string; description: string | null; summary: string; expiresAt: string | null; firstOrderOnly: boolean }

/** Public codes worth advertising in the shopper's market (e.g. WELCOME10). */
export function useCouponOffers() {
  const { country, countries } = useCountry();
  const market = country && countries.some((c) => c.code === country) ? country : null;
  const [offers, setOffers] = useState<Offer[]>([]);
  useEffect(() => {
    let live = true;
    couponApi.offers(market).then(({ data }) => { if (live) setOffers((data as any).data ?? []); }).catch(() => {});
    return () => { live = false; };
  }, [market]);
  return offers;
}
