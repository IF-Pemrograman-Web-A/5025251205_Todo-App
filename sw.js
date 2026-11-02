const CACHE_NAME = 'todo-saskara-v8';
const APP_SHELL = [
  './offline.html',
  './offline.css',
  './offline.js',
  './manifest.webmanifest',
  './style.css',
  './script.js',
  './pwa.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
const SHELL_URLS = new Set(
  APP_SHELL.map((asset) => new URL(asset, self.registration.scope).href)
);

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('todo-saskara-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function getOfflinePage() {
  const cache = await caches.open(CACHE_NAME);
  return await cache.match(new URL('./offline.html', self.registration.scope))
    || new Response('Aplikasi sedang offline. Muat ulang saat koneksi tersedia.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
    return;
  }

  if (SHELL_URLS.has(requestUrl.href)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
          await cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      })
    );
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((networkResponse) => {
        if (networkResponse.status >= 500) {
          return getOfflinePage();
        }
        return networkResponse;
      }).catch(() => getOfflinePage())
    );
  }
});
