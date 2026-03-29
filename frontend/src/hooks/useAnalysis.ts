import { useState } from 'react';
import type { AnalysisResult, StreamEvent } from '../types';

interface AnalysisState {
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
  progress: number;
  message: string;
  result: AnalysisResult | null;
  error: string | null;
  filename: string | null;
}

const INITIAL_STATE: AnalysisState = {
  status: 'idle',
  progress: 0,
  message: '',
  result: null,
  error: null,
  filename: null,
};

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);

  const analyze = async (file: File) => {
    setState({ ...INITIAL_STATE, status: 'uploading', progress: 2, message: 'Lade Datei hoch…', filename: file.name });

    const formData = new FormData();
    formData.append('file', file);

    let response: Response;
    try {
      response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
        },
        body: formData,
      });
    } catch {
      setState((s) => ({ ...s, status: 'error', error: 'Verbindung zum Server fehlgeschlagen.' }));
      return;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { message?: string; error?: string };
      const msg = body.message ?? body.error ?? `Fehler ${response.status}`;

      if (response.status === 429) {
        setState((s) => ({ ...s, status: 'error', error: '429:' + msg }));
      } else {
        setState((s) => ({ ...s, status: 'error', error: msg }));
      }
      return;
    }

    // Read SSE stream
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      setState((s) => ({ ...s, status: 'error', error: 'Stream nicht lesbar.' }));
      return;
    }

    let buffer = '';
    setState((s) => ({ ...s, status: 'processing' }));

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event: StreamEvent = JSON.parse(line.slice(6));
          if (event.status === 'processing') {
            setState((s) => ({ ...s, status: 'processing', progress: event.progress, message: event.message ?? '' }));
          } else if (event.status === 'complete') {
            setState((s) => ({ ...s, status: 'complete', progress: 100, result: event.result }));
          } else if (event.status === 'error') {
            setState((s) => ({ ...s, status: 'error', error: event.message }));
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  };

  const reset = () => setState(INITIAL_STATE);

  return { ...state, analyze, reset };
}
