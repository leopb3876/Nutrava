/* ==========================================================================
   Nutrava — Theme JavaScript
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Sticky Header Shadow (debounced) ---------- */
  const header = document.querySelector('[data-header]');
  if (header) {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          header.classList.toggle('header--scrolled', window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Mobile Menu Toggle ---------- */
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');

  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', !isOpen);
      mobileMenu.setAttribute('aria-hidden', isOpen);
      mobileMenu.classList.toggle('is-open', !isOpen);
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });

    // Close on link click
    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menuToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileMenu.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------- Smooth Scroll for Anchor Links ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------- Fade-in on Scroll ---------- */
  // Auto-apply fade-in to all major sections (skip hero to avoid LCP penalty)
  document.querySelectorAll('section, .section-padding, .section-padding--sm').forEach(el => {
    if (!el.hasAttribute('data-fade-in') && !el.closest('.header') && !el.closest('.footer') && !el.classList.contains('hero')) {
      el.setAttribute('data-fade-in', '');
    }
  });

  const fadeElements = document.querySelectorAll('[data-fade-in]');
  if (fadeElements.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );

    fadeElements.forEach((el) => observer.observe(el));
  }

  /* ---------- Count-Up Animation on Scroll ---------- */
  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function animateCountUp(el) {
    const raw = el.getAttribute('data-count-up');
    const suffix = raw.replace(/^[\d,.]+/, ''); // e.g. "+", "%"
    const prefix = raw.replace(/[\d,.]+.*$/, ''); // e.g. "" or "£"
    const numStr = raw.replace(/[^0-9.,]/g, '');
    const target = parseFloat(numStr.replace(/,/g, ''));
    const hasComma = numStr.includes(',');
    const hasDecimal = numStr.includes('.');
    const duration = 1800; // ms
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutExpo(progress);
      let current = eased * target;

      let display;
      if (hasComma) {
        display = Math.round(current).toLocaleString('en-GB');
      } else if (hasDecimal) {
        display = current.toFixed(1);
      } else {
        display = Math.round(current).toString();
      }

      el.textContent = prefix + display + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = raw; // ensure exact final value
      }
    }

    el.textContent = prefix + '0' + suffix;
    requestAnimationFrame(tick);
  }

  const countElements = document.querySelectorAll('[data-count-up]');
  if (countElements.length && 'IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCountUp(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3, rootMargin: '0px 0px -40px 0px' }
    );

    countElements.forEach((el) => countObserver.observe(el));
  }
  /* ---------- Search Modal ---------- */
  var toggles = document.querySelectorAll('[data-search-toggle]');
  var overlay = document.querySelector('.search-overlay');
  var modal = document.querySelector('.search-modal');
  var searchInput = document.querySelector('[data-search-input]');
  var closeBtn = document.querySelector('[data-search-close]');
  var results = document.querySelector('[data-search-results]');

  if (toggles.length && modal) {
    function openSearch() {
      overlay.classList.add('is-open');
      modal.classList.add('is-open');
      if (searchInput) { searchInput.value = ''; setTimeout(function(){ searchInput.focus(); }, 100); }
      if (results) results.classList.remove('has-results');
    }
    function closeSearch() {
      overlay.classList.remove('is-open');
      modal.classList.remove('is-open');
    }

    toggles.forEach(function(t) { t.addEventListener('click', openSearch); });
    if (overlay) overlay.addEventListener('click', closeSearch);
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeSearch();
    });

    /* Predictive search */
    if (searchInput && results) {
      var debounce;
      searchInput.addEventListener('input', function() {
        clearTimeout(debounce);
        debounce = setTimeout(function() {
          var q = searchInput.value.trim();
          if (!q) { results.classList.remove('has-results'); return; }
          fetch('/search/suggest.json?q=' + encodeURIComponent(q) + '&resources[type]=product&resources[limit]=6')
            .then(function(r) { if (!r.ok) throw new Error(r.statusText); return r.json(); })
            .then(function(data) {
              var products = data.resources && data.resources.results && data.resources.results.products || [];
              if (products.length === 0) {
                results.innerHTML = '<div class="search-result__empty">No products found</div>';
              } else {
                results.innerHTML = products.map(function(p) {
                  return '<a href="' + p.url + '" class="search-result"><strong>' + p.title + '</strong><span class="search-result__price">$' + (p.price / 100).toFixed(2) + '</span></a>';
                }).join('');
              }
              results.classList.add('has-results');
            })
            .catch(function() { results.classList.remove('has-results'); });
        }, 300);
      });
    }
  }
})();
