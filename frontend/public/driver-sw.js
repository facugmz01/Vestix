/* Service worker for driver PWA — caches shell and replays offline GPS queue on reconnect */
const CACHE = 'driver-v1';
const SHELL = ['/driver/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request)),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FLUSH_GPS_QUEUE') {
    event.waitUntil(flushGpsQueue());
  }
});

async function flushGpsQueue() {
  const clients = await self.clients.matchAll({ type: 'window' });
  for (const client of clients) {
    client.postMessage({ type: 'FLUSH_GPS_QUEUE' });
  }
}
