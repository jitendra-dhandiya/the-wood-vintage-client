import api from '../lib/axios';
import type { Product, Category, Cart, Order, Blog, Review, Banner, HomepageSection, LoginResponse, User, Address, Material, Style, Room, Artisan, Country, CountryShippingRule } from '../types';

// ─── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ data: LoginResponse }>('/auth/login', { email, password }),
  googleLogin: (token: string) =>
    api.post<{ data: LoginResponse }>('/auth/google', { token }),
  // Passwordless. requestOtp both starts a sign-in and starts a sign-up; the
  // server decides which, and verifyOtp is what actually issues tokens.
  requestOtp: (data: { email: string; firstName?: string; lastName?: string; phone?: string }) =>
    api.post<{ data: { isNewUser: boolean; expiresAt: string; resendAvailableAt: string } }>(
      '/auth/otp/request', data,
    ),
  verifyOtp: (email: string, otp: string) =>
    api.post<{ data: LoginResponse }>('/auth/otp/verify', { email, otp }),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    api.post<{ data: { accessToken: string; refreshToken: string } }>('/auth/refresh', { refreshToken }),
  me: () => api.get<{ data: User }>('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { currentPassword, newPassword }),
};

// ─── Products ─────────────────────────────────────────────────
export const productApi = {
  /**
   * `params.country` (ISO alpha-2) resolves country-specific pricing on the
   * backend when a `ProductCountryPricing` override exists for it, else falls
   * back to base pricing — same call, no separate endpoint. Omitting it is
   * unchanged from before this existed.
   *
   * `params.materialSlug` / `styleSlug` / `roomSlug` filter by the Phase 2
   * handicraft taxonomy (see `materialApi`/`styleApi`/`roomApi` below) — same
   * call, no separate endpoint, same as every other filter here.
   */
  getAll: (params?: Record<string, unknown>) => api.get('/products', { params }),
  /**
   * Admin catalogue listing. `/products` is the storefront endpoint and hides
   * anything inactive, so an admin screen using it cannot see — or re-publish —
   * a deactivated or newly imported draft product.
   */
  getAllAdmin: (params?: Record<string, unknown>) => api.get('/products/admin/list', { params }),
  /**
   * The filtered catalogue as an .xlsx. Takes the same params as getAllAdmin,
   * so the file matches the screen. responseType blob or axios will parse the
   * binary as text and corrupt it.
   */
  exportAdmin: (params?: Record<string, unknown>) =>
    api.get('/products/admin/export', { params, responseType: 'blob' }),
  getById: (id: string) => api.get(`/products/admin/${id}`),
  getBySlug: (slug: string, country?: string | null) =>
    api.get<{ data: Product }>(`/products/${slug}`, { params: country ? { country } : undefined }),
  getFeatured: (opts?: { limit?: number; gender?: string | null; country?: string | null }) =>
    api.get<{ data: Product[] }>('/products/featured', { params: { limit: opts?.limit ?? 8, ...(opts?.gender ? { gender: opts.gender } : {}), ...(opts?.country ? { country: opts.country } : {}) } }),
  getTrending: (opts?: { limit?: number; gender?: string | null; country?: string | null }) =>
    api.get<{ data: Product[] }>('/products/trending', { params: { limit: opts?.limit ?? 8, ...(opts?.gender ? { gender: opts.gender } : {}), ...(opts?.country ? { country: opts.country } : {}) } }),
  getNewArrivals: (opts?: { limit?: number; gender?: string | null; country?: string | null }) =>
    api.get<{ data: Product[] }>('/products/new-arrivals', { params: { limit: opts?.limit ?? 8, ...(opts?.gender ? { gender: opts.gender } : {}), ...(opts?.country ? { country: opts.country } : {}) } }),
  getBestSellers: (opts?: { limit?: number; gender?: string | null; country?: string | null }) =>
    api.get<{ data: Product[] }>('/products/best-sellers', { params: { limit: opts?.limit ?? 8, ...(opts?.gender ? { gender: opts.gender } : {}), ...(opts?.country ? { country: opts.country } : {}) } }),
  search: (params: Record<string, unknown>) => api.get('/products/search', { params }),
  create: (data: FormData) => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/products/${id}`),
  /** Per-country selling state (all countries) — decision 0032. */
  getCountries: (id: string) => api.get(`/products/${id}/countries`),
  /** Atomic replace of the country selection + per-country prices. */
  setCountries: (id: string, countries: object[]) => api.put(`/products/${id}/countries`, { countries }),
  /** Bulk: make products available in exactly these (enabled) countries. */
  bulkSetCountries: (productIds: string[], countryIds: string[]) =>
    api.put('/products/countries/bulk', { productIds, countryIds }),
  /** Bulk display-priority update. Higher sortOrder shows first. */
  updatePositions: (items: { id: string; sortOrder: number }[]) =>
    api.patch('/products/positions', { items }),
};

// ─── Variants ─────────────────────────────────────────────────
export const variantApi = {
  getAll: (productId: string) => api.get(`/products/${productId}/variants`),
  create: (productId: string, data: object) => api.post(`/products/${productId}/variants`, data),
  update: (productId: string, variantId: string, data: object) =>
    api.put(`/products/${productId}/variants/${variantId}`, data),
  delete: (productId: string, variantId: string) =>
    api.delete(`/products/${productId}/variants/${variantId}`),
};

// ─── Categories ───────────────────────────────────────────────
export const categoryApi = {
  getAll:      (params?: Record<string, unknown>) => api.get<{ data: Category[] }>('/categories', { params }),
  getFeatured: () => api.get<{ data: Category[] }>('/categories/featured'),
  getNavMenu:       () => api.get('/categories/nav-menu'),
  getParents:       () => api.get('/categories/parents'),
  getHomeCategories: (gender?: string) => api.get('/categories/home', { params: gender && gender !== 'ALL' ? { gender } : {} }),
  getBySlug:   (slug: string) => api.get<{ data: Category }>(`/categories/${slug}`),
  create:      (data: FormData) => api.post('/categories', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:      (id: string, data: FormData) => api.put(`/categories/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:      (id: string) => api.delete(`/categories/${id}`),
  /** Bulk menu positions. Lower shows first in the nav. */
  updatePositions: (items: { id: string; sortOrder: number }[]) =>
    api.patch('/categories/positions', { items }),
};

