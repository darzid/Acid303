const CACHE_NAME = 'Jam303-v1.0.0';
const ASSETS = [
  './',
  
  './css/styles.css',
    
  './images/favicon.ico',
  './images/favicon-192x192.png',
  './images/favicon-512x512.png',
  './images/copy.png',
  './images/share.png',
  
  './js/flags.js',
  './js/jam303-app.js',
  './js/jam303-audiograph.js',
  './js/jam303-sequencer.js',
  './js/jamconnect-app.js',
  './js/knob.js',
  './js/switch.js',
  './js/server.js',
  './js/tabcontrol.js',
  './js/qrcodemanager.js',
  './js/visualizer.js',
  
  './jam303.html',
  './jam303-manifest.json',
  './jam303-service-worker.js'
];
//////////ggggggggggggg
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
        return caches.match('./jam303.html');
      });
    })
  );
});
