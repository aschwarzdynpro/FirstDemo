import { useState } from 'react';
import { CheckCircle2, Zap, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../hooks/useUser';
import { cn } from '../lib/utils';
import api from '../lib/api';

interface Plan {
  key: string;
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
    key: 'free',
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
    cta: 'Aktueller Plan',
    highlighted: false,
  },
  {
    key: 'pro',
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
    key: 'business',
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
    cta: 'Business starten',
    highlighted: false,
  },
];

export default function Pricing() {
  const { plan: currentPlan } = useUser();
  const location = useLocation();
  const cancelled = new URLSearchParams(location.search).get('cancelled') === 'true';
  const upgraded = new URLSearchParams(location.search).get('upgraded') === 'true';
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async (planKey: string) => {
    if (planKey === 'free') return;
    setLoadingPlan(planKey);
    setError(null);
    try {
      const { data } = await api.post<{ url: string }>('/api/stripe/create-checkout-session', { plan: planKey });
      window.location.href = data.url;
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
        ?? 'Stripe-Checkout konnte nicht gestartet werden.';
      setError(msg);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Einfache Preise, keine Überraschungen
        </h1>
        <p className="mt-2 text-gray-500">Starten Sie kostenlos. Upgraden Sie, wenn Sie mehr brauchen.</p>
      </div>

      {cancelled && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 text-center">
          Checkout abgebrochen — kein Geld wurde abgebucht.
        </div>
      )}

      {upgraded && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 text-center">
          Upgrade erfolgreich! Ihr neuer Plan ist jetzt aktiv.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 text-center">
          {error}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrentPlan = plan.key === currentPlan;
          const isLoading = loadingPlan === plan.key;

          return (
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
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-amber-900 whitespace-nowrap">
                  Beliebteste Wahl
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2">
                  {plan.highlighted && <Zap size={16} className="text-indigo-200" />}
                  <h2 className={cn('text-lg font-bold', plan.highlighted ? 'text-white' : 'text-gray-900')}>
                    {plan.name}
                  </h2>
                  {isCurrentPlan && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                      Aktiv
                    </span>
                  )}
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
                disabled={isCurrentPlan || isLoading || plan.key === 'free'}
                onClick={() => handleUpgrade(plan.key)}
                className={cn(
                  'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors',
                  plan.highlighted
                    ? 'bg-white text-indigo-700 hover:bg-indigo-50 disabled:opacity-60'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50',
                  (isCurrentPlan || plan.key === 'free') && 'cursor-default'
                )}
              >
                {isLoading && <Loader2 size={14} className="animate-spin" />}
                {isCurrentPlan ? 'Aktueller Plan' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-sm text-gray-400">
        Alle Preise zzgl. gesetzlicher MwSt. · Jederzeit kündbar · Keine versteckten Kosten
      </p>
    </div>
  );
}
