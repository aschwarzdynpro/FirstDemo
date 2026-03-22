import { CheckCircle2 } from 'lucide-react';
import type { AnalysisResult } from '../../types';
import RiskSummary from './RiskSummary';
import ClauseCard from './ClauseCard';

interface AnalysisViewProps {
  result: AnalysisResult;
  isPro?: boolean;
  filename?: string;
}

export default function AnalysisView({ result, isPro = false, filename }: AnalysisViewProps) {
  // Sort: high → medium → low
  const sorted = [...result.clauses].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.risk] - order[b.risk];
  });

  return (
    <div className="space-y-6">
      {/* Filename */}
      {filename && (
        <p className="text-sm text-gray-400">
          Analyse von <span className="font-medium text-gray-600">{filename}</span>
        </p>
      )}

      {/* Overall risk banner */}
      <RiskSummary result={result} />

      {/* Clauses */}
      <div>
        <h3 className="mb-3 text-base font-semibold text-gray-800">
          Klauseln ({result.clauses.length})
        </h3>
        <div className="space-y-3">
          {sorted.map((clause) => (
            <ClauseCard key={clause.id} clause={clause} isPro={isPro} />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
          <h3 className="mb-3 font-semibold text-indigo-900">Empfehlungen</h3>
          <ul className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-indigo-800">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-indigo-500" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
