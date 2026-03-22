import { cn, RISK_LABELS, RISK_COLORS, RISK_DOT_COLORS } from '../../lib/utils';

interface RiskBadgeProps {
  risk: 'low' | 'medium' | 'high';
  size?: 'sm' | 'md';
}

export default function RiskBadge({ risk, size = 'md' }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        RISK_COLORS[risk],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      <span className={cn('rounded-full', RISK_DOT_COLORS[risk], size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2')} />
      {RISK_LABELS[risk]}
    </span>
  );
}
