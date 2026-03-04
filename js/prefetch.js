// %0.01 Elit Seviye – Kuantum Katman | AI Predictive Prefetch Engine
// Mouse hız analizi · Scroll pattern · Hover intent · Speculation Rules fallback

(function () {
  "use strict";

  // ── Sayfa bağlantı haritası (olasılık ağırlıklı) ─────────────────────────
  const PAGE_GRAPH = {
    "/": [
      { url: "/hizmet-dernek-kurulusu.html", weight: 0.35 },
      { url: "/iletisim.html",               weight: 0.25 },
      { url: "/hakkimizda.html",             weight: 0.20 },
      { url: "/hizmet-vakif-kurulusu.html",  weight: 0.20 },
    ],
    "/hizmet-dernek-kurulusu.html": [
      { url: "/iletisim.html",               weight: 0.55 },
      { url: "/hizmet-derbis.html",          weight: 0.25 },
      { url: "/hizmet-genel-kurul.html",     weight: 0.20 },
    ],
    "/hizmet-vakif-kurulusu.html": [
      { url: "/iletisim.html",               weight: 0.60 },
      { url: "/hakkimizda.html",             weight: 0.40 },
    ],
    "/hakkimizda.html": [
      { url: "/iletisim.html",               weight: 0.60 },
      { url: "/referanslar.html",            weight: 0.40 },
    ],
    "/blog.html": [
      { url: "/blog-yazi-detay.html",                     weight: 0.40 },
      { url: "/blog-dernek-yonetici-sorumluluklari.html", weight: 0.35 },
      { url: "/blog-stk-iktisadi-isletme-avantajlari.html", weight: 0.25 },
    ],
  };

  const PREFETCH_THRESHOLD = 0.25; // %25 üzeri olasılıklı sayfaları prefetch et
  const HOVER_DELAY_MS     = 80;   // 80ms hover → prefetch tetikle
  const prefetched          = new Set();

  // ── Speculation Rules API varsa kullan (en hızlı yol) ────────────────────
  function injectSpeculationRules(urls) {
    if (!("HTMLScriptElement" in window)) return;
    // Tarayıcı desteği kontrolü
    const testScript = document.createElement("script");
    if (typeof testScript.supports !== "function") return;
    if (!HTMLScriptElement.supports("speculationrules")) return;

    const script = document.createElement("script");
    script.type = "speculationrules";
    script.textContent = JSON.stringify({
      prerender: [{ source: "list", urls: urls }],
    });
    document.head.appendChild(script);
  }

  // ── Klasik <link rel=prefetch> fallback ───────────────────────────────────
  function prefetchURL(url) {
    if (prefetched.has(url)) return;
    prefetched.add(url);

    // Önce Speculation Rules dene
    if (typeof HTMLScriptElement !== "undefined" &&
        HTMLScriptElement.supports &&
        HTMLScriptElement.supports("speculationrules")) {
      injectSpeculationRules([url]);
      return;
    }

    // Fallback: link prefetch
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    link.as = "document";
    document.head.appendChild(link);
  }

  // ── Mevcut sayfaya göre yüksek olasılıklı URL'leri prefetch et ───────────
  function prefetchByPageGraph() {
    const current = location.pathname;
    const neighbors = PAGE_GRAPH[current] || [];
    neighbors
      .filter((n) => n.weight >= PREFETCH_THRESHOLD)
      .forEach((n) => {
        // requestIdleCallback ile düşük öncelik
        if ("requestIdleCallback" in window) {
          requestIdleCallback(() => prefetchURL(n.url), { timeout: 2000 });
        } else {
          setTimeout(() => prefetchURL(n.url), 1500);
        }
      });
  }

  // ── Mouse hız analizi: Hızlı hareket → intent yok, yavaş yaklaşma → prefetch ─
  let lastMouseX = 0, lastMouseY = 0, lastMouseTime = 0;
  let mouseSpeed = 0;

  document.addEventListener("mousemove", (e) => {
    const now = performance.now();
    const dx = e.clientX - lastMouseX;
    const dy = e.clientY - lastMouseY;
    const dt = now - lastMouseTime || 1;
    mouseSpeed = Math.sqrt(dx * dx + dy * dy) / dt;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    lastMouseTime = now;
  }, { passive: true });

  // ── Hover Intent: Bağlantıya yavaş yaklaşma tespiti ──────────────────────
  function attachHoverIntent(el) {
    let timer = null;
    el.addEventListener("mouseenter", () => {
      // Yavaş hareket (speed < 0.8 px/ms) → gerçek intent
      timer = setTimeout(() => {
        if (mouseSpeed < 0.8) {
          const href = el.getAttribute("href");
          if (href && href.startsWith("/") && !prefetched.has(href)) {
            prefetchURL(href);
          }
        }
      }, HOVER_DELAY_MS);
    }, { passive: true });

    el.addEventListener("mouseleave", () => {
      clearTimeout(timer);
    }, { passive: true });
  }

  // ── Scroll Yakınlığı: Viewport'a yaklaşan linkleri prefetch et ───────────
  function observeLinksInViewport() {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const href = entry.target.getAttribute("href");
            if (href && href.startsWith("/") && !prefetched.has(href)) {
              requestIdleCallback
                ? requestIdleCallback(() => prefetchURL(href))
                : setTimeout(() => prefetchURL(href), 500);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "200px" } // viewport'a 200px kala tetikle
    );

    document.querySelectorAll("a[href^='/']").forEach((link) => {
      observer.observe(link);
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // 1. Sayfa grafiğine göre prefetch
    prefetchByPageGraph();

    // 2. Tüm iç linklere hover intent ekle
    document.querySelectorAll("a[href^='/']").forEach(attachHoverIntent);

    // 3. Scroll yakınlığı observer
    observeLinksInViewport();
  }

  // DOM hazır olduğunda başlat
  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init);
  }
})();
