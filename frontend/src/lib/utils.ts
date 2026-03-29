import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const RISK_LABELS: Record<string, string> = {
  low: 'Geringes Risiko',
  medium: 'Mittleres Risiko',
  high: 'Hohes Risiko',
};

export const RISK_COLORS: Record<string, string> = {
  low: 'text-green-700 bg-green-50 border-green-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  high: 'text-red-700 bg-red-50 border-red-200',
};

export const RISK_DOT_COLORS: Record<string, string> = {
  low: 'bg-green-500',
  medium: 'bg-amber-500',
  high: 'bg-red-500',
};

export const RISK_BANNER_COLORS: Record<string, string> = {
  low: 'bg-green-50 border-green-300 text-green-800',
  medium: 'bg-amber-50 border-amber-300 text-amber-800',
  high: 'bg-red-50 border-red-300 text-red-800',
};
