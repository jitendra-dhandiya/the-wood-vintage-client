import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import CartDrawer from '../../components/cart/CartDrawer';
import MobileBottomNav from '../../components/layout/MobileBottomNav';
import AuthInitializer from '../../components/common/AuthInitializer';
import GenderInitializer from '../../components/common/GenderInitializer';
import LoginModal from '../../components/auth/LoginModal';
import MobileMotionConfig from '../../components/common/MobileMotionConfig';
import { API_URL } from '../../constants';
import { HEADER_BEFORE, HEADER_AFTER } from '../../lib/headerLinks';

// Strip /api/v1 to get the base server URL — works for both localhost and production
const API_BASE = API_URL.replace(/\/api\/v1\/?$/, '');

async function getPublicSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/settings/public`, { cache: 'no-store' });
    if (!res.ok) return {};
    const json = await res.json();
    return json.data || {};
  } catch {
    return {};
  }
}

async function getNavCategories() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/categories/nav-menu`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

/**
 * Quick links for the Shop menu. Every link is fetched, gender included, and
 * the client picks which apply — the layout is shared by all shoppers and the
 * gender lives in a client-side store.
 */
async function getQuickLinks() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/nav-menus?position=quick_links`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

/**
 * Header links for one position. Same shape and caching as the quick links:
 * every link is fetched, gender included, and the client picks which apply —
 * the layout is shared by all shoppers and the gender lives in a client store.
 */
async function getNavLinks(position: string) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/nav-menus?position=${encodeURIComponent(position)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, navCategories, quickLinks, headerBefore, headerAfter] = await Promise.all([
    getPublicSettings(),
    getNavCategories(),
    getQuickLinks(),
    getNavLinks(HEADER_BEFORE),
    getNavLinks(HEADER_AFTER),
  ]);

  return (
    <MobileMotionConfig>
      <AuthInitializer />
      <GenderInitializer />
      <Navbar
        settings={settings}
        navCategories={navCategories}
        quickLinks={quickLinks}
        headerBefore={headerBefore}
        headerAfter={headerAfter}
      />
      <main style={{ minHeight: '70vh' }}>{children}</main>
      <Footer settings={settings} />
      <CartDrawer />
      <MobileBottomNav />
      <LoginModal />
    </MobileMotionConfig>
  );
}
