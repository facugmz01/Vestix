const STORAGE_KEY = 'driver_gps_queue_v1';

export interface QueuedGpsPoint {
  id: string;
  token: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

function readQueue(): QueuedGpsPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedGpsPoint[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
}

export function enqueueGpsPoint(token: string, latitude: number, longitude: number) {
  const queue = readQueue();
  queue.push({
    id: crypto.randomUUID(),
    token,
    latitude,
    longitude,
    createdAt: new Date().toISOString(),
  });
  if (queue.length > 200) queue.splice(0, queue.length - 200);
  writeQueue(queue);
}

export function getGpsQueue(token?: string): QueuedGpsPoint[] {
  const queue = readQueue();
  return token ? queue.filter((p) => p.token === token) : queue;
}

export function removeGpsPoint(id: string) {
  writeQueue(readQueue().filter((p) => p.id !== id));
}

export async function flushGpsQueue(
  token: string,
  send: (latitude: number, longitude: number) => Promise<void>,
) {
  const pending = getGpsQueue(token);
  for (const point of pending) {
    try {
      await send(point.latitude, point.longitude);
      removeGpsPoint(point.id);
    } catch {
      break;
    }
  }
}

export function registerDriverServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.register('/driver-sw.js', { scope: '/' }).catch(() => undefined);
}

export function listenForGpsFlush(callback: () => void) {
  if (!('serviceWorker' in navigator)) return () => undefined;
  const handler = (event: MessageEvent) => {
    if (event.data?.type === 'FLUSH_GPS_QUEUE') callback();
  };
  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}
