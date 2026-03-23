import { useEffect, useState } from 'react';
import { fetchUsage } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { UserUsage } from '../types';

export function useUsageLimit() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<UserUsage | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) {
      setUsage(null);
      setLoading(false);
      return;
    }
    try {
      const data = await fetchUsage();
      setUsage(data);
    } catch {
      // network / auth error — fail silently
    } finally {
      setLoading(false);
    }
  };

  // Reload whenever the logged-in user changes
  useEffect(() => {
    setLoading(true);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const isAtLimit =
    usage !== null &&
    usage.plan === 'free' &&
    usage.limit !== -1 &&
    usage.used >= usage.limit;

  return { usage, loading, isAtLimit, refresh: load };
}
