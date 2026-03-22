import { useEffect, useState } from 'react';
import { fetchUsage } from '../lib/api';
import type { UserUsage } from '../types';

export function useUsageLimit() {
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await fetchUsage();
      setUsage(data);
    } catch {
      // ignore — guest user or network error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const isAtLimit =
    usage !== null &&
    usage.plan === 'free' &&
    usage.limit !== -1 &&
    usage.used >= usage.limit;

  return { usage, loading, isAtLimit, refresh: load };
}
