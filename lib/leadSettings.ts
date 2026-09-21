'use client';
import { useEffect, useState } from 'react';
import { settingsApi } from '../services/api.service';

export interface LeadSettings {
  whatsappNumber: string;
  whatsappMessage: string;
  responsePromise: string;
  floatSitewide: boolean;
  /** false until the public settings have been fetched (lets the UI reserve space). */
  loaded?: boolean;
}

const DEFAULTS: LeadSettings = {
  whatsappNumber: '',
  whatsappMessage: 'Hi The Wood Vintage, I am interested in this piece and would like a quote.',
  responsePromise: 'within 1 business day',
  floatSitewide: false,
};

let cache: LeadSettings | null = null;
let inflight: Promise<LeadSettings> | null = null;

const load = (): Promise<LeadSettings> => {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = settingsApi.getPublic()
      .then(({ data }) => {
        const s = (data?.data ?? {}) as Record<string, string>;
        cache = {
          whatsappNumber: (s.whatsapp_number || '').replace(/\D/g, ''),
          whatsappMessage: s.whatsapp_default_message || DEFAULTS.whatsappMessage,
          responsePromise: s.lead_response_promise || DEFAULTS.responsePromise,
          floatSitewide: s.whatsapp_float_sitewide === 'true',
          loaded: true,
        };
        return cache;
      })
      .catch(() => { inflight = null; return { ...DEFAULTS, loaded: true }; });
  }
  return inflight;
};

/** Public lead-capture settings (WhatsApp number, response promise). Falls back to safe defaults. */
export function useLeadSettings(): LeadSettings {
  const [s, setS] = useState<LeadSettings>(cache ?? DEFAULTS);
  useEffect(() => { let on = true; load().then((v) => on && setS(v)); return () => { on = false; }; }, []);
  return s;
}

export function buildWhatsAppLink(
  number: string,
  opts: { base: string; productName?: string; url?: string; room?: string; style?: string; needs?: string },
): string {
  const parts = [opts.base];
  if (opts.productName) parts.push(`Product: ${opts.productName}`);
  if (opts.url) parts.push(opts.url);
  const about = [opts.room && `Room: ${opts.room}`, opts.style && `Style: ${opts.style}`, opts.needs && `Needs: ${opts.needs}`].filter(Boolean);
  if (about.length) parts.push(about.join(' | '));
  const text = encodeURIComponent(parts.join('\n'));
  return `https://wa.me/${number}?text=${text}`;
}
