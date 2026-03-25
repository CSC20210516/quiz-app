const CACHE_NAME = 'quiz-app-20250325';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700;900&family=Space+Mono:wght@400;700&display=swap'
];

// 安裝：快取所有靜態資源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS.filter(a => !a.startsWith('http')));
    })
  );
  self.skipWaiting(); // 立即啟用新版本
});

// 啟動：清除所有舊版快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => {
        console.log('[SW] 清除舊快取：', k);
        return caches.delete(k);
      }))
    )
  );
  self.clients.claim(); // 立即接管所有頁面
});

// 請求攔截：網路優先，快取備援（確保總是拿最新版）
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      if (!response || response.status !== 200) return response;
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => {
      // 網路失敗時才用快取（離線模式）
      return caches.match(event.request).then(cached => cached || caches.match('./index.html'));
    })
  );
});
