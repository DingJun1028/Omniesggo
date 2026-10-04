// ESG GO OmniCore PWA Service Worker (v3.4.0)
// 100% De-Google Architecture — Local Cache Strategy

const CACHE_NAME = 'esggo-omnicore-v3.4.0';
const STATIC_ASSETS = [
  '/',
  '/omni-center',
  '/data-bridge',
  '/parser',
  '/materiality',
  '/roadmap',
  '/supply-chain',
  '/verifier',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[sw] Caching 5T static assets...');
      return cache.addAll(STATIC_ASSETS).catch(() => Promise.resolve());
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass service worker for /api/, /_next/ (Next.js dynamic assets), and external requests
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.status === 200 && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch((err) => {
        // Only return HTML fallback for HTML navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/') || Response.error();
        }
        throw err;
      });
    })
  );
});
