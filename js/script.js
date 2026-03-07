/* ═══════════════════════════════════════════════════
   STK DANIŞMANLIK — Ana JS  (Ako Dijital)
   script.js  —  Slider · SSS · Counter · Nav
   ═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {

    /* ─── SLIDER ─── */
    var slides = document.querySelectorAll('.slide');
    var nextBtn = document.querySelector('.next');
    var prevBtn = document.querySelector('.prev');
    var dotsContainer = document.querySelector('.slider-dots');
    var currentSlide = 0;
    var autoSlideInterval;

    if (slides.length > 0 && dotsContainer) {
        slides.forEach(function(_, i) {
            var dot = document.createElement('div');
            dot.classList.add('dot');
            dot.addEventListener('click', function() { goToSlide(i); });
            dotsContainer.appendChild(dot);
        });
        var dots = document.querySelectorAll('.dot');

        function goToSlide(index) {
            slides.forEach(function(s) { s.classList.remove('active'); });
            dots.forEach(function(d) { d.classList.remove('active'); });
            currentSlide = index;
            slides[currentSlide].classList.add('active');
            dots[currentSlide].classList.add('active');
            resetAutoSlide();
        }
        if (nextBtn) nextBtn.addEventListener('click', function() { goToSlide((currentSlide + 1) % slides.length); });
        if (prevBtn) prevBtn.addEventListener('click', function() { goToSlide((currentSlide - 1 + slides.length) % slides.length); });

        function startAutoSlide() { autoSlideInterval = setInterval(function() { goToSlide((currentSlide + 1) % slides.length); }, 5000); }
        function resetAutoSlide() { clearInterval(autoSlideInterval); startAutoSlide(); }
        goToSlide(0);
        startAutoSlide();
    }

    /* ─── SSS AKORDEON ─── */
    var faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function(item) {
        var question = item.querySelector('.faq-question');
        var answer = item.querySelector('.faq-answer');
        if (question && answer) {
            question.addEventListener('click', function() {
                var isActive = item.classList.contains('active');
                faqItems.forEach(function(i) {
                    i.classList.remove('active');
                    var a = i.querySelector('.faq-answer');
                    if (a) a.style.maxHeight = '0';
                });
                if (!isActive) {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + 'px';
                }
            });
        }
    });

    /* ─── SSS "DAHA FAZLA" ─── */
    var loadMoreBtn = document.getElementById('loadMoreFaq');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            document.querySelectorAll('.faq-item.hidden').forEach(function(faq) {
                faq.classList.remove('hidden');
                faq.style.display = 'block';
                faq.style.opacity = '0';
                requestAnimationFrame(function() { faq.style.opacity = '1'; });
            });
            loadMoreBtn.style.display = 'none';
        });
    }

    /* ─── SAYMA ANİMASYONU ─── */
    var counters = document.querySelectorAll('.counter');
    if (counters.length > 0) {
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    var counter = entry.target;
                    var target = +counter.getAttribute('data-target');
                    var speed = 200;
                    var inc = target / speed;
                    var count = 0;
                    var updateCount = function() {
                        count += inc;
                        if (count < target) {
                            counter.innerText = Math.ceil(count);
                            requestAnimationFrame(updateCount);
                        } else {
                            counter.innerText = target;
                        }
                    };
                    updateCount();
                    observer.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });
        counters.forEach(function(c) { observer.observe(c); });
    }

    /* ─── DESKTOP DROPDOWN HOVER OVERFLOW ─── */
    var mainHeader = document.querySelector('.main-header');
    document.querySelectorAll('.main-nav .dropdown').forEach(function(dropdown) {
        dropdown.addEventListener('mouseenter', function() { if (mainHeader) mainHeader.style.overflow = "visible"; });
        dropdown.addEventListener('mouseleave', function() { if (mainHeader) mainHeader.style.overflow = ""; });
    });

    /* ═══════════════════════════════════════════════
       MOBİL NAVİGASYON  (hamburger + dropdown)
       ═══════════════════════════════════════════════ */
    var nav = document.querySelector('.main-nav');
    var openBtn = document.querySelector('.nav-open-btn');
    var closeBtn = document.querySelector('.nav-close-btn');

    // Overlay yoksa oluştur
    var overlay = document.querySelector('.mobile-nav-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';
        document.body.appendChild(overlay);
    }

    function openNav() {
        if (nav) nav.classList.add('active');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        if (nav) nav.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
        document.querySelectorAll('.dropdown.mob-open').forEach(function(d) {
            d.classList.remove('mob-open');
        });
    }

    if (openBtn) {
        openBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (nav && nav.classList.contains('active')) { closeNav(); } else { openNav(); }
        });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeNav);
    if (overlay) overlay.addEventListener('click', closeNav);

    /* ─── MOBİL DROPDOWN TOGGLE (mob-open) ─── */
    document.querySelectorAll('.main-nav .dropdown > a').forEach(function(link) {
        link.addEventListener('click', function(e) {
            if (window.innerWidth <= 992) {
                e.preventDefault();
                e.stopPropagation();
                var parent = this.parentElement;
                var wasOpen = parent.classList.contains('mob-open');
                // Tüm açık dropdown'ları kapat
                document.querySelectorAll('.dropdown.mob-open').forEach(function(d) {
                    d.classList.remove('mob-open');
                });
                // Tıklananı aç (kapalıysa)
                if (!wasOpen) {
                    parent.classList.add('mob-open');
                }
            }
        });
    });

    /* ─── RESİZE: masaüstüne geçince kapat ─── */
    window.addEventListener('resize', function() {
        if (window.innerWidth > 992) closeNav();
    });

});