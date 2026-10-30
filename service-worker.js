const CACHE_NAME = 'Jam303-dev-v1';
const ASSETS = [
  './',
  './app.js',
  './connect.html',
  './favicon.ico',
  './index.html',
  './jamconnect.js',
  './manifest.json',
  './service-worker.js',
  './styles.css',
  './tabcontrol.js',
  './qrcodemanager.js',
  './visualizer.js'
];

//
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // Network-first for dev bubble so updates are always fresh and never mixed with main cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
