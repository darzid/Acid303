const CACHE_NAME = 'Jam909-v1.0.1';
const ASSETS = [
  './',
  
  './css/styles.css',
  './css/jam909.css',
  
  './images/favicon.ico',
  './images/favicon-192x192.png',
  './images/favicon-512x512.png',
  './images/copy.png',
  './images/share.png',
  
  './js/flags.js',
  './js/jam909-app.js',
  './js/jam909-audiograph.js',
  './js/jam909-sequencer.js',
  './js/jamconnect-app.js',
  './js/knob.js',
  './js/tabcontrol.js',
  './js/qrcodemanager.js',
  './js/visualizer.js',
  
  './jam909.html',
  './jam909-manifest.json',
  './jam909-service-worker.js'
];

//gfgffgggggdgdvgggggffgffgggg
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
        return caches.match('./jam909.html');
      });
    })
  );
});
