import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import DropZone from '../components/upload/DropZone';
import UploadProgress from '../components/upload/UploadProgress';
import AnalysisView from '../components/analysis/AnalysisView';
import UpgradeModal from '../components/freemium/UpgradeModal';
import { useAnalysis } from '../hooks/useAnalysis';
import { useUser } from '../hooks/useUser';
import { useUsageLimit } from '../hooks/useUsageLimit';

export default function Home() {
  const { status, progress, message, result, error, filename, analyze, reset } = useAnalysis();
  const { isPro } = useUser();
  const { isAtLimit, refresh: refreshUsage } = useUsageLimit();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleFile = async (file: File) => {
    if (isAtLimit) {
      setShowUpgradeModal(true);
      return;
    }
    await analyze(file);
    await refreshUsage();
  };

  const isLimit429 = error?.startsWith('429:');

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      {/* Hero */}
      {status === 'idle' && (
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Verträge verstehen — <span className="text-indigo-600">ohne Anwalt</span>
          </h1>
          <p className="mt-3 text-gray-500">
            Laden Sie einen Vertrag hoch und erhalten Sie eine verständliche KI-Analyse in Sekunden.
          </p>
        </div>
      )}

      {/* Upload */}
      {(status === 'idle' || status === 'error') && (
        <div className="space-y-4">
          <DropZone onFile={handleFile} disabled={isAtLimit} />

          {isAtLimit && !isLimit429 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Free-Limit erreicht (3/3 Analysen).{' '}
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="font-semibold underline underline-offset-2"
              >
                Jetzt upgraden
              </button>
            </div>
          )}

          {error && !isLimit429 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {isLimit429 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {error?.slice(4)}{' '}
              <button
                onClick={() => setShowUpgradeModal(true)}
                className="font-semibold underline underline-offset-2"
              >
                Upgrade →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Progress */}
      {(status === 'uploading' || status === 'processing') && (
        <UploadProgress progress={progress} message={message} />
      )}

      {/* Result */}
      {status === 'complete' && result && (
        <div className="space-y-6">
          <AnalysisView result={result} isPro={isPro} filename={filename ?? undefined} />
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500 transition-colors hover:border-indigo-300 hover:text-indigo-600"
          >
            <ArrowRight size={15} />
            Neuen Vertrag analysieren
          </button>
        </div>
      )}

      {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
    </div>
  );
}
