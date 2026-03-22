import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import type { AnalysisResult } from '../../types';
import { cn, RISK_BANNER_COLORS } from '../../lib/utils';

interface RiskSummaryProps {
  result: AnalysisResult;
}

const RISK_ICONS = {
  low: ShieldCheck,
  medium: ShieldAlert,
  high: ShieldX,
};

const RISK_TITLES = {
  low: 'Geringes Risiko',
  medium: 'Mittleres Risiko — Prüfung empfohlen',
  high: 'Hohes Risiko — Handlungsbedarf',
};

export default function RiskSummary({ result }: RiskSummaryProps) {
  const Icon = RISK_ICONS[result.overallRisk];
  const high = result.clauses.filter((c) => c.risk === 'high').length;
  const medium = result.clauses.filter((c) => c.risk === 'medium').length;
  const low = result.clauses.filter((c) => c.risk === 'low').length;

  return (
    <div className={cn('rounded-2xl border-2 p-5', RISK_BANNER_COLORS[result.overallRisk])}>
      <div className="flex items-start gap-4">
        <Icon size={32} className="mt-0.5 shrink-0" />
        <div className="flex-1">
          <h2 className="text-lg font-bold">{RISK_TITLES[result.overallRisk]}</h2>
          <p className="mt-1 text-sm leading-relaxed">{result.summary}</p>

          {/* Clause stats */}
          <div className="mt-3 flex flex-wrap gap-3">
            {high > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-0.5 text-xs font-semibold text-red-800">
                {high} kritisch
              </span>
            )}
            {medium > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-800">
                {medium} zu prüfen
              </span>
            )}
            {low > 0 && (
              <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-800">
                {low} unbedenklich
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
