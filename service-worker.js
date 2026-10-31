const CACHE_NAME = 'Jam303';
const ASSETS = [
  './',
  
  './css/styles.css',
    
  './images/favicon.ico',
  './images/favicon-192x192.png',
  './images/favicon-512x512.png',
  './images/copy.png',
  './images/share.png',
  
  './js/flags.js',
  './js/app.js',
  './js/audiograph.js',
  './js/jamconnect.js',
  './js/knob.js',
  './js/sequencer.js',
  './js/tabcontrol.js',
  './js/qrcodemanager.js',
  './js/visualizer.js',
  
  './index.html',
  './manifest.json',
  './service-worker.js'
];
//123456789012345678
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

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      }).catch(() => {
        return caches.match('./index.html');
      });
    })
  );
});
