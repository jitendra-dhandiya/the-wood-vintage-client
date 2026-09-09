import { CURRENCY_SYMBOL } from '../constants';

/**
 * `symbol` is optional and defaults to the app-wide `CURRENCY_SYMBOL` — every
 * existing call site (most of the admin panel, order history, etc., which
 * show already-resolved historical/admin data and are out of scope for the
 * country-pricing work) keeps behaving exactly as before. Storefront call
 * sites that display live, country-aware pricing (ProductCard,
 * ProductDetailClient, cart, checkout) pass `useCountry().currencySymbol`
 * explicitly instead.
 */
export const formatPrice = (
  price: number | string | null | undefined,
  symbol: string = CURRENCY_SYMBOL,
): string => {
  if (price === null || price === undefined) return '';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return `${symbol}${num.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

export const getDiscountPercent = (basePrice: number, salePrice: number): number => {
  if (!salePrice || salePrice >= basePrice) return 0;
  return Math.round(((basePrice - salePrice) / basePrice) * 100);
};

export const formatDate = (date: string | Date): string => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date): string => {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
};

export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
};

export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};
