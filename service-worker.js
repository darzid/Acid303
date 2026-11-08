const CACHE_NAME = 'JamConnect-v1.0.0';
const ASSETS = [
  './',
  
  './css/styles.css',
    
  './images/JamConnect favicon.ico',
  './images/JamConnect icon 192x192.jpg',
  './images/JamConnect icon 512x512.jpg',
  './images/JamConnect logo 726x203.jpg',
  './app.js',
  
  './index.html',
  './manifest.json',
  './service-worker.js'
];
//////////g
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
