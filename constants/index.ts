export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Unique Dressup';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const API_URL = "https://api.theuniquedressup.com/api/v1";
// export const API_URL = 'http://localhost:5000/api/v1';
export const CURRENCY = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY || 'INR';
export const CURRENCY_SYMBOL = process.env.NEXT_PUBLIC_DEFAULT_CURRENCY_SYMBOL || '₹';

export const GENDERS = [
  { value: 'MEN', label: 'Men' },
  { value: 'WOMEN', label: 'Women' },
  { value: 'UNISEX', label: 'Unisex' },
];

export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'Free Size'];
export const PRODUCT_COLORS = ['Black', 'White', 'Navy', 'Grey', 'Beige', 'Brown', 'Green', 'Blue', 'Red', 'Pink', 'Yellow', 'Orange', 'Purple'];

export const SORT_OPTIONS = [
  // Curated order: the admin's per-product display priority, highest first,
  // falling back to newest among products of equal priority. Default so that
  // setting a priority in admin actually changes what shoppers see.
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest First' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name A-Z' },
];

export const ORDER_STATUSES = {
  PENDING: { label: 'Pending', color: 'warning' as const },
  CONFIRMED: { label: 'Confirmed', color: 'info' as const },
  PROCESSING: { label: 'Processing', color: 'info' as const },
  SHIPPED: { label: 'Shipped', color: 'primary' as const },
  OUT_FOR_DELIVERY: { label: 'Out for Delivery', color: 'primary' as const },
  DELIVERED: { label: 'Delivered', color: 'success' as const },
  CANCELLED: { label: 'Cancelled', color: 'error' as const },
  RETURNED: { label: 'Returned', color: 'default' as const },
  REFUNDED: { label: 'Refunded', color: 'default' as const },
};




export const PAYMENT_METHODS = [
  { value: 'COD', label: 'Cash on Delivery' },
  { value: 'RAZORPAY', label: 'Pay Online (Cards, UPI, Net Banking)' },
];

export const SHIPPING_METHODS = [
  {
    id: 'STANDARD',
    label: 'Standard',
    description: '📦 Enjoy discounted shipping on all eligible purchases',
    charge: 79,
    days: '5–7 business days',
    payOnline: true,
  },
  {
    id: 'COD',
    label: 'COD',
    description: 'Avoid the COD convenience fee by paying online',
    charge: 149,
    days: '5–7 business days',
    payOnline: false,
  },
  {
    id: 'EXPRESS',
    label: 'Express',
    description: '🚀 Experience fast delivery with our Express Shipping',
    charge: 249,
    days: '1–2 business days',
    payOnline: true,
  },
] as const;

export type ShippingMethodId = typeof SHIPPING_METHODS[number]['id'];

// Legacy — kept so any other references don't break
export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_CHARGE = 79;

export const ITEMS_PER_PAGE = 20;
export const ADMIN_ITEMS_PER_PAGE = 20;
