import { useEffect, useRef, useState, useCallback } from 'react';

export interface LiveTrackingData {
  orderId: string;
  status: string;
  deliveryStatus?: string;
  lastLatitude?: number | null;
  lastLongitude?: number | null;
  lastLocationAt?: string | null;
}

interface UseTrackingSseOptions {
  enabled?: boolean;
  onUpdate?: (data: LiveTrackingData) => void;
}

export function useTrackingSse(url: string | null, options: UseTrackingSseOptions = {}) {
  const { enabled = true, onUpdate } = options;
  const [liveData, setLiveData] = useState<LiveTrackingData | null>(null);
  const [connected, setConnected] = useState(false);
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const applyUpdate = useCallback((data: LiveTrackingData) => {
    setLiveData(data);
    onUpdateRef.current?.(data);
  }, []);

  useEffect(() => {
    if (!url || !enabled) {
      setConnected(false);
      return;
    }

    let es: EventSource | null = null;
    try {
      es = new EventSource(url, { withCredentials: true });
      es.onopen = () => setConnected(true);
      es.onmessage = (evt) => {
        try {
          const payload = JSON.parse(evt.data);
          applyUpdate(payload);
        } catch { /* ignore malformed */ }
      };
      es.onerror = () => setConnected(false);
    } catch {
      setConnected(false);
    }

    return () => {
      es?.close();
      setConnected(false);
    };
  }, [url, enabled, applyUpdate]);

  return { liveData, connected };
}
