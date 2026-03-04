// %0.01 Elit Seviye – Kuantum Katman | Elite Service Worker v3.0
// stkdanismanlik.com — Offline-first · Predictive Prefetch · Delta Updates

const CACHE_VERSION = "v3.0";
const STATIC_CACHE  = `stk-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `stk-dynamic-${CACHE_VERSION}`;
const FONT_CACHE    = `stk-fonts-${CACHE_VERSION}`;
const IMG_CACHE     = `stk-images-${CACHE_VERSION}`;

// Kritik varlıklar — install anında önbelleğe al
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/rum.js",
  "/js/prefetch.js",
  "/logo.webp",
  "/img/banner1.webp",
  "/manifest.json",
  "/offline.html",
];

// Sık ziyaret edilen sayfalar — idle anında prefetch
const PREFETCH_PAGES = [
  "/hizmet-dernek-kurulusu.html",
  "/hizmet-vakif-kurulusu.html",
  "/iletisim.html",
  "/hakkimizda.html",
  "/hizmet-derbis.html",
];

// ── INSTALL: Statik varlıkları önbelleğe al ───────────────────────────────────
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_ASSETS.map((url) => new Request(url, { cache: "reload" })))
    )
  );
});

// ── ACTIVATE: Eski cache'leri temizle + prefetch başlat ──────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Eski cache versiyonlarını sil
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((k) => ![STATIC_CACHE, DYNAMIC_CACHE, FONT_CACHE, IMG_CACHE].includes(k))
            .map((k) => caches.delete(k))
        )
      ),
      // Idle'da sık sayfaları prefetch et
      idlePrefetchPages(),
    ])
  );
});

// ── FETCH: Stale-While-Revalidate stratejisi ──────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Sadece GET isteklerini yakala
  if (req.method !== "GET") return;

  // Chrome extension / non-http isteklerini atla
  if (!req.url.startsWith("http")) return;

  // Font istekleri: Cache First (font değişmez)
  if (url.hostname === "fonts.gstatic.com" || url.pathname.match(/\.(woff2?|ttf|eot)$/i)) {
    event.respondWith(cacheFirst(req, FONT_CACHE));
    return;
  }

  // Görseller: Cache First + WebP dönüşümü ipucu
  if (req.destination === "image" || url.pathname.match(/\.(webp|png|jpg|jpeg|gif|svg|ico)$/i)) {
    event.respondWith(cacheFirst(req, IMG_CACHE));
    return;
  }

  // CSS / JS: Stale-While-Revalidate
  if (req.destination === "style" || req.destination === "script") {
    event.respondWith(staleWhileRevalidate(req, STATIC_CACHE));
    return;
  }

  // HTML sayfaları: Network First + Offline fallback
  if (req.destination === "document") {
    event.respondWith(networkFirstWithFallback(req));
    return;
  }

  // Diğer: Dynamic cache
  event.respondWith(staleWhileRevalidate(req, DYNAMIC_CACHE));
});

// ── Strateji: Cache First ─────────────────────────────────────────────────────
async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  const fresh = await fetch(req);
  if (fresh.ok) {
    const cache = await caches.open(cacheName);
    cache.put(req, fresh.clone());
  }
  return fresh;
}

// ── Strateji: Stale While Revalidate ─────────────────────────────────────────
async function staleWhileRevalidate(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req).then((fresh) => {
    if (fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  }).catch(() => null);
  return cached || await fetchPromise || new Response("", { status: 408 });
}

// ── Strateji: Network First + Offline Fallback ────────────────────────────────
async function networkFirstWithFallback(req) {
  try {
    const fresh = await fetch(req, { signal: AbortSignal.timeout(4000) });
    if (fresh.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(req, fresh.clone());
    }
    return fresh;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    // Offline sayfasını döndür
    const offline = await caches.match("/offline.html");
    return offline || new Response("<h1>Çevrimdışısınız</h1>", {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

// ── AI Predictive Prefetch: Idle'da sık sayfaları ön yükle ───────────────────
async function idlePrefetchPages() {
  if ("requestIdleCallback" in self) {
    // SW içinde requestIdleCallback yok — setTimeout ile simüle et
  }
  await new Promise((r) => setTimeout(r, 3000)); // 3sn sonra başlat
  const cache = await caches.open(DYNAMIC_CACHE);
  for (const url of PREFETCH_PAGES) {
    try {
      const exists = await cache.match(url);
      if (!exists) {
        const res = await fetch(url, { priority: "low" });
        if (res.ok) await cache.put(url, res);
      }
    } catch {
      // sessiz hata
    }
  }
}

// ── PUSH Notification (gelecek kullanım için) ─────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "SH Danışmanlık", {
      body: data.body || "Yeni bildirim",
      icon: "/logo.webp",
      badge: "/logo.webp",
    })
  );
});

// ── BACKGROUND SYNC: Form gönderimi offline iken ─────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-form") {
    event.waitUntil(syncOfflineForms());
  }
});

async function syncOfflineForms() {
  // IndexedDB'den pending formları al ve gönder
  // (form-handler.js ile entegre)
}

// ── DELTA UPDATE: Sadece değişen dosyaları güncelle ──────────────────────────
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "DELTA_UPDATE") {
    const urls = event.data.urls || [];
    caches.open(STATIC_CACHE).then((cache) => {
      urls.forEach((url) => {
        fetch(url, { cache: "reload" }).then((res) => {
          if (res.ok) cache.put(url, res);
        });
      });
    });
  }
});
