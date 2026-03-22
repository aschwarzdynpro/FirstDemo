import { useState } from 'react';
import { ChevronDown, ChevronUp, Lock, Lightbulb, FileText } from 'lucide-react';
import type { Clause } from '../../types';
import RiskBadge from './RiskBadge';
import { cn } from '../../lib/utils';

interface ClauseCardProps {
  clause: Clause;
  isPro: boolean;
}

export default function ClauseCard({ clause, isPro }: ClauseCardProps) {
  const [expanded, setExpanded] = useState(false);

  const borderColor =
    clause.risk === 'high'
      ? 'border-red-200'
      : clause.risk === 'medium'
        ? 'border-amber-200'
        : 'border-green-200';

  return (
    <div className={cn('rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md', borderColor)}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left"
      >
        <div className="flex flex-col gap-1.5">
          <span className="font-semibold text-gray-900">{clause.title}</span>
          {!expanded && (
            <p className="line-clamp-1 text-sm text-gray-500">{clause.plainExplanation}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <RiskBadge risk={clause.risk} size="sm" />
          {expanded ? (
            <ChevronUp size={16} className="text-gray-400" />
          ) : (
            <ChevronDown size={16} className="text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
          {/* Original text */}
          <div>
            <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
              <FileText size={12} />
              Originaltext
            </p>
            <blockquote className="rounded-lg bg-gray-50 px-3 py-2 text-sm italic text-gray-600 border-l-4 border-gray-200">
              {clause.originalText}
            </blockquote>
          </div>

          {/* Explanation */}
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-400">Erklärung</p>
            <p className="text-sm text-gray-700">{clause.plainExplanation}</p>
          </div>

          {/* Risk reason */}
          <div
            className={cn(
              'rounded-lg px-3 py-2 text-sm',
              clause.risk === 'high'
                ? 'bg-red-50 text-red-700'
                : clause.risk === 'medium'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-green-50 text-green-700'
            )}
          >
            <span className="font-medium">Risikobewertung: </span>
            {clause.riskReason}
          </div>

          {/* Suggestion — Pro only */}
          {clause.suggestion && (
            <div className={cn('relative rounded-lg border p-3', isPro ? 'border-indigo-100 bg-indigo-50' : '')}>
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-indigo-500">
                <Lightbulb size={12} />
                Verbesserungsvorschlag
              </p>
              {isPro ? (
                <p className="text-sm text-indigo-800">{clause.suggestion}</p>
              ) : (
                <div className="relative">
                  <p className="select-none text-sm text-transparent blur-sm">{clause.suggestion}</p>
                  <div className="absolute inset-0 flex items-center justify-center gap-1.5 text-xs font-medium text-gray-500">
                    <Lock size={12} />
                    Pro-Feature
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
