/* ═══════════════════════════════════════════════════
   STK DANIŞMANLIK — Ana JS  (Ako Dijital)
   script.js  —  Slider · SSS · Counter · Nav
   ═══════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function() {

    /* ─── SLIDER ─── */
    var slides = document.querySelectorAll('.slide');
    var nextBtn = document.querySelector('.next, .slider-btn.next');
    var prevBtn = document.querySelector('.prev, .slider-btn.prev');
    var dotsContainer = document.querySelector('.slider-dots');
    var currentSlide = 0;
    var autoSlideInterval;

    if (slides.length > 0 && dotsContainer && dotsContainer.children.length === 0) {
        slides.forEach(function(_, i) {
            var dot = document.createElement('button');
            dot.className = 'dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Slayt ' + (i + 1));
            dot.setAttribute('type', 'button');
            dot.addEventListener('click', function() { goToSlide(i); });
            dotsContainer.appendChild(dot);
        });
    }

    var dots = document.querySelectorAll('.dot');

    function goToSlide(index) {
        if (slides.length === 0) return;
        slides.forEach(function(s) { s.classList.remove('active'); });
        dots.forEach(function(d) { d.classList.remove('active'); });
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
        if (dots[currentSlide]) dots[currentSlide].classList.add('active');
        resetAutoSlide();
    }

    if (nextBtn) nextBtn.addEventListener('click', function() { goToSlide(currentSlide + 1); });
    if (prevBtn) prevBtn.addEventListener('click', function() { goToSlide(currentSlide - 1); });

    function startAutoSlide() { 
        if (slides.length > 1) {
            autoSlideInterval = setInterval(function() { goToSlide(currentSlide + 1); }, 5000); 
        }
    }
    function resetAutoSlide() { clearInterval(autoSlideInterval); startAutoSlide(); }
    
    if (slides.length > 0) {
        startAutoSlide();
        var slider = document.querySelector('.slider');
        if (slider) {
            slider.addEventListener('mouseenter', function() { clearInterval(autoSlideInterval); });
            slider.addEventListener('mouseleave', function() { startAutoSlide(); });
        }
    }

    /* ─── SSS AKORDEON ─── */
    document.querySelectorAll('.faq-item').forEach(function(item) {
        var question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function() {
                var isActive = item.classList.contains('active') || item.classList.contains('open');
                // Close all
                document.querySelectorAll('.faq-item').forEach(function(i) {
                    i.classList.remove('active', 'open');
                    var a = i.querySelector('.faq-answer');
                    if (a) a.style.maxHeight = '0';
                });
                // Open clicked if wasn't active
                if (!isActive) {
                    item.classList.add('active', 'open');
                    var answer = item.querySelector('.faq-answer');
                    if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
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
                    var target = parseInt(counter.getAttribute('data-target'));
                    var start = 0;
                    var step = target / 60;
                    var timer = setInterval(function() {
                        start += step;
                        if (start >= target) { start = target; clearInterval(timer); }
                        counter.textContent = Math.floor(start).toLocaleString();
                    }, 16);
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
       Tüm sayfalarla uyumlu: hem ID hem class selector
       ═══════════════════════════════════════════════ */
    var nav = document.querySelector('#mainNav') || document.querySelector('.main-nav');
    var openBtn = document.querySelector('#navOpenBtn') || document.querySelector('.nav-open-btn');
    var closeBtn = document.querySelector('#navCloseBtn') || document.querySelector('.nav-close-btn');
    var overlay = document.querySelector('#navOverlay') || document.querySelector('#mobileNavOverlay') || document.querySelector('.mobile-nav-overlay');

    // Overlay yoksa oluştur
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'mobile-nav-overlay';
        overlay.id = 'navOverlay';
        document.body.appendChild(overlay);
    }

    function openNav() {
        if (nav) nav.classList.add('active');
        if (overlay) overlay.classList.add('active');
        if (closeBtn) closeBtn.classList.add('mobile-show');
        document.body.style.overflow = 'hidden';
    }

    function closeNav() {
        if (nav) nav.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (closeBtn) closeBtn.classList.remove('mobile-show');
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
                document.querySelectorAll('.dropdown.mob-open').forEach(function(d) {
                    d.classList.remove('mob-open');
                });
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

    /* ─── CONTACT FORM HANDLER ─── */
    var form = document.querySelector('.contact-form');
    if (form && !form.getAttribute('action')) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('Teşekkürler! Mesajınız alındı. En kısa sürede size ulaşacağız.');
            form.reset();
        });
    }

});
