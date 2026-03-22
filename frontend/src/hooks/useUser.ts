import { useMemo } from 'react';
import { useUsageLimit } from './useUsageLimit';

export function useUser() {
  const { usage } = useUsageLimit();

  return useMemo(() => ({
    plan: usage?.plan ?? 'free',
    isPro: usage?.plan === 'pro' || usage?.plan === 'business',
  }), [usage]);
}
