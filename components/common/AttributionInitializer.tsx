'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { readStoredAttribution, persistAttribution } from '../../lib/attribution';

/**
 * Phase 7 (Analytics) marketing attribution capture — same tier/pattern as
 * `GenderInitializer.tsx`: a thin client component whose only job is to read
 * the incoming signal and hand it to the lib (`lib/attribution.ts`) that owns
 * persistence.
 *
 * First-touch only (phase-7-analytics-spec.md §4): if `wv_attribution`
 * already has a value, a later visit with different utm_* params must not
 * overwrite it — the campaign that brought the shopper in the first time is
 * the one that matters.
 */
export default function AttributionInitializer() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (readStoredAttribution()) return; // already captured — first touch wins

    const utmSource = searchParams.get('utm_source') ?? undefined;
    const utmMedium = searchParams.get('utm_medium') ?? undefined;
    const utmCampaign = searchParams.get('utm_campaign') ?? undefined;
    if (!utmSource && !utmMedium && !utmCampaign) return;

    persistAttribution({ utmSource, utmMedium, utmCampaign });
  }, [searchParams]);

  return null;
}
