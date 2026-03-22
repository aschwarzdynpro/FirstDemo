import { Loader2 } from 'lucide-react';

interface UploadProgressProps {
  progress: number;
  message?: string;
}

export default function UploadProgress({ progress, message }: UploadProgressProps) {
  return (
    <div className="w-full rounded-2xl border border-indigo-100 bg-white p-8 shadow-sm">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <Loader2 size={40} className="animate-spin text-indigo-600" />
        </div>
        <div className="w-full text-center">
          <p className="mb-3 font-medium text-gray-700">{message ?? 'Analysiere Vertrag…'}</p>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-400">{progress}%</p>
        </div>
      </div>
    </div>
  );
}
