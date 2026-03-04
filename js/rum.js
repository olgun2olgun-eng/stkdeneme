// %0.01 Elit Seviye – Kuantum Katman | Custom RUM (Real User Monitoring)
// Sıfır üçüncü parti · Web Vitals · IndexedDB · Batch Send

(function () {
  "use strict";

  // ── Config ─────────────────────────────────────────────────────────────────
  const ENDPOINT = "/api/rum"; // Cloudflare Worker veya Netlify Function
  const BATCH_SIZE = 5;
  const FLUSH_INTERVAL = 10000; // 10sn
  const DB_NAME = "stk-rum";
  const DB_VERSION = 1;

  let queue = [];
  let db = null;

  // ── IndexedDB başlat ───────────────────────────────────────────────────────
  function initDB() {
    if (!window.indexedDB) return;
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains("metrics")) {
        d.createObjectStore("metrics", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = (e) => {
      db = e.target.result;
      // Daha önce bekleyen metrikleri flush et
      flushFromDB();
    };
  }

  // ── Metric kaydet ──────────────────────────────────────────────────────────
  function record(name, value, extra) {
    const metric = {
      name,
      value: Math.round(value * 10) / 10,
      url: location.pathname,
      ts: Date.now(),
      conn: navigator.connection
        ? navigator.connection.effectiveType
        : "unknown",
      ...extra,
    };
    queue.push(metric);
    if (queue.length >= BATCH_SIZE) flush();
  }

  // ── Batch gönder ──────────────────────────────────────────────────────────
  function flush() {
    if (!queue.length) return;
    const payload = queue.splice(0, BATCH_SIZE);

    // navigator.sendBeacon tercih et (sayfa kapatılırken kayıp olmaz)
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      const sent = navigator.sendBeacon(ENDPOINT, blob);
      if (!sent && db) saveToDB(payload); // Beacon başarısız → IndexedDB
    } else {
      // Fallback: fetch with keepalive
      fetch(ENDPOINT, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        keepalive: true,
      }).catch(() => { if (db) saveToDB(payload); });
    }
  }

  function saveToDB(metrics) {
    if (!db) return;
    const tx = db.transaction("metrics", "readwrite");
    const store = tx.objectStore("metrics");
    metrics.forEach((m) => store.add(m));
  }

  function flushFromDB() {
    if (!db) return;
    const tx = db.transaction("metrics", "readwrite");
    const store = tx.objectStore("metrics");
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result;
      if (!all.length) return;
      const blob = new Blob([JSON.stringify(all)], { type: "application/json" });
      if (navigator.sendBeacon(ENDPOINT, blob)) {
        store.clear();
      }
    };
  }

  // ── Core Web Vitals ────────────────────────────────────────────────────────

  // LCP
  if ("PerformanceObserver" in window) {
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        record("LCP", last.startTime, { el: last.element ? last.element.tagName : "" });
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {}

    // CLS
    try {
      let clsValue = 0;
      let clsEntries = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            clsEntries.push(entry);
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
      // Sayfa kapanırken CLS gönder
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden") {
          record("CLS", clsValue * 1000); // binde × 1000
          flush();
        }
      });
    } catch {}

    // INP (Interaction to Next Paint)
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.interactionId) {
            record("INP", entry.duration, { type: entry.name });
          }
        }
      }).observe({ type: "event", buffered: true, durationThreshold: 16 });
    } catch {}

    // FID
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          record("FID", entry.processingStart - entry.startTime);
        }
      }).observe({ type: "first-input", buffered: true });
    } catch {}

    // FCP
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === "first-contentful-paint") {
            record("FCP", entry.startTime);
          }
        }
      }).observe({ type: "paint", buffered: true });
    } catch {}

    // TTFB
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "navigation") {
            record("TTFB", entry.responseStart - entry.requestStart);
          }
        }
      }).observe({ type: "navigation", buffered: true });
    } catch {}
  }

  // ── Kullanıcı Etkileşim Bütçesi (INP için pasif dinleyiciler) ─────────────
  ["click", "keydown", "pointerdown"].forEach((type) => {
    document.addEventListener(type, () => {}, { passive: true, capture: true });
  });

  // ── Periyodik flush ───────────────────────────────────────────────────────
  setInterval(flush, FLUSH_INTERVAL);

  // ── Sayfa kapatılırken son flush ──────────────────────────────────────────
  window.addEventListener("pagehide", flush);

  // ── Service Worker kayıt ─────────────────────────────────────────────────
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((reg) => {
          // Delta update kontrolü
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                // Kullanıcıya sessiz güncelleme
                newWorker.postMessage("SKIP_WAITING");
              }
            });
          });
        })
        .catch(() => {});
    });
  }

  // Başlat
  initDB();
})();
