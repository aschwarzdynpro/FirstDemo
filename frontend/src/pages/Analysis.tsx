import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { fetchDocument } from '../lib/api';
import AnalysisView from '../components/analysis/AnalysisView';
import { useUser } from '../hooks/useUser';
import type { AnalysisResult } from '../types';

interface DocumentDetail {
  id: string;
  filename: string;
  uploadedAt: string;
  overallRisk: string;
  result: AnalysisResult;
}

export default function Analysis() {
  const { id } = useParams<{ id: string }>();
  const { isPro } = useUser();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchDocument(id)
      .then(setDoc)
      .catch(() => setError('Analyse nicht gefunden.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-red-600">{error ?? 'Unbekannter Fehler'}</p>
        <Link to="/dashboard" className="mt-4 inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline">
          <ArrowLeft size={14} /> Zurück zum Verlauf
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 space-y-6">
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600"
      >
        <ArrowLeft size={14} /> Verlauf
      </Link>
      <AnalysisView result={doc.result} isPro={isPro} filename={doc.filename} documentId={doc.id} />
    </div>
  );
}
