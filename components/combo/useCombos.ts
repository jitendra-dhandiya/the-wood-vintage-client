'use client';
import { useEffect, useState } from 'react';
import { comboApi } from '../../services/api.service';
import { useCountry } from '../../contexts/CountryContext';
import type { Combo } from '../../types';

/** Combos offered in the visitor's market. The server also locks the market to their location (decision 0036). */
export function useCombos(opts: { home?: boolean; productId?: string; limit?: number } = {}) {
  const { country } = useCountry();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    comboApi.list({ country, ...opts })
      .then(({ data }) => { if (live) setCombos((data as any).data ?? []); })
      .catch(() => { if (live) setCombos([]); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, opts.home, opts.productId, opts.limit]);
  return { combos, loading };
}
