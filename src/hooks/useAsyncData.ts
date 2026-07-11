import { useCallback, useState } from 'react';

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error';

// Centralizes the loading/success/error transition that was hand-rolled
// with a slightly different shape on every screen (Home, Alerts,
// PreparednessPlan, TravelAdvisory). Callers still own their own state
// setters inside `task` — this only owns the status and the try/catch.
export function useAsyncData<Args extends unknown[]>(task: (...args: Args) => Promise<void>) {
  const [status, setStatus] = useState<AsyncStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const run = useCallback(
    async (...args: Args) => {
      setStatus('loading');
      setErrorMessage(null);
      try {
        await task(...args);
        setStatus('success');
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Something went wrong.');
        setStatus('error');
      }
    },
    [task],
  );

  return { status, errorMessage, run } as const;
}
