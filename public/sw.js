const CACHE_STATIC = 'tiny-dungeon-static-v6';
const CACHE_PAGES = 'tiny-dungeon-pages-v6';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/app-192.png',
  '/icons/app-512.png',
  '/models/torii-gate.glb',
  '/models/lantern-pedestal.glb',
  '/assets/ui/panel-sidebar-frame.webp',
  '/assets/ui/tray-dice-wooden.webp',
  '/assets/ui/scroll-combat-log.webp',
  '/assets/ui/btn-crimson.webp',
  '/assets/ui/btn-gold.webp',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_STATIC && key !== CACHE_PAGES)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    // NetworkFirst for HTML shell
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_PAGES).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
    );
    return;
  }

  // CacheFirst for versioned static assets, WebP sprites, and 3D .glb models
  const dest = request.destination;
  let pathname = '';
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    pathname = '';
  }

  const isStaticAsset =
    ['script', 'style', 'image', 'font'].includes(dest) ||
    pathname.endsWith('.glb') ||
    pathname.endsWith('.webp');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_STATIC).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
  }
});
