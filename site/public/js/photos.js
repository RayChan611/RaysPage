/* ============================================
   Photos Page - Series Gallery + Lightbox
   With keyboard navigation + focus trap (a11y)
   ============================================ */

(function () {
  'use strict';

  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCounter = document.getElementById('lightboxCounter');
  const lightboxTitle = document.getElementById('lightboxTitle');
  let currentIndex = -1;
  let galleryItems = [];
  let lastFocused = null;

  const MAX_RETRY = 20; // max retries for initGallery

  function initGallery() {
    // Retry until photos-data.js has rendered gallery items
    function tryInit(retryCount) {
      retryCount = retryCount || 0;
      galleryItems = Array.from(document.querySelectorAll('.gallery-item:not(.gallery-placeholder)'));
      if (!galleryItems.length) {
        if (retryCount < MAX_RETRY) {
          setTimeout(() => tryInit(retryCount + 1), 50);
        }
        return;
      }
      galleryItems.forEach((item, idx) => {
        item.addEventListener('click', () => openLightbox(idx));
        // 键盘支持：Enter / Space 触发
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openLightbox(idx);
          }
        });
      });
    }
    setTimeout(tryInit, 50);
  }

  function openLightbox(idx) {
    if (!lightbox || !lightboxImg || !galleryItems[idx]) return;
    currentIndex = idx;
    lastFocused = document.activeElement;
    const item = galleryItems[idx];
    const img = item.querySelector('img');
    const title = item.getAttribute('data-title') || '';
    const series = item.getAttribute('data-series') || '';

    if (img) lightboxImg.src = img.src;
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCounter) {
      lightboxCounter.textContent = (idx + 1) + ' / ' + galleryItems.length + (series ? '  ·  ' + series : '');
    }

    document.body.style.overflow = 'hidden';
    if (lightbox) {
      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      const closeBtn = lightbox.querySelector('.lightbox-close');
      if (closeBtn) closeBtn.focus();
    }

    // Preload adjacent images for smooth navigation
    preloadAdjacent(idx);
  }

  // Preload next + prev images so arrow-key / click navigation has no blank flash
  function preloadAdjacent(idx) {
    [idx + 1, idx - 1].forEach(function (i) {
      if (i >= 0 && i < galleryItems.length) {
        var img = galleryItems[i].querySelector('img');
        if (img && img.src) {
          var pre = new Image();
          pre.src = img.src;
        }
      }
    });
  }

  function closeLightbox() {
    if (lightbox) {
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    if (lightboxImg) lightboxImg.src = '';
    currentIndex = -1;
    // Restore focus
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function goNext() {
    if (galleryItems.length === 0) return;
    const next = currentIndex < galleryItems.length - 1 ? currentIndex + 1 : 0;
    openLightbox(next);
  }

  function goPrev() {
    if (galleryItems.length === 0) return;
    const prev = currentIndex > 0 ? currentIndex - 1 : galleryItems.length - 1;
    openLightbox(prev);
  }

  // ---- Focus trap inside lightbox ----
  function trapFocus(e) {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    const focusable = lightbox.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  // ---- Series nav: smooth scroll + active highlight ----
  function initSeriesNav() {
    const navLinks = document.querySelectorAll('.series-nav-link');
    const sections = document.querySelectorAll('.series-section');

    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('data-target');
        const target = document.getElementById(targetId);
        if (!target) return;
        if (window.lenis && typeof window.lenis.scrollTo === 'function') {
          window.lenis.scrollTo(target, { offset: -100 });
        } else {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    if ('IntersectionObserver' in window && sections.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(l => {
              l.classList.toggle('active', l.getAttribute('data-target') === id);
            });
          }
        });
      }, { rootMargin: '-40% 0px -50% 0px' });
      sections.forEach(s => observer.observe(s));
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initGallery();
    initSeriesNav();

    var closeBtn = document.querySelector('.lightbox-close');
    var prevBtn = document.querySelector('.lightbox-prev');
    var nextBtn = document.querySelector('.lightbox-next');

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    if (nextBtn) nextBtn.addEventListener('click', goNext);

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (!lightbox || !lightbox.classList.contains('active')) return;
      switch(e.key) {
        case 'Escape': closeLightbox(); break;
        case 'ArrowRight': goNext(); break;
        case 'ArrowLeft': goPrev(); break;
      }
    });

    // Focus trap
    document.addEventListener('keydown', trapFocus);

    // Click backdrop to close
    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
      });
    }
  });

})();
