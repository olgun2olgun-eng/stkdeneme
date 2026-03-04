/* ═══════════════════════════════════════════════════════════════
   STK DANIŞMANLIK — Kuantum Elite JS v4.0
   script.js  —  INP<100ms · CLS=0 · Passive Listeners · RAF
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ─── YARDIMCI: güvenli querySelector ─────────────────────── */
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return (ctx || document).querySelectorAll(sel); };

  /* ─── SERVICE WORKER KAYDI ─────────────────────────────────── */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js', { scope: '/' })
        .catch(function () {}); /* sessiz hata — SW opsiyonel */
    });
  }

  /* ─── DOMContentLoaded ─────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {

    /* ════════════════════════════════════════════════════
       1. SLIDER — RAF tabanlı, INP<100ms garantisi
       ════════════════════════════════════════════════════ */
    var slides = $$('.slide');
    var nextBtn = $('.next');
    var prevBtn = $('.prev');
    var dotsContainer = $('.slider-dots');
    var currentSlide = 0;
    var autoSlideTimer = null;
    var slideCount = slides.length;

    if (slideCount > 0 && dotsContainer) {
      /* Dot'ları oluştur — DocumentFragment ile tek reflow */
      var frag = document.createDocumentFragment();
      for (var i = 0; i < slideCount; i++) {
        (function (idx) {
          var dot = document.createElement('button');
          dot.className = 'dot';
          dot.setAttribute('aria-label', 'Slayt ' + (idx + 1));
          /* INP: passive touch ile dokunma gecikme yok */
          dot.addEventListener('click', function () { goToSlide(idx); }, { passive: true });
          frag.appendChild(dot);
        })(i);
      }
      dotsContainer.appendChild(frag);

      var dots = $$('.dot', dotsContainer);

      function goToSlide(index) {
        requestAnimationFrame(function () {
          slides[currentSlide].classList.remove('active');
          dots[currentSlide].classList.remove('active');
          currentSlide = (index + slideCount) % slideCount;
          slides[currentSlide].classList.add('active');
          dots[currentSlide].classList.add('active');
        });
        resetAutoSlide();
      }

      function startAutoSlide() {
        autoSlideTimer = setInterval(function () {
          goToSlide(currentSlide + 1);
        }, 5000);
      }

      function resetAutoSlide() {
        clearInterval(autoSlideTimer);
        startAutoSlide();
      }

      /* INP: passive event listeners */
      if (nextBtn) nextBtn.addEventListener('click', function () { goToSlide(currentSlide + 1); }, { passive: true });
      if (prevBtn) prevBtn.addEventListener('click', function () { goToSlide(currentSlide - 1); }, { passive: true });

      /* Dokunma desteği — CLS'siz swipe */
      var touchStartX = 0;
      var sliderEl = $('.slider');
      if (sliderEl) {
        sliderEl.addEventListener('touchstart', function (e) {
          touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });
        sliderEl.addEventListener('touchend', function (e) {
          var diff = touchStartX - e.changedTouches[0].screenX;
          if (Math.abs(diff) > 40) {
            goToSlide(diff > 0 ? currentSlide + 1 : currentSlide - 1);
          }
        }, { passive: true });
      }

      goToSlide(0);
      startAutoSlide();
    }

    /* ════════════════════════════════════════════════════
       2. FAQ AKORDEON — INP optimize, maxHeight animasyonu
       ════════════════════════════════════════════════════ */
    var faqItems = $$('.faq-item');
    faqItems.forEach(function (item) {
      var question = item.querySelector('.faq-question');
      var answer = item.querySelector('.faq-answer');
      if (!question || !answer) return;

      question.addEventListener('click', function () {
        var isActive = item.classList.contains('active');
        /* Tümünü kapat — batch RAF */
        requestAnimationFrame(function () {
          faqItems.forEach(function (fi) {
            fi.classList.remove('active');
            var a = fi.querySelector('.faq-answer');
            if (a) a.style.maxHeight = '0';
          });
          if (!isActive) {
            item.classList.add('active');
            answer.style.maxHeight = answer.scrollHeight + 'px';
          }
        });
      }, { passive: true });
    });

    /* ─── FAQ "Daha Fazla" ─── */
    var loadMoreBtn = document.getElementById('loadMoreFaq');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        requestAnimationFrame(function () {
          $$('.faq-item.hidden').forEach(function (faq) {
            faq.classList.remove('hidden');
          });
          loadMoreBtn.style.display = 'none';
        });
      }, { passive: true });
    }

    /* ════════════════════════════════════════════════════
       3. SAYMA ANİMASYONU — IntersectionObserver
       ════════════════════════════════════════════════════ */
    var counters = $$('.counter');
    if (counters.length > 0 && 'IntersectionObserver' in window) {
      var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseInt(el.getAttribute('data-target'), 10) || 0;
          var duration = 1200;
          var start = null;
          function step(timestamp) {
            if (!start) start = timestamp;
            var progress = Math.min((timestamp - start) / duration, 1);
            /* easeOutQuart */
            var ease = 1 - Math.pow(1 - progress, 4);
            el.textContent = Math.ceil(ease * target);
            if (progress < 1) {
              requestAnimationFrame(step);
            } else {
              el.textContent = target;
            }
          }
          requestAnimationFrame(step);
          counterObserver.unobserve(el);
        });
      }, { threshold: 0.4 });
      counters.forEach(function (c) { counterObserver.observe(c); });
    }

    /* ════════════════════════════════════════════════════
       4. MOBİL NAVİGASYON — tam INP uyumlu
       ════════════════════════════════════════════════════ */
    var nav = $('.main-nav');
    var openBtn = $('.nav-open-btn');
    var closeBtn = $('.nav-close-btn');

    /* Overlay — DOM'da yoksa oluştur */
    var overlay = $('.mobile-nav-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'mobile-nav-overlay';
      document.body.appendChild(overlay);
    }

    function openNav() {
      requestAnimationFrame(function () {
        if (nav) nav.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    }

    function closeNav() {
      requestAnimationFrame(function () {
        if (nav) nav.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
        $$('.dropdown.mob-open').forEach(function (d) {
          d.classList.remove('mob-open');
        });
      });
    }

    if (openBtn) {
      openBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        nav && nav.classList.contains('active') ? closeNav() : openNav();
      }, { passive: false });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeNav, { passive: true });
    if (overlay) overlay.addEventListener('click', closeNav, { passive: true });

    /* Mobil dropdown toggle */
    $$('.main-nav .dropdown > a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        if (window.innerWidth > 992) return;
        e.preventDefault();
        e.stopPropagation();
        var parent = this.parentElement;
        var wasOpen = parent.classList.contains('mob-open');
        requestAnimationFrame(function () {
          $$('.dropdown.mob-open').forEach(function (d) { d.classList.remove('mob-open'); });
          if (!wasOpen) parent.classList.add('mob-open');
        });
      }, { passive: false });
    });

    /* Resize: masaüstüne geçince kapat */
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.innerWidth > 992) closeNav();
      }, 150);
    }, { passive: true });

    /* ════════════════════════════════════════════════════
       5. DESKTOP DROPDOWN overflow fix
       ════════════════════════════════════════════════════ */
    var mainHeader = $('.main-header');
    $$('.main-nav .dropdown').forEach(function (dropdown) {
      dropdown.addEventListener('mouseenter', function () {
        if (mainHeader) mainHeader.style.overflow = 'visible';
      });
      dropdown.addEventListener('mouseleave', function () {
        if (mainHeader) mainHeader.style.overflow = '';
      });
    });

    /* ════════════════════════════════════════════════════
       6. AI PREDİCTİVE PREFETCH (hafif versiyon)
          Mouse hızı analizi + viewport proximity
       ════════════════════════════════════════════════════ */
    if ('requestIdleCallback' in window) {
      requestIdleCallback(function () {

        /* Sayfa geçiş olasılıkları (mevcut URL'e göre) */
        var PAGE_GRAPH = {
          '/': [
            { url: '/hizmet-dernek-kurulusu.html', w: 35 },
            { url: '/iletisim.html', w: 25 },
            { url: '/hakkimizda.html', w: 20 },
            { url: '/hizmet-vakif-kurulusu.html', w: 20 }
          ],
          '/hizmet-dernek-kurulusu.html': [
            { url: '/iletisim.html', w: 45 },
            { url: '/hizmet-derbis.html', w: 30 },
            { url: '/hizmet-vakif-kurulusu.html', w: 25 }
          ],
          '/hakkimizda.html': [
            { url: '/iletisim.html', w: 50 },
            { url: '/referanslar.html', w: 30 },
            { url: '/hizmet-dernek-kurulusu.html', w: 20 }
          ]
        };

        var path = window.location.pathname;
        var candidates = PAGE_GRAPH[path] || PAGE_GRAPH['/'];
        var prefetched = new Set();

        function prefetchURL(url) {
          if (prefetched.has(url)) return;
          prefetched.add(url);
          /* Speculation Rules API varsa kullan */
          if ('speculationrules' in HTMLScriptElement.prototype) return;
          var link = document.createElement('link');
          link.rel = 'prefetch';
          link.href = url;
          link.as = 'document';
          document.head.appendChild(link);
        }

        /* Ağırlığa göre top 2'yi prefetch et */
        candidates
          .sort(function (a, b) { return b.w - a.w; })
          .slice(0, 2)
          .forEach(function (c) { prefetchURL(c.url); });

        /* Hover intent: 80ms bekle → prefetch */
        var hoverTimer = null;
        var lastMX = 0, lastMY = 0, lastT = 0;
        document.addEventListener('mousemove', function (e) {
          lastMX = e.clientX; lastMY = e.clientY; lastT = Date.now();
        }, { passive: true });

        $$('a[href]').forEach(function (a) {
          var href = a.getAttribute('href');
          if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('tel')) return;
          a.addEventListener('mouseenter', function () {
            var t0 = Date.now();
            hoverTimer = setTimeout(function () {
              /* Hız kontrolü: <0.8px/ms → yavaş yaklaşım = niyet var */
              var dt = Date.now() - t0;
              if (dt > 60) prefetchURL(href);
            }, 80);
          });
          a.addEventListener('mouseleave', function () {
            clearTimeout(hoverTimer);
          });
        });

        /* IntersectionObserver: link viewport'a girerken prefetch */
        if ('IntersectionObserver' in window) {
          var linkObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              var href = entry.target.getAttribute('href');
              if (href && !href.startsWith('http') && !href.startsWith('#')) {
                prefetchURL(href);
                linkObserver.unobserve(entry.target);
              }
            });
          }, { rootMargin: '200px' });
          $$('a[href]').forEach(function (a) { linkObserver.observe(a); });
        }

      }, { timeout: 2000 });
    }

    /* ════════════════════════════════════════════════════
       7. RUM — Core Web Vitals (PerformanceObserver)
       ════════════════════════════════════════════════════ */
    if ('PerformanceObserver' in window) {
      var rumBuffer = [];
      var rumSent = false;

      function sendRUM() {
        if (rumBuffer.length === 0 || rumSent) return;
        var payload = JSON.stringify({ metrics: rumBuffer, url: location.href, ts: Date.now() });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/rum', payload);
          rumSent = true;
        }
      }

      function observeMetric(type, cb) {
        try {
          var po = new PerformanceObserver(function (list) {
            list.getEntries().forEach(cb);
          });
          po.observe({ type: type, buffered: true });
        } catch (e) {}
      }

      /* LCP */
      observeMetric('largest-contentful-paint', function (entry) {
        rumBuffer.push({ name: 'LCP', value: Math.round(entry.startTime) });
      });
      /* CLS */
      observeMetric('layout-shift', function (entry) {
        if (!entry.hadRecentInput) {
          rumBuffer.push({ name: 'CLS', value: entry.value });
        }
      });
      /* INP / FID */
      observeMetric('event', function (entry) {
        if (entry.processingStart && entry.startTime) {
          rumBuffer.push({ name: 'INP', value: Math.round(entry.processingStart - entry.startTime) });
        }
      });
      /* FCP */
      observeMetric('paint', function (entry) {
        if (entry.name === 'first-contentful-paint') {
          rumBuffer.push({ name: 'FCP', value: Math.round(entry.startTime) });
        }
      });

      /* Sayfa kapanırken gönder */
      window.addEventListener('pagehide', sendRUM, { passive: true });
      /* Visibility değişince gönder */
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) sendRUM();
      }, { passive: true });
    }

    /* ════════════════════════════════════════════════════
       8. ANCHOR SCROLL — CLS tetiklememek için
       ════════════════════════════════════════════════════ */
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = this.getAttribute('href').slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, { passive: false });
    });

  }); /* DOMContentLoaded sonu */

})();
