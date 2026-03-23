import { useState } from 'react';
import { Download, Lock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../hooks/useUser';

interface ExportButtonProps {
  documentId: string;
  filename: string;
}

export default function ExportButton({ documentId, filename }: ExportButtonProps) {
  const { isPro } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!isPro) {
      navigate('/pricing');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') ?? '';
      const response = await fetch(`/api/documents/${documentId}/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string };
        setError(body.error ?? 'Export fehlgeschlagen.');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename.replace(/\.[^.]+$/, '')}_analyse.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('Download fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleExport}
        disabled={loading}
        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
          isPro
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'border border-gray-200 bg-white text-gray-500 hover:border-indigo-300 hover:text-indigo-600'
        }`}
        title={isPro ? 'PDF herunterladen' : 'Pro-Feature — upgraden'}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : isPro ? (
          <Download size={15} />
        ) : (
          <Lock size={15} />
        )}
        {isPro ? 'PDF exportieren' : 'PDF exportieren (Pro)'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
