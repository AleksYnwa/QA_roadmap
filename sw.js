const CACHE_NAME = 'qa-theory-v1';
const ASSETS = [
  '/QA_roadmap/',
  '/QA_roadmap/index.html',
  '/QA_roadmap/manifest.json',
  '/QA_roadmap/icons/icon-192.png',
  '/QA_roadmap/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Unbounded:wght@400;600;700&family=IBM+Plex+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400&display=swap'
];

// Install — кешируем все основные ресурсы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — удаляем старые кеши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — сначала кеш, при промахе — сеть, потом кладём в кеш
self.addEventListener('fetch', event => {
  // Не перехватываем chrome-extension и non-GET
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Кешируем только успешные ответы
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // Офлайн-фоллбек для навигации
        if (event.request.mode === 'navigate') {
          return caches.match('/QA_roadmap/');
        }
      });
    })
  );
});
