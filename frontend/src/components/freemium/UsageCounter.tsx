import { Link } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { useUsageLimit } from '../../hooks/useUsageLimit';
import { cn } from '../../lib/utils';

export default function UsageCounter() {
  const { usage, loading } = useUsageLimit();

  if (loading || !usage) return null;

  if (usage.plan !== 'free') {
    return (
      <span className="flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
        <Zap size={12} />
        Pro
      </span>
    );
  }

  const remaining = usage.limit - usage.used;
  const isLow = remaining <= 1;

  return (
    <Link
      to="/pricing"
      className={cn(
        'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:shadow-sm',
        isLow
          ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
          : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
      )}
      title="Auf Pro upgraden"
    >
      <span>{usage.used}/{usage.limit} Analysen</span>
      {isLow && <span className="font-semibold">· Upgrade</span>}
    </Link>
  );
}
