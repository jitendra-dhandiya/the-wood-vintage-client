import { NextResponse, type NextRequest } from 'next/server';
import { legacyCategoryTarget } from './lib/legacyCategorySlugs';
import { API_URL } from './constants';

/**
 * Permanent forwarding for category slugs that have been corrected.
 *
 * This lives in middleware rather than in the page because a redirect thrown
 * from the page does not survive. Measured on a production build of this app:
 * `permanentRedirect()` runs — the branch was instrumented and confirmed to
 * fire — and the response still comes back `200 OK` with no `Location` header,
 * because by the time the page component resolves the shell has already been
 * flushed and the status can no longer be set. Next falls back to expressing
 * the redirect inside the RSC payload, which a browser follows and a crawler
 * largely does not. `notFound()` loses its status the same way, which is why
 * every missing page on this site currently answers 200.
 *
 * A redirect whose whole purpose is to move search ranking from an old URL to a
 * new one has to be a real HTTP status, so it has to happen before rendering
 * starts. Middleware is the only place that is true.
 *
 * The API is consulted first so that this cannot strand a URL that still works.
 * A config-level redirect would fire the moment it shipped, sending the old
 * slug to a 404 for however long the deploy and the rename in the admin were
 * out of step — and those are separate acts performed at separate times, in
 * either order. Asking whether the old slug still resolves removes the
 * question: while it does, nothing is forwarded; once it stops, forwarding
 * begins on its own. That costs one request, and only on the handful of paths
 * named in the map.
 */
export const config = {
  // Only these paths reach this file. Nothing else on the site is touched.
  matcher: ['/category/:slug', '/wishlist'],
};

export async function middleware(req: NextRequest) {
  // The wishlist used to live at /wishlist while every link in the site
  // chrome pointed at /account/wishlist, so the page existed and nothing
  // could reach it. It now lives with the rest of the account, and the old
  // path forwards for anyone who bookmarked it.
  //
  // Here rather than in a page for the same reason as the category rule
  // below: a redirect returned from a page comes back 200 with no Location.
  if (req.nextUrl.pathname === '/wishlist') {
    const url = req.nextUrl.clone();
    url.pathname = '/account/wishlist';
    return NextResponse.redirect(url, 301);
  }

  const slug = req.nextUrl.pathname.split('/')[2] ?? '';
  const moved = legacyCategoryTarget(slug);
  if (!moved) return NextResponse.next();

  try {
    const res = await fetch(`${API_URL}/categories/${encodeURIComponent(slug)}`, {
      cache: 'no-store',
    });
    // Still a real category under its old name — leave it alone.
    if (res.ok) return NextResponse.next();
  } catch {
    // The API being unreachable is not evidence the slug was retired. Rendering
    // the page is the safer failure: it shows an error rather than permanently
    // teaching a crawler that this URL has moved.
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = `/category/${moved}`;
  return NextResponse.redirect(url, 301);
}
