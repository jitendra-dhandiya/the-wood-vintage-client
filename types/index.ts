// ─── Country ──────────────────────────────────
// Mirrors the backend `Country` model (see
// documentation/docs/architecture/country-architecture-spec.md). `GET
// /countries` (public) returns only `isEnabled: true` rows of this shape.
export interface Country {
  id: string;
  code: string;           // ISO 3166-1 alpha-2, e.g. "IN", "AE"
  name: string;
  currency: string;       // ISO 4217, e.g. "INR"
  currencySymbol: string;
  locale: string;         // e.g. "en-IN"
  timezone: string;
  isEnabled: boolean;
  isDefault: boolean;
  sortOrder: number;
}

// Mirrors the backend `CountryShippingRule` model (Phase 3 — see
// documentation/docs/architecture/phase-3-country-shipping-and-admin-spec.md).
// One row per (countryId, method). `cost`/`freeShippingThreshold` are Prisma
// `Decimal` fields, which serialise as strings over JSON.
export interface CountryShippingRule {
  id: string;
  countryId: string;
  method: 'STANDARD' | 'COD' | 'EXPRESS';
  cost: string | number;
  freeShippingThreshold?: string | number | null;
  estimatedDaysMin?: number | null;
  estimatedDaysMax?: number | null;
  customsMessage?: string | null;
  isActive: boolean;
}

// ─── Handicraft taxonomy (Phase 2) ──────────────────────────────
// Mirror the backend `Material`/`Style`/`Room` models — shaped like
// `Category`: id, name, slug, description, image, sortOrder, isActive. Public
// `GET /materials` etc. return only `isActive: true` rows of this shape; the
// admin `/admin/all` endpoints return every row.
export interface Material {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Style {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Room {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  isActive: boolean;
  sortOrder: number;
}

// Mirrors the backend `Artisan` model. No slug. `GET /artisans` (public
// directory) and `GET /artisans/:id` (bio page) — see phase-4-experience-spec.md §4.
export interface Artisan {
  id: string;
  name: string;
  bio?: string | null;
  photo?: string | null;
  region?: string | null;
  isActive: boolean;
}

// ─── Common ──────────────────────────────────
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

// ─── User ─────────────────────────────────────
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'SUB_ADMIN' | 'CUSTOMER';
  isVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
}




export interface Address {
  id: string;
  type: 'HOME' | 'WORK' | 'OTHER';
  firstName: string;
  lastName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault: boolean;
}

// ─── Products ──────────────────────────────────
export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  /** Colour this shot is of; null means it is part of the default set. */
  color?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  size?: string;
  color?: string;
  colorHex?: string;
  price?: number;
  salePrice?: number;
  stockQuantity: number;
  sku?: string;
  image?: string;
}

export interface ProductBadge {
  id: string;
  label: string;
  color: string;
  bgColor: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  brand?: string;
  sku?: string;
  basePrice: number;
  salePrice?: number;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  fabric?: string;
  careInstructions?: string;
  sizeChart?: string;
  /** Per-product override of the flat shipping rate for that method, when set. See checkout/page.tsx. */
  standardShippingCharge?: number;
  codShippingCharge?: number;
  expressShippingCharge?: number;
  totalReviews: number;
  avgRating: number;
  totalSold: number;
  /** Display priority: higher shows first, 0 is the neutral default. */
  sortOrder?: number;
  videoUrl?: string;
  metaTitle?: string;
  metaDesc?: string;
  images: ProductImage[];
  category: { id: string; name: string; slug: string };
  variants: ProductVariant[];
  badges: ProductBadge[];
  tags?: { tag: string }[];
  faqs?: { question: string; answer: string }[];
  relatedProducts?: Product[];
  gender?: 'MEN' | 'WOMEN' | 'UNISEX';
  createdAt?: string;
  updatedAt?: string;

  // ── Handicraft domain (Phase 2) — all additive/optional. A product may
  // have none of these set; the common case today is exactly that. ──
  materialId?: string | null;
  material?: Material | null;
  styleId?: string | null;
  style?: Style | null;
  roomId?: string | null;
  room?: Room | null;
  artisanId?: string | null;
  artisan?: Artisan | null;

  /** Physical dimensions in centimetres. Only meaningful together. */
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  finish?: string | null;
  assemblyRequired?: boolean;
  assemblyInstructions?: string | null;

  isCustomizable?: boolean;
  customizationNotes?: string | null;

  /** Made-to-order lead time in days, when set. */
  manufacturingTimeDays?: number | null;

  /** Product-specific narrative — how *this* piece is made. MASTER-PROMPT §33. */
  craftStory?: string | null;
}

// ─── Cart ─────────────────────────────────────
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  product: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: string;
  items: CartItem[];
}

// ─── Orders ───────────────────────────────────
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED' | 'REFUNDED';

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: string;
  paymentMethod: string;
  subtotal: number;
  discount: number;
  shippingCharge: number;
  taxAmount: number;
  total: number;
  couponCode?: string;
  couponDiscount: number;
  couponType?: 'PERCENTAGE' | 'FIXED' | 'FREE_SHIPPING' | null;
  /** Delivery charge the coupon waived (FREE_SHIPPING). */
  couponShippingDiscount?: number;
  trackingNumber?: string;
  trackingUrl?: string;
  deliveryDate?: string;
  cancelReason?: string;
  shippingAddress: Address;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  name: string;
  image?: string;
  size?: string;
  color?: string;
  sku?: string;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
}

// ─── Categories ────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  bannerImage?: string;
  parentId?: string;
  children?: Category[];
  isFeatured: boolean;
  _count?: { products: number };
}

// ─── Banner ────────────────────────────────────
export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image: string;
  mobileImage?: string;
  link?: string;
  ctaText?: string;
  type: string;
  isActive: boolean;
  sortOrder: number;
}

// ─── Blog ──────────────────────────────────────
export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image?: string;
  authorName?: string;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  metaTitle?: string;
  metaDesc?: string;
  blogCategory?: { name: string; slug: string };
  tags?: { tag: string }[];
}

// ─── Review ────────────────────────────────────
export interface Review {
  id: string;
  rating: number;
  title?: string;
  body?: string;
  isVerified: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; avatar?: string };
}

// ─── Homepage ──────────────────────────────────
export interface HomepageSection {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  config?: Record<string, unknown>;
  isActive: boolean;
  sortOrder: number;
}

// ─── Auth ──────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