// ─── Handicraft taxonomy (Phase 2) ─────────────────────────────
// Material/Style/Room are shaped identically to Category (name, slug,
// description, image, sortOrder, isActive) and admin CRUD takes plain JSON,
// not multipart — the backend model has no file upload, `image` is just a
// string URL field. See documentation/docs/architecture/phase-2-handicraft-domain-spec.md.
export const materialApi = {
  getAll: (params?: Record<string, unknown>) => api.get<{ data: Material[] }>('/materials', { params }),
  getBySlug: (slug: string) => api.get<{ data: Material }>(`/materials/${slug}`),
  getAllAdmin: () => api.get<{ data: Material[] }>('/materials/admin/all'),
  create: (data: object) => api.post('/materials', data),
  update: (id: string, data: object) => api.put(`/materials/${id}`, data),
  delete: (id: string) => api.delete(`/materials/${id}`),
};

export const styleApi = {
  getAll: (params?: Record<string, unknown>) => api.get<{ data: Style[] }>('/styles', { params }),
  getBySlug: (slug: string) => api.get<{ data: Style }>(`/styles/${slug}`),
  getAllAdmin: () => api.get<{ data: Style[] }>('/styles/admin/all'),
  create: (data: object) => api.post('/styles', data),
  update: (id: string, data: object) => api.put(`/styles/${id}`, data),
  delete: (id: string) => api.delete(`/styles/${id}`),
};

