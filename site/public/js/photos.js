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
  let horizontalWheelDelta = 0;
  let horizontalWheelLocked = false;
  let horizontalWheelTimer = null;
  let lightboxHideTimer = null;
  let previousBodyOverflow = '';
  const backgroundAriaState = new Map();

  function setBackgroundInert(enabled) {
    if (!lightbox) return;
    Array.from(document.body.children).forEach((element) => {
      if (element === lightbox || element.tagName === 'SCRIPT') return;
      if (enabled) {
        if (!backgroundAriaState.has(element)) {
          backgroundAriaState.set(element, {
            ariaHidden: element.getAttribute('aria-hidden'),
            inert: element.hasAttribute('inert'),
          });
        }
        element.setAttribute('inert', '');
        element.setAttribute('aria-hidden', 'true');
      } else if (backgroundAriaState.has(element)) {
        const previous = backgroundAriaState.get(element);
        if (previous.inert) element.setAttribute('inert', '');
        else element.removeAttribute('inert');
        if (previous.ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', previous.ariaHidden);
        backgroundAriaState.delete(element);
      }
    });
  }

  function initGallery() {
    galleryItems = Array.from(document.querySelectorAll('.gallery-item:not(.gallery-placeholder)'));
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

  function openLightbox(idx) {
    if (!lightbox || !lightboxImg || !galleryItems[idx]) return;
    const wasOpen = lightbox.classList.contains('active');
    if (lightboxHideTimer) {
      clearTimeout(lightboxHideTimer);
      lightboxHideTimer = null;
    }
    currentIndex = idx;
    // Arrow navigation reuses this function. Preserve the gallery trigger so
    // closing the dialog never restores focus to a now-hidden lightbox button.
    if (!wasOpen) lastFocused = document.activeElement;
    const item = galleryItems[idx];
    const title = item.getAttribute('data-title') || '';
    const series = item.getAttribute('data-series') || '';
    // Lightbox shows the full-resolution image (data-full), not the grid thumbnail.
    const full = item.getAttribute('data-full');

    if (full) lightboxImg.src = full;
    lightboxImg.alt = title || 'Photo';
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCounter) {
      lightboxCounter.textContent = (idx + 1) + ' / ' + galleryItems.length + (series ? '  ·  ' + series : '');
    }

    if (!wasOpen) {
      previousBodyOverflow = document.body.style.overflow;
      setBackgroundInert(true);
    }
    document.body.style.overflow = 'hidden';
    if (lightbox) {
      lightbox.hidden = false;
      lightbox.removeAttribute('inert');
      lightbox.getBoundingClientRect();
      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      const closeBtn = lightbox.querySelector('.lightbox-close');
      if (closeBtn) closeBtn.focus();
    }

    // Preload adjacent images for smooth navigation
    preloadAdjacent(idx);
  }

  // Preload next + prev FULL images so arrow-key / click navigation has no blank flash
  function preloadAdjacent(idx) {
    [idx + 1, idx - 1].forEach(function (i) {
      if (i >= 0 && i < galleryItems.length) {
        var full = galleryItems[i].getAttribute('data-full');
        if (full) {
          var pre = new Image();
          pre.src = full;
        }
      }
    });
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.setAttribute('inert', '');
    document.body.style.overflow = previousBodyOverflow;
    setBackgroundInert(false);
    currentIndex = -1;
    horizontalWheelDelta = 0;
    horizontalWheelLocked = false;
    if (horizontalWheelTimer) clearTimeout(horizontalWheelTimer);
    // Restore focus
    const focusTarget = lastFocused;
    lastFocused = null;
    if (focusTarget && typeof focusTarget.focus === 'function') {
      focusTarget.focus();
    }
    lightboxHideTimer = setTimeout(() => {
      if (lightbox.classList.contains('active')) return;
      lightbox.hidden = true;
      if (lightboxImg) {
        lightboxImg.removeAttribute('src');
        lightboxImg.alt = '';
      }
      lightboxHideTimer = null;
    }, 360);
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

  // Trackpad horizontal gestures behave like a carousel. Momentum wheel
  // events stay locked until the gesture settles, so one swipe advances once.
  function handleHorizontalWheel(e) {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || Math.abs(e.deltaX) < 2) return;

    e.preventDefault();
    if (horizontalWheelTimer) clearTimeout(horizontalWheelTimer);
    horizontalWheelTimer = setTimeout(() => {
      horizontalWheelDelta = 0;
      horizontalWheelLocked = false;
    }, 220);

    if (horizontalWheelLocked) return;
    const deltaScale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerWidth : 1;
    horizontalWheelDelta += e.deltaX * deltaScale;
    if (Math.abs(horizontalWheelDelta) < 44) return;

    horizontalWheelLocked = true;
    if (horizontalWheelDelta > 0) goNext();
    else goPrev();
    horizontalWheelDelta = 0;
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

    // Click anywhere outside the image, caption, or controls to close. The
    // content wrapper includes the visible blank area around portrait photos.
    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (!e.target.closest('#lightboxImg, .lightbox-info, .lightbox-close, .lightbox-prev, .lightbox-next')) {
          closeLightbox();
        }
      });
      lightbox.addEventListener('wheel', handleHorizontalWheel, { passive: false });
    }
  });

})();
