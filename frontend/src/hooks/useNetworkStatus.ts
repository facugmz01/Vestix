/**
 * useNetworkStatus
 *
 * Combines browser online/offline events with a lightweight server probe.
 * navigator.onLine alone is unreliable (false negatives on load, PWA, etc.).
 */
import { useCallback, useEffect, useRef, useState } from 'react';

const PROBE_INTERVAL_MS = 30_000;
const PROBE_TIMEOUT_MS = 5_000;

async function probeServer(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const res = await fetch('/health', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'same-origin',
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [connectivityChecked, setConnectivityChecked] = useState(false);
  const probing = useRef(false);

  const checkConnectivity = useCallback(async () => {
    if (probing.current) return;
    probing.current = true;

    try {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      const reachable = await probeServer();
      setIsOnline(reachable);
    } finally {
      setConnectivityChecked(true);
      probing.current = false;
    }
  }, []);

  useEffect(() => {
    checkConnectivity();

    const handleOnline = () => {
      checkConnectivity();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setConnectivityChecked(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = window.setInterval(checkConnectivity, PROBE_INTERVAL_MS);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.clearInterval(interval);
    };
  }, [checkConnectivity]);

  return { isOnline, connectivityChecked, recheck: checkConnectivity };
}