export const roomApi = {
  getAll: (params?: Record<string, unknown>) => api.get<{ data: Room[] }>('/rooms', { params }),
  getBySlug: (slug: string) => api.get<{ data: Room }>(`/rooms/${slug}`),
  getAllAdmin: () => api.get<{ data: Room[] }>('/rooms/admin/all'),
  create: (data: object) => api.post('/rooms', data),
  update: (id: string, data: object) => api.put(`/rooms/${id}`, data),
  delete: (id: string) => api.delete(`/rooms/${id}`),
};

// Artisan has no slug. `getAll` is the public directory (Phase 4 §4) — every
// active artisan; `getById` is the bio page for a known id; `getAllAdmin` is
// full admin CRUD (active or not).
export const artisanApi = {
  getAll: () => api.get<{ data: Artisan[] }>('/artisans'),
  getById: (id: string) => api.get<{ data: Artisan }>(`/artisans/${id}`),
  getAllAdmin: () => api.get<{ data: Artisan[] }>('/artisans/admin/all'),
  create: (data: object) => api.post('/artisans', data),
  update: (id: string, data: object) => api.put(`/artisans/${id}`, data),
  delete: (id: string) => api.delete(`/artisans/${id}`),
};

// ─── Countries ────────────────────────────────────────────────
// `CountryContext` already calls `GET /countries` directly via `fetch` (it
// needs to work the same on the server-rendered seed as the client refetch),
// so this client is for the admin screen only: the `/admin/all` list (every
// seeded market, not just enabled ones) plus create/update/delete. There is
// no dedicated `getById` — the admin screen edits from the row it already has
// from `getAllAdmin`.
export const countryApi = {
  getAll: () => api.get<{ data: Country[] }>('/countries'),
  getAllAdmin: () => api.get<{ data: Country[] }>('/countries/admin/all'),
  create: (data: object) => api.post('/countries', data),
  update: (id: string, data: object) => api.put(`/countries/${id}`, data),
  delete: (id: string) => api.delete(`/countries/${id}`),
};

// Nested under a country — one rule per shipping method
// (STANDARD/COD/EXPRESS) per country, Phase 3. See
// documentation/docs/architecture/phase-3-country-shipping-and-admin-spec.md.
export const countryShippingRuleApi = {
  getAll: (countryId: string) =>
    api.get<{ data: CountryShippingRule[] }>(`/countries/${countryId}/shipping-rules`),
  create: (countryId: string, data: object) =>
    api.post(`/countries/${countryId}/shipping-rules`, data),
  update: (countryId: string, id: string, data: object) =>
    api.put(`/countries/${countryId}/shipping-rules/${id}`, data),
  delete: (countryId: string, id: string) =>
    api.delete(`/countries/${countryId}/shipping-rules/${id}`),
};

// ─── Cart ─────────────────────────────────────────────────────
export const cartApi = {
  get: (country?: string | null) => api.get<{ data: Cart }>('/cart', { params: country ? { country } : undefined }),
  addCombo: (comboId: string, quantity = 1, country?: string | null) =>
    api.post('/cart/combo/add', { comboId, quantity, country: country || undefined }),
  updateCombo: (id: string, quantity: number, country?: string | null) =>
    api.put(`/cart/combo/${id}`, { quantity, country: country || undefined }),
  removeCombo: (id: string) => api.delete(`/cart/combo/${id}`),
  addItem: (productId: string, variantId?: string, quantity = 1) =>
    api.post('/cart/add', { productId, variantId, quantity }),
  updateItem: (itemId: string, quantity: number) =>
    api.put(`/cart/item/${itemId}`, { quantity }),
  removeItem: (itemId: string) => api.delete(`/cart/item/${itemId}`),
  clear: () => api.delete('/cart/clear'),
};

