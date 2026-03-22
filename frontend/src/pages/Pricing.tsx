import { CheckCircle2, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface Plan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '€0',
    period: '/Monat',
    description: 'Für den gelegentlichen Einsatz',
    features: [
      '3 Analysen pro Monat',
      'Bis zu 10 MB Dateigröße',
      'PDF, DOCX, TXT',
      'Grundlegende Risikoanalyse',
      'Klausel-Erklärungen',
    ],
    cta: 'Kostenlos starten',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '€19',
    period: '/Monat',
    description: 'Für Freelancer und Selbstständige',
    features: [
      'Unbegrenzte Analysen',
      'Bis zu 50 MB Dateigröße',
      'Verbesserungsvorschläge pro Klausel',
      'PDF-Export mit Branding',
      'Analyse-Verlauf',
      'Prioritäts-Support',
    ],
    cta: 'Pro starten',
    highlighted: true,
  },
  {
    name: 'Business',
    price: '€49',
    period: '/Monat',
    description: 'Für Teams und KMUs',
    features: [
      'Alles aus Pro',
      'Team-Zugang (bis 10 Nutzer)',
      'API-Zugang',
      'Dedizierter Support',
      'On-Premise auf Anfrage',
    ],
    cta: 'Business anfragen',
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Einfache Preise, keine Überraschungen</h1>
        <p className="mt-2 text-gray-500">Starten Sie kostenlos. Upgraden Sie, wenn Sie mehr brauchen.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              'relative flex flex-col rounded-2xl border p-6 shadow-sm',
              plan.highlighted
                ? 'border-indigo-400 bg-indigo-600 text-white shadow-xl ring-2 ring-indigo-400'
                : 'border-gray-200 bg-white'
            )}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-amber-900">
                Beliebteste Wahl
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center gap-2">
                {plan.highlighted && <Zap size={16} className="text-indigo-200" />}
                <h2 className={cn('text-lg font-bold', plan.highlighted ? 'text-white' : 'text-gray-900')}>
                  {plan.name}
                </h2>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className={cn('text-3xl font-extrabold', plan.highlighted ? 'text-white' : 'text-gray-900')}>
                  {plan.price}
                </span>
                <span className={cn('text-sm', plan.highlighted ? 'text-indigo-200' : 'text-gray-400')}>
                  {plan.period}
                </span>
              </div>
              <p className={cn('mt-1 text-sm', plan.highlighted ? 'text-indigo-200' : 'text-gray-500')}>
                {plan.description}
              </p>
            </div>

            <ul className="mb-6 flex-1 space-y-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle2
                    size={15}
                    className={cn('mt-0.5 shrink-0', plan.highlighted ? 'text-indigo-200' : 'text-indigo-500')}
                  />
                  <span className={plan.highlighted ? 'text-indigo-100' : 'text-gray-700'}>{f}</span>
                </li>
              ))}
            </ul>

            <button
              className={cn(
                'w-full rounded-xl py-2.5 text-sm font-semibold transition-colors',
                plan.highlighted
                  ? 'bg-white text-indigo-700 hover:bg-indigo-50'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              )}
              onClick={() => alert('Stripe-Integration kommt in Phase 2!')}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-gray-400">
        Alle Preise zzgl. gesetzlicher MwSt. · Jederzeit kündbar · Keine versteckten Kosten
      </p>
    </div>
  );
}
