/**
 * Admin-managed layout for the navigation menu — the mobile drawer and the
 * desktop mega panel.
 *
 * These live in the generic key/value `settings` table rather than a table of
 * their own, and in the `general` group rather than a `navigation` group,
 * deliberately: `general` is already on the whitelist that
 * `GET /settings/public` serves, so the storefront can read them without a
 * backend change or a second deploy. The `nav_` prefix keeps them legible in
 * the settings list.
 *
 * Every default below is the value the components shipped with, so an install
 * where an admin has never opened the Navigation tab renders byte-identically
 * to before this file existed.
 */

export type NavAlign = 'left' | 'center';
export type IconPlacement = 'before' | 'after' | 'hidden';

export interface NavLayout {
  mobile: {
    /** Drawer width in px. */
    drawerWidth: number;
    /** Where the labels sit within each row. */
    align: NavAlign;
    /** Position of the icon on the "View All Categories" row. */
    viewAllIcon: IconPlacement;
    /** Category thumbnail box, px. Width 0 removes the thumbnail entirely. */
    thumbWidth: number;
    thumbHeight: number;
    /** Vertical padding on a category row, in MUI spacing units (1 = 8px). */
    rowPadding: number;
  };
  desktop: {
    /** Height of the open mega panel, in vh. */
    panelHeight: number;
    /** Left sidebar column of the mega panel, px. */
    sidebarWidth: number;
    /** Show the small arrow before each quick link. */
    quickLinkIcon: boolean;
  };
}

export const NAV_LAYOUT_DEFAULTS: NavLayout = {
  mobile: {
    drawerWidth: 280,
    align: 'left',
    viewAllIcon: 'after',
    thumbWidth: 44,
    thumbHeight: 52,
    rowPadding: 1.25,
  },
  desktop: {
    panelHeight: 70,
    sidebarWidth: 220,
    quickLinkIcon: true,
  },
};

/**
 * Bounds for every numeric field.
 *
 * An admin typing into a free text box can produce a 4px drawer or a 900vh
 * panel; the storefront has no way to reject the value at render time, so the
 * range is enforced here. Ranges are generous — wide enough to be worth
 * changing, narrow enough that no value inside them breaks the layout.
 */
export const NAV_LAYOUT_RANGES = {
  drawerWidth:   { min: 240, max: 420, step: 4,    unit: 'px' },
  thumbWidth:    { min: 0,   max: 96,  step: 2,    unit: 'px' },
  thumbHeight:   { min: 24,  max: 120, step: 2,    unit: 'px' },
  rowPadding:    { min: 0.5, max: 3,   step: 0.25, unit: '×8px' },
  panelHeight:   { min: 40,  max: 90,  step: 1,    unit: 'vh' },
  sidebarWidth:  { min: 160, max: 360, step: 4,    unit: 'px' },
} as const;

export type NavRangeKey = keyof typeof NAV_LAYOUT_RANGES;

/** Every key this module reads, for the admin page's bulk save. */
export const NAV_SETTING_KEYS = [
  'nav_mobile_drawer_width',
  'nav_mobile_align',
  'nav_mobile_viewall_icon',
  'nav_mobile_thumb_width',
  'nav_mobile_thumb_height',
  'nav_mobile_row_padding',
  'nav_desktop_panel_height',
  'nav_desktop_sidebar_width',
  'nav_desktop_quicklink_icon',
] as const;

/**
 * A blank or unparseable value means "not configured" and yields the default.
 * A number that parses but sits outside the range is clamped rather than
 * discarded — an admin who types 9999 gets the widest drawer on offer, which
 * is easier to understand than the field appearing to ignore them.
 */
const num = (raw: string | undefined, key: NavRangeKey, fallback: number): number => {
  const text = (raw ?? '').trim();
  // Number('') is 0, not NaN. Without this line a site whose admin had never
  // opened the Navigation tab would resolve every number to 0 and then clamp
  // it to the minimum — a 240px drawer with no thumbnails, everywhere.
  if (text === '') return fallback;
  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return fallback;
  const { min, max } = NAV_LAYOUT_RANGES[key];
  return Math.min(max, Math.max(min, parsed));
};

const oneOf = <T extends string>(raw: string | undefined, allowed: readonly T[], fallback: T): T => {
  const v = (raw ?? '').trim().toLowerCase();
  return (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
};

const bool = (raw: string | undefined, fallback: boolean): boolean => {
  const v = (raw ?? '').trim().toLowerCase();
  if (v === 'true'  || v === '1' || v === 'show') return true;
  if (v === 'false' || v === '0' || v === 'hide') return false;
  return fallback;
};

export const resolveNavLayout = (settings?: Record<string, string> | null): NavLayout => {
  const s = settings ?? {};
  const d = NAV_LAYOUT_DEFAULTS;
  return {
    mobile: {
      drawerWidth:  num(s.nav_mobile_drawer_width, 'drawerWidth', d.mobile.drawerWidth),
      align:        oneOf(s.nav_mobile_align, ['left', 'center'] as const, d.mobile.align),
      viewAllIcon:  oneOf(s.nav_mobile_viewall_icon, ['before', 'after', 'hidden'] as const, d.mobile.viewAllIcon),
      thumbWidth:   num(s.nav_mobile_thumb_width, 'thumbWidth', d.mobile.thumbWidth),
      thumbHeight:  num(s.nav_mobile_thumb_height, 'thumbHeight', d.mobile.thumbHeight),
      rowPadding:   num(s.nav_mobile_row_padding, 'rowPadding', d.mobile.rowPadding),
    },
    desktop: {
      panelHeight:   num(s.nav_desktop_panel_height, 'panelHeight', d.desktop.panelHeight),
      sidebarWidth:  num(s.nav_desktop_sidebar_width, 'sidebarWidth', d.desktop.sidebarWidth),
      quickLinkIcon: bool(s.nav_desktop_quicklink_icon, d.desktop.quickLinkIcon),
    },
  };
};