// ─── Orders ───────────────────────────────────────────────────
export const orderApi = {
  create: (data: object) => api.post<{ data: Order }>('/orders', data),
  getMyOrders: (page = 1, limit = 10) =>
    api.get('/orders/my', { params: { page, limit } }),
  getById: (id: string) => api.get<{ data: Order }>(`/orders/${id}`),
  track: (orderNumber: string) => api.get(`/orders/track/${orderNumber}`),
  cancel: (id: string, reason?: string) =>
    api.post(`/orders/${id}/cancel`, { reason }),
  cancelOrder: (id: string) => api.post(`/orders/${id}/cancel`),
  // Admin
  getByIdAdmin: (id: string) => api.get<{ data: Order }>(`/orders/admin/${id}`),
  getAll: (params?: Record<string, unknown>) => api.get('/orders', { params }),
  updateStatus: (id: string, data: object) => api.put(`/orders/${id}/status`, data),
  updateFulfilment: (id: string, data: object) => api.put(`/orders/${id}/fulfilment`, data),
  // Delivery OTP. The code is never in any of these responses — the office
  // gets it from the customer, over the phone.
  getDeliveryOtp: (id: string) => api.get(`/orders/${id}/delivery-otp`),
  sendDeliveryOtp: (id: string) => api.post(`/orders/${id}/delivery-otp/send`),
  verifyDeliveryOtp: (id: string, data: { otp: string; codCollected?: number | null }) =>
    api.post(`/orders/${id}/delivery-otp/verify`, data),
};

// ─── Payments ─────────────────────────────────────────────────
export const paymentApi = {
  // Razorpay
  createRazorpayOrder: (orderId: string) =>
    api.post('/payments/razorpay/create', { orderId }),
  verifyPayment: (data: object) =>
    api.post('/payments/razorpay/verify', data),
  // Cashfree
  createCashfreeOrder: (orderId: string) =>
    api.post('/payments/cashfree/create', { orderId }),
  createCashfreeCodDeposit: (orderId: string) =>
    api.post('/payments/cashfree/cod-deposit', { orderId }),
  getCashfreePaymentStatus: (orderId: string) =>
    api.get(`/payments/cashfree/status/${orderId}`),
};

// ─── Wishlist ─────────────────────────────────────────────────
export const wishlistApi = {
  get: () => api.get('/wishlist'),
  getMyWishlist: () => api.get('/wishlist'),
  toggle: (productId: string) => api.post('/wishlist/toggle', { productId }),
  remove: (productId: string) => api.delete(`/wishlist/${productId}`),
  check: (productId: string) => api.get(`/wishlist/check/${productId}`),
};

// ─── Returns ──────────────────────────────────────────────────
// Customers can read their own; only the office can record or change one,
// because returns are raised on Instagram per the published policy.
export const returnApi = {
  getMyReturns: () => api.get('/returns/my'),
  // Admin
  getAll: (params?: Record<string, unknown>) => api.get('/returns', { params }),
  create: (data: object) => api.post('/returns', data),
  update: (id: string, data: object) => api.put(`/returns/${id}`, data),
  remove: (id: string) => api.delete(`/returns/${id}`),
};

