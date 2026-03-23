import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Trash2, FileText, ArrowRight } from 'lucide-react';
import { fetchDocuments, deleteDocument } from '../lib/api';
import RiskBadge from '../components/analysis/RiskBadge';
import { formatDate } from '../lib/utils';
import type { Document } from '../types';

export default function Dashboard() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments()
      .then(setDocs)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Analyse löschen?')) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Analyse-Verlauf</h1>
        <Link
          to="/"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Neue Analyse <ArrowRight size={14} />
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <FileText size={36} className="text-gray-300" />
          <p className="text-gray-400">Noch keine Analysen vorhanden.</p>
          <Link
            to="/"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Ersten Vertrag analysieren
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <Link to={`/analysis/${doc.id}`} className="flex flex-1 flex-col gap-1 min-w-0">
                <span className="truncate font-medium text-gray-900 text-sm sm:text-base">{doc.filename}</span>
                <span className="text-xs text-gray-400">{formatDate(doc.uploadedAt)}</span>
                {doc.summary && (
                  <p className="mt-1 line-clamp-2 text-xs sm:text-sm text-gray-500">{doc.summary}</p>
                )}
              </Link>
              <div className="flex shrink-0 flex-col items-end gap-2">
                <RiskBadge risk={doc.overallRisk as 'low' | 'medium' | 'high'} size="sm" />
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deletingId === doc.id}
                  className="rounded p-1 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Löschen"
                >
                  {deletingId === doc.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
