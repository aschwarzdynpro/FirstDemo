import { useAuth } from '../context/AuthContext';

export function useUser() {
  const { user } = useAuth();
  return {
    user,
    plan: user?.plan ?? 'free',
    isPro: user?.plan === 'pro' || user?.plan === 'business',
  };
}
