import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { API_URL } from '../constants';
console.log("🚀 ~ API_URL:", API_URL)

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    const sessionId = localStorage.getItem('sessionId') || (() => {
      const id = crypto.randomUUID();
      localStorage.setItem('sessionId', id);
      return id;
    })();

    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers['x-session-id'] = sessionId;
  }
  return config;
});

// Prevent concurrent refresh attempts — queue requests while refreshing
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

const processQueue = (token: string) => {
  refreshQueue.forEach(resolve => resolve(token));
  refreshQueue = [];
};

// Deduplicate toasts so the same error message doesn't stack
const shownToasts = new Set<string>();
function showErrorToast(message: string) {
  if (shownToasts.has(message)) return;
  shownToasts.add(message);
  toast.error(message, {
    onClose: () => shownToasts.delete(message),
  } as any);
  setTimeout(() => shownToasts.delete(message), 5000);
}

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as any;
    const status = error.response?.status;

    // ── 401: attempt silent token refresh ─────────────────────
    if (status === 401 && !original?._retry) {
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const newAccess = data.data.accessToken;
        const newRefresh = data.data.refreshToken;

        localStorage.setItem('accessToken', newAccess);
        localStorage.setItem('refreshToken', newRefresh);
        original.headers.Authorization = `Bearer ${newAccess}`;
        processQueue(newAccess);

        return api(original);
      } catch {
        refreshQueue = [];
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          // Fire event — LoginModal listens and opens itself
          window.dispatchEvent(new CustomEvent('auth:required'));
        }
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    // ── 429: rate limited ──────────────────────────────────────
    if (status === 429) {
      const retryAfter = error.response?.headers?.['retry-after'];
      const wait = retryAfter ? ` Please wait ${retryAfter}s.` : ' Please slow down.';
      showErrorToast(`Too many requests.${wait}`);
      return Promise.reject(error);
    }

    // ── 5xx: server errors ─────────────────────────────────────
    if (status && status >= 500) {
      const serverMsg = (error.response?.data as any)?.message;
      showErrorToast(serverMsg || 'Server error. Please try again later.');
      return Promise.reject(error);
    }

    // ── Network / timeout — no response at all ─────────────────
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        showErrorToast('Request timed out. Check your connection.');
      } else {
        showErrorToast('Cannot reach the server. Check your connection.');
      }
      return Promise.reject(error);
    }

    // All other errors (400, 403, 404, etc.) are left for the
    // calling component to handle with its own try/catch.
    return Promise.reject(error);
  }
);

export default api;
