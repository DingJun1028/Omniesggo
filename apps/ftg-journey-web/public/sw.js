// 遷移用：卸載舊版 service worker（Google 登入時代的 PWA 快取），交付後自盡。
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.claim())
  );
});
