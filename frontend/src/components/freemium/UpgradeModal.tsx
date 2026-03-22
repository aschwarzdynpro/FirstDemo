import { useNavigate } from 'react-router-dom';
import { X, Zap, CheckCircle2 } from 'lucide-react';

interface UpgradeModalProps {
  onClose: () => void;
}

const PRO_FEATURES = [
  'Unbegrenzte Analysen pro Monat',
  'Bis zu 50 MB Dateigröße',
  'Verbesserungsvorschläge für jede Klausel',
  'PDF-Export mit Branding',
  'Prioritäts-Support',
];

export default function UpgradeModal({ onClose }: UpgradeModalProps) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <Zap size={22} className="text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Free-Limit erreicht</h2>
          <p className="mt-1 text-sm text-gray-500">
            Sie haben Ihre 3 kostenlosen Analysen diesen Monat verbraucht.
          </p>
        </div>

        {/* Pro features */}
        <ul className="mb-6 space-y-2">
          {PRO_FEATURES.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
              <CheckCircle2 size={16} className="shrink-0 text-indigo-500" />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => { navigate('/pricing'); onClose(); }}
          className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Jetzt auf Pro upgraden — €19/Monat
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full rounded-xl py-2 text-sm text-gray-400 hover:text-gray-600"
        >
          Nicht jetzt
        </button>
      </div>
    </div>
  );
}