// ─── Users ────────────────────────────────────────────────────
export const userApi = {
  updateProfile: (data: FormData) =>
    api.put('/users/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAddresses: () => api.get<{ data: Address[] }>('/users/addresses'),
  addAddress: (data: Partial<Address>) => api.post('/users/addresses', data),
  updateAddress: (id: string, data: Partial<Address>) =>
    api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
  getRecentlyViewed: () => api.get('/users/recently-viewed'),
  addRecentlyViewed: (productId: string) =>
    api.post('/users/recently-viewed', { productId }),
  getNotifications: () => api.get('/users/notifications'),
  markNotificationsRead: () => api.put('/users/notifications/read'),
  // Admin
  getAll: (params?: Record<string, unknown>) => api.get('/users', { params }),
  update: (id: string, data: object) => api.put(`/users/${id}`, data),
  toggleStatus: (id: string) => api.put(`/users/${id}/toggle-status`),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/change-password', data),
};

// ─── Reviews ──────────────────────────────────────────────────
export const reviewApi = {
  getByProduct: (productId: string, params?: Record<string, unknown>) =>
    api.get(`/reviews/product/${productId}`, { params }),
  create: (data: { productId: string; rating: number; title?: string; body?: string }) =>
    api.post('/reviews', data),
  // Admin
  getAll: (params?: Record<string, unknown>) => api.get('/reviews', { params }),
  update: (id: string, data: object) => api.put(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
  updateStatus: (id: string, data: object) =>
    api.put(`/reviews/${id}/status`, data),
};

// ─── Banners ──────────────────────────────────────────────────
export const bannerApi = {
  getByType: (type: string, gender?: string) =>
    api.get<{ data: Banner[] }>(`/banners/type/${type}`, { params: gender ? { gender } : {} }),
  getAll: (params?: Record<string, unknown>) => api.get('/banners', { params }),
  create: (data: FormData) =>
    api.post('/banners', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData | object) => {
    const isForm = data instanceof FormData;
    return api.put(`/banners/${id}`, data, isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
  },
  delete: (id: string) => api.delete(`/banners/${id}`),
  reorder: (items: { id: string; sortOrder: number }[]) =>
    api.put('/banners/reorder', { items }),
};

// ─── Homepage ─────────────────────────────────────────────────
export const homepageApi = {
  getData: () => api.get('/homepage/data'),
  getSections: () => api.get<{ data: HomepageSection[] }>('/homepage'),
  getAllAdmin: () => api.get('/homepage/admin'),
  createSection: (data: object) => api.post('/homepage', data),
  updateSection: (id: string, data: object) => api.put(`/homepage/${id}`, data),
  deleteSection: (id: string) => api.delete(`/homepage/${id}`),
  reorder: (items: { id: string; sortOrder: number }[]) =>
    api.put('/homepage/reorder', { items }),
};

// ─── Stores ───────────────────────────────────────────────────
export const storeApi = {
  getAll: () => api.get('/stores'),
  getAllAdmin: () => api.get('/stores/admin'),
  create: (data: FormData) => api.post('/stores', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) => api.put(`/stores/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/stores/${id}`),
  reorder: (items: { id: string; sortOrder: number }[]) => api.put('/stores/reorder', { items }),
};

// ─── Blogs ────────────────────────────────────────────────────
export const blogApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/blogs', { params }),
  getBySlug: (slug: string) => api.get<{ data: Blog }>(`/blogs/${slug}`),
  getCategories: () => api.get('/blogs/categories'),
  // Admin
  getAllAdmin: (params?: Record<string, unknown>) =>
    api.get('/blogs/admin/all', { params }),
  create: (data: FormData) =>
    api.post('/blogs', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    api.put(`/blogs/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/blogs/${id}`),
};

// ─── Instagram Reels ──────────────────────────────────────────

/**
 * A reel upload sends tens of megabytes, and the global 30s client timeout is
 * sized for JSON calls. On a slow uplink a 50 MB video does not finish
 * transferring inside that window, and the browser cancels a request the server
 * is still reading — which is exactly how uploads were failing at 29.8s.
 */
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;

export const instagramReelsApi = {
  // `gender` scopes the storefront row to WOMEN/MEN reels plus the untargeted
  // ones; omitting it returns everything, which is what an unfiltered listing
  // wants.
  getActive: (gender?: string) =>
    api.get('/instagram-reels', { params: gender ? { gender } : undefined }),
  getAll: (gender?: string) =>
    api.get('/instagram-reels/admin', { params: gender ? { gender } : undefined }),
  create: (data: object) => api.post('/instagram-reels', data, { timeout: UPLOAD_TIMEOUT_MS }),
  update: (id: string, data: object) =>
    api.put(`/instagram-reels/${id}`, data, { timeout: UPLOAD_TIMEOUT_MS }),
  delete: (id: string) => api.delete(`/instagram-reels/${id}`),
  reorder: (order: { id: string; sortOrder: number }[]) => api.patch('/instagram-reels/reorder', { order }),
};

// ─── Nav menu links (Shop menu quick links) ───────────────────
export const navMenuApi = {
  getPublic: (position = 'quick_links', gender?: string) =>
    api.get('/nav-menus', { params: { position, ...(gender ? { gender } : {}) } }),
  getAll: (position = 'quick_links') => api.get('/nav-menus/admin', { params: { position } }),
  create: (data: object) => api.post('/nav-menus', data),
  update: (id: string, data: object) => api.put(`/nav-menus/${id}`, data),
  delete: (id: string) => api.delete(`/nav-menus/${id}`),
  updatePositions: (items: { id: string; sortOrder: number }[]) =>
    api.patch('/nav-menus/positions', { items }),
  importDefaults: (position = 'quick_links') =>
    api.post('/nav-menus/import-defaults', { position }),
};

// ─── Analytics ────────────────────────────────────────────────
export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getRevenue: (params?: Record<string, unknown>) =>
    api.get('/analytics/revenue', { params }),
  // Successful collections only — see the controller for why this is not the
  // same number as revenue.
  getTransactions: (params?: Record<string, unknown>) =>
    api.get('/analytics/transactions', { params }),
};

// ─── Leads (quote requests) ───────────────────────────────────
export const leadApi = {
  create: (data: object) => api.post('/leads', data),
  // Admin
  getAll: (params?: Record<string, unknown>) => api.get('/leads', { params }),
  getById: (id: string) => api.get(`/leads/${id}`),
  update: (id: string, data: object) => api.patch(`/leads/${id}`, data),
  exportCsv: (params?: Record<string, unknown>) => api.get('/leads/export', { params, responseType: 'blob' }),
  summary: (params?: Record<string, unknown>) => api.get('/analytics/leads-summary', { params }),
};

// ─── Settings ─────────────────────────────────────────────────
export const settingsApi = {
  getPublic: () => api.get('/settings/public'),
  getByGroup: (group: string) => api.get(`/settings/${group}`),
  getAll: () => api.get('/settings'),
  upsert: (data: object) => api.post('/settings', data),
  upsertBulk: (settings: { key: string; value: string }[]) =>
    api.post('/settings/bulk', { settings }),
};

// ─── SEO ──────────────────────────────────────────────────────
export const seoApi = {
  getByPage: (page: string) => api.get(`/seo/page/${page}`),
  getCmsPage: (slug: string) => api.get(`/seo/cms/${slug}`),
  upsert: (data: object) => api.post('/seo/admin/upsert', data),
  getAll: (params?: Record<string, unknown>) => api.get('/seo/admin/all', { params }),
  update: (id: string, data: object) => api.put(`/seo/admin/${id}`, data),
  getAllCms: () => api.get('/seo/admin/cms'),
  upsertCms: (data: object) => api.post('/seo/admin/cms', data),
};

// ─── Coupons ──────────────────────────────────────────────────
export const couponApi = {
  // Storefront. The server prices the requester's own cart: no amounts are sent.
  preview: (code: string, opts: { country?: string | null; shippingMethod?: string } = {}) =>
    api.post('/coupons/validate', { code, country: opts.country || undefined, shippingMethod: opts.shippingMethod }),
  offers: (country?: string | null) => api.get('/coupons/offers', { params: { country: country || undefined } }),
  // Admin
  getAll: (params?: Record<string, unknown>) => api.get('/coupons', { params }),
  getOne: (id: string) => api.get(`/coupons/${id}`),
  usages: (id: string, params?: Record<string, unknown>) => api.get(`/coupons/${id}/usages`, { params }),
  create: (data: object) => api.post('/coupons', data),
  update: (id: string, data: object) => api.put(`/coupons/${id}`, data),
  setActive: (id: string, isActive: boolean) => api.patch(`/coupons/${id}/active`, { isActive }),
  delete: (id: string) => api.delete(`/coupons/${id}`),
};

// ─── Combo offers (decision 0037) ─────────────────────────────
export const comboApi = {
  // Storefront: the server locks the market to the visitor's location.
  list: (opts: { country?: string | null; home?: boolean; productId?: string; limit?: number } = {}) =>
    api.get('/combos', { params: { country: opts.country || undefined, home: opts.home ? 'true' : undefined, productId: opts.productId, limit: opts.limit } }),
  getBySlug: (slug: string, country?: string | null) =>
    api.get(`/combos/${slug}`, { params: { country: country || undefined } }),
  // Admin (multipart when an image is attached)
  adminList: (params?: Record<string, unknown>) => api.get('/combos/admin/list', { params }),
  adminGet: (id: string) => api.get(`/combos/admin/${id}`),
  preview: (data: object) => api.post('/combos/admin/preview', data),
  create: (form: FormData) => api.post('/combos/admin', form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, form: FormData) => api.put(`/combos/admin/${id}`, form, { headers: { 'Content-Type': 'multipart/form-data' } }),
  setActive: (id: string, isActive: boolean) => api.patch(`/combos/admin/${id}/active`, { isActive }),
  duplicate: (id: string) => api.post(`/combos/admin/${id}/duplicate`),
  delete: (id: string) => api.delete(`/combos/admin/${id}`),
};

// ─── Collections ──────────────────────────────────────────────
export const collectionApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/collections', { params }),
  getBySlug: (slug: string) => api.get(`/collections/${slug}`),
  create: (data: FormData) =>
    api.post('/collections', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData | object) => {
    const isForm = data instanceof FormData;
    return api.put(`/collections/${id}`, data, isForm ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
  },
  delete: (id: string) => api.delete(`/collections/${id}`),
  getProducts: (id: string, params?: Record<string, unknown>) =>
    api.get(`/collections/${id}/products`, { params }),
  addProduct: (id: string, productId: string) =>
    api.post(`/collections/${id}/products`, { productId }),
  removeProduct: (id: string, productId: string) =>
    api.delete(`/collections/${id}/products/${productId}`),
};

// ─── Shipping / Delhivery ──────────────────────────────────────
export const shippingApi = {
  // Public
  checkServiceability: (pincode: string) =>
    api.get('/shipping/serviceability', { params: { pincode } }),
  getTracking: (waybill: string) =>
    api.get(`/shipping/track/${waybill}`),

  // Authenticated customer
  getShipmentByOrder: (orderId: string) =>
    api.get(`/shipping/order/${orderId}`),

  // Admin
  list: (params?: Record<string, unknown>) =>
    api.get('/shipping', { params }),
  createShipment: (orderId: string) =>
    api.post('/shipping/create', { orderId }),
  cancelShipment: (orderId: string) =>
    api.post('/shipping/cancel', { orderId }),
  schedulePickup: (waybills: string[], pickupDate?: string, pickupTime?: string) =>
    api.post('/shipping/pickup', { waybills, pickupDate, pickupTime }),
  getLabelUrl: (waybill: string) =>
    api.get(`/shipping/label/${waybill}`),
  getManifestUrl: (waybills: string[]) =>
    api.get('/shipping/manifest', { params: { waybills: waybills.join(',') } }),
  syncTracking: (waybill: string) =>
    api.post(`/shipping/sync/${waybill}`),
  getSettings: () =>
    api.get('/shipping/settings'),
  saveSettings: (data: object) =>
    api.post('/shipping/settings', data),
  getWebhookLogs: (params?: Record<string, unknown>) =>
    api.get('/shipping/webhook-logs', { params }),
};

// ─── Media ────────────────────────────────────────────────────
export const mediaApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/media', { params }),
  upload: (data: FormData) =>
    api.post('/media/upload', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/media/${id}`),
};
