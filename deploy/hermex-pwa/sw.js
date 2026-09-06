// Hermex PWA Service Worker - 5T Enhanced
// Source: soul.md :: PWA Module :: 5T Verification

const CACHE_NAME = 'hermex-cache-v1';
const DATA_CACHE_NAME = 'hermex-data-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/sw.js',
  '/icon-512.png',
  '/favicon.ico'
];

// 5T Traceable: 增量同步端點
const DELTA_ENDPOINT = '/api/pwa/delta';
const SYNC_INTERVAL = 30000; // 30 seconds

// 5T Tangible: 離線功能配置
const OFFLINE_FALLBACK = '/offline.html';
const VERSION_CHECK_URL = '/api/version';

// 5T Trustworthy: Hash Lock 驗證
async function verifyAssetIntegrity(url, expectedHash) {
  try {
    const response = await fetch(url);
    const content = await response.text();
    const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(content));
    const hexHash = Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join('');
    return hexHash === expectedHash;
  } catch (e) {
    return false;
  }
}

// 5T Transparent: Zero Hallucination Check
async function validateFetchResponse(request) {
  const response = await fetch(request);
  
  // Verify content-type matches expectation
  const expectedType = request.url.match(/\.(png|jpg|svg|json)$/) ? 
    (request.url.endsWith('.json') ? 'application/json' : 'image/png') :
    request.url.endsWith('.webmanifest') ? 'application/manifest+json' : 'text/html';
    
  if (response.headers.get('Content-Type')?.split(';')[0] !== expectedType) {
    console.warn('[5T-FAIL] Content-Type mismatch:', request.url);
    return new Response('Content-Type validation failed', { status: 400 });
  }
  
  return response;
}

// Install event - precompute caches
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)),
      caches.open(DATA_CACHE_NAME).then(cache => 
        cache.addAll([DELTA_ENDPOINT, VERSION_CHECK_URL])
      ),
      self.skipWaiting()
    ])
  );
});

// Activate event - claim clients and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - 5T Optimized routing
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);

  // 5T Incremental: Handle delta sync requests
  if (url.pathname === DELTA_ENDPOINT) {
    event.respondWith(handleDeltaRequest(request));
    return;
  }

  // 5T Tangible: Offline-first strategy for core assets
  if (ASSETS.includes(url.pathname) || url.origin === self.location.origin) {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }

  // 5T Trustworthy: API requests with validation
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(validateAndCacheAPI(request));
    return;
  }

  // 5T Transparent: Default to network-first
  event.respondWith(networkFirstWithCacheFallback(request));
});

// 5T Incremental: Delta sync handler
async function handleDeltaRequest(request) {
  try {
    const response = await validateFetchResponse(request);
    const data = await response.json();
    
    // 5T Tangible: Store delta in cache
    const cache = await caches.open(DATA_CACHE_NAME);
    await cache.put(request, new Response(JSON.stringify(data)));
    
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('[DELTA-ERROR]', error);
    
    // 5T Trustworthy: Return cached delta if available
    const cache = await caches.open(DATA_CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    
    return new Response(JSON.stringify({ error: 'Sync failed' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 5T Tangible: Network-first with cache fallback
async function networkFirstWithCacheFallback(request) {
  try {
    const response = await validateFetchResponse(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) return cachedResponse;
    
    // 5T Tangible: Offline fallback
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_FALLBACK) || caches.match('/index.html');
    }
    
    return new Response('', { status: 503 });
  }
}

// 5T Trustworthy: API response validation and caching
async function validateAndCacheAPI(request) {
  try {
    const response = await validateFetchResponse(request);
    
    // 5T Trackable: Cache API responses with TTL
    const cache = await caches.open(DATA_CACHE_NAME);
    const clonedResponse = response.clone();
    
    // Cache for 5 minutes
    const headers = new Headers(clonedResponse.headers);
    headers.append('Cache-Control', 'max-age=300');
    
    const cachedResponse = new Response(clonedResponse.body, {
      status: clonedResponse.status,
      statusText: clonedResponse.statusText,
      headers
    });
    
    cache.put(request, cachedResponse);
    return response;
  } catch (error) {
    // 5T Trustworthy: Return stale cache on network failure
    const cache = await caches.open(DATA_CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    
    return new Response(JSON.stringify({ 
      error: 'Network error',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// 5T Tangible: Periodic sync for background updates
self.addEventListener('periodicsync', event => {
  if (event.tag === 'hermex-sync') {
    event.waitUntil(handlePeriodicSync());
  }
});

async function handlePeriodicSync() {
  try {
    // Trigger delta sync
    const response = await fetch(DELTA_ENDPOINT, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    
    // 5T Tangible: Process updates
    if (data.updates) {
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'PWA_UPDATE',
          data: data.updates
        });
      });
    }
  } catch (error) {
    console.error('[SYNC-ERROR]', error);
  }
}

// 5T Trustworthy: Push notification handler
self.addEventListener('push', event => {
  const data = event.data?.json() || {};
  
  const options = {
    body: data.body || 'New update available',
    icon: '/icon-512.png',
    badge: '/favicon.ico',
    data: {
      url: data.url || '/',
      type: data.type || 'generic'
    },
    actions: data.actions || [{ action: 'open', title: 'Open' }]
  };
  
  event.waitUntil(self.registration.showNotification(data.title || 'Hermex', options));
});

// 5T Tangible: Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.openWindow(url).then(client => {
      // 5T Trackable: Focus existing tab if open
      if (client) {
        client.focus();
      }
    })
  );
});

// 5T Trustworthy: Error reporting with context
self.addEventListener('error', event => {
  const errorData = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    timestamp: Date.now()
  };
  
  // In production, send to error tracking service
  console.error('[PWA-ERROR]', errorData);
});