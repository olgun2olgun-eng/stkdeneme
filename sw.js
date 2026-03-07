/**
 * STK Danışmanlık — Service Worker
 * Strateji: Cache-First (statik varlıklar) + Network-First (HTML sayfalar)
 * Versiyon: 1.0.0
 */

const CACHE_VERSION = 'stk-v1';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const PAGES_CACHE   = `${CACHE_VERSION}-pages`;

// Anında önbelleğe alınacak kritik varlıklar (install sırasında)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.webp',
  '/img/banner1.webp',
  '/css/style.css',
];

// ── INSTALL: Kritik varlıkları önceden al ───────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      return cache.addAll(PRECACHE_ASSETS.map(function(url) {
        return new Request(url, { cache: 'reload' });
      }));
    }).then(function() {
      return self.skipWaiting(); // Hemen aktif ol
    })
  );
});

// ── ACTIVATE: Eski cache'leri temizle ───────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key.startsWith('stk-') && key !== STATIC_CACHE && key !== PAGES_CACHE;
        }).map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim(); // Açık sayfaları hemen kontrol et
    })
  );
});

// ── FETCH: Akıllı cache stratejisi ─────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var req = event.request;
  var url = new URL(req.url);

  // Sadece kendi domain'imizden gelen GET isteklerini handle et
  if(req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Admin panelini asla cache'leme
  if(url.pathname.startsWith('/admin')) return;

  var isHTML = req.headers.get('Accept') && req.headers.get('Accept').includes('text/html');
  var isImage = /\.(webp|jpg|jpeg|png|gif|svg|ico)$/i.test(url.pathname);
  var isStatic = /\.(css|js|woff2?|ttf)$/i.test(url.pathname);

  if(isImage || isStatic) {
    // ── Cache-First: Görseller ve statik dosyalar
    event.respondWith(
      caches.open(STATIC_CACHE).then(function(cache) {
        return cache.match(req).then(function(cached) {
          if(cached) return cached;
          return fetch(req).then(function(response) {
            if(response && response.status === 200) {
              cache.put(req, response.clone());
            }
            return response;
          }).catch(function() { return new Response('', { status: 408 }); });
        });
      })
    );
  } else if(isHTML) {
    // ── Stale-While-Revalidate: HTML sayfalar (her zaman güncel)
    event.respondWith(
      caches.open(PAGES_CACHE).then(function(cache) {
        return cache.match(req).then(function(cached) {
          var networkFetch = fetch(req).then(function(response) {
            if(response && response.status === 200) {
              cache.put(req, response.clone());
            }
            return response;
          }).catch(function() {
            // Çevrimdışı: cache'den sun
            return cached || caches.match('/index.html');
          });
          // Cached varsa önce onu göster, arka planda güncelle
          return cached || networkFetch;
        });
      })
    );
  }
  // Diğerleri: normal network
});
