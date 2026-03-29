import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
};

export default function DropZone({ onFile, disabled }: DropZoneProps) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onFile(accepted[0]);
    },
    [onFile]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    disabled,
  });

  const rejection = fileRejections[0]?.errors[0];
  const errorMessage = rejection
    ? rejection.code === 'file-too-large'
      ? 'Datei zu groß (max. 10 MB im Free-Plan, 50 MB Pro)'
      : 'Dateiformat nicht unterstützt (PDF, DOCX, TXT)'
    : null;

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          'group relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-all cursor-pointer',
          isDragActive
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-300 bg-white hover:border-indigo-300 hover:bg-gray-50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full transition-colors',
            isDragActive ? 'bg-indigo-100' : 'bg-gray-100 group-hover:bg-indigo-50'
          )}
        >
          {isDragActive ? (
            <FileText size={28} className="text-indigo-600" />
          ) : (
            <Upload size={28} className="text-gray-400 group-hover:text-indigo-500" />
          )}
        </div>

        <div>
          <p className="text-base font-medium text-gray-700">
            {isDragActive ? 'Datei hier ablegen…' : 'Vertrag hierher ziehen oder klicken'}
          </p>
          <p className="mt-1 text-sm text-gray-400">PDF, DOCX oder TXT · max. 10 MB (Free) / 50 MB (Pro)</p>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="shrink-0" />
          {errorMessage}
        </div>
      )}
    </div>
  );
}
