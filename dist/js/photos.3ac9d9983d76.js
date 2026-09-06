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
  const lightboxStatus = document.getElementById('lightboxStatus');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let currentIndex = -1;
  let galleryItems = [];
  let lastFocused = null;
  let horizontalWheelDelta = 0;
  let horizontalWheelLocked = false;
  let horizontalWheelTimer = null;
  let lightboxHideTimer = null;
  let previousBodyOverflow = '';
  let imageRequest = 0;
  let imageAnimation = null;
  let touchGesture = null;
  let suppressClickUntil = 0;
  let previousLenisState = null;
  const backgroundAriaState = new Map();

  function cancelImageAnimation() {
    if (imageAnimation) imageAnimation.cancel();
    imageAnimation = null;
  }

  function animateImage(frames, duration) {
    cancelImageAnimation();
    if (reducedMotion.matches || !lightboxImg || typeof lightboxImg.animate !== 'function') return;
    imageAnimation = lightboxImg.animate(frames, {
      duration,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });
  }

  // 用已显示的缩略图建立连续构图，大图到达后再替换；失败时保留可读画面。
  function loadLightboxImage(item) {
    if (!lightboxImg) return;
    const request = ++imageRequest;
    const preview = item.querySelector('img');
    const source = lightboxSource(item);
    const thumbnail = preview && (preview.currentSrc || preview.src);
    lightboxImg.width = Number(item.dataset.width) || 800;
    lightboxImg.height = Number(item.dataset.height) || 1200;
    if (thumbnail) lightboxImg.src = thumbnail;
    if (lightboxStatus) lightboxStatus.textContent = '';
    if (!source) return;
    const loader = new Image();
    loader.onload = () => {
      if (request !== imageRequest || !lightbox.classList.contains('active')) return;
      lightboxImg.src = source;
    };
    loader.onerror = () => {
      if (request !== imageRequest || !lightbox.classList.contains('active')) return;
      if (lightboxStatus) lightboxStatus.textContent = thumbnail
        ? '大图暂时无法加载，已保留预览图。'
        : '照片暂时无法加载，请稍后重试。';
    };
    loader.src = source;
  }

  function photoTransform(from, to) {
    return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${from.height / to.height})`;
  }

  function networkPrefersLessData() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    return Boolean(
      window.__reducedData ||
      (connection && connection.saveData) ||
      (connection && /^(slow-2g|2g|3g)$/.test(connection.effectiveType || ''))
    );
  }

  function useMediumLightboxAsset() {
    return networkPrefersLessData() || window.innerWidth <= 768 || Boolean(
      (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches) ||
      navigator.maxTouchPoints > 0
    );
  }

  function lightboxSource(item) {
    const full = item.getAttribute('data-full');
    const medium = item.getAttribute('data-medium');
    return useMediumLightboxAsset() && medium ? medium : full;
  }

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

  function openLightbox(idx, direction = 0) {
    if (!lightbox || !lightboxImg || !galleryItems[idx]) return;
    const wasOpen = lightbox.classList.contains('active');
    if (lightboxHideTimer) {
      clearTimeout(lightboxHideTimer);
      lightboxHideTimer = null;
    }
    currentIndex = idx;
    cancelImageAnimation();
    resetTouchGesture();
    // 切换照片时不覆盖初始触发器，避免焦点返回已经隐藏的灯箱按钮。
    if (!wasOpen) lastFocused = document.activeElement;
    const item = galleryItems[idx];
    const thumbnail = item.querySelector('img');
    const origin = thumbnail && thumbnail.getBoundingClientRect();
    const title = item.getAttribute('data-title') || '';
    const alt = item.getAttribute('data-alt') || title || '照片';
    const series = item.getAttribute('data-series') || '';
    loadLightboxImage(item);
    lightboxImg.alt = alt;
    if (lightboxTitle) lightboxTitle.textContent = title;
    if (lightboxCounter) {
      lightboxCounter.textContent = (idx + 1) + ' / ' + galleryItems.length + (series ? '  ·  ' + series : '');
    }

    if (!wasOpen) {
      previousBodyOverflow = document.body.style.overflow;
      // overflow:hidden 不能停止滚动库的插值，打开时一并冻结尚未结束的惯性。
      const smoothScroll = window.lenis;
      if (smoothScroll && typeof smoothScroll.stop === 'function') {
        previousLenisState = { instance: smoothScroll, stopped: smoothScroll.isStopped };
        smoothScroll.stop();
      }
      setBackgroundInert(true);
    }
    document.body.style.overflow = 'hidden';
    if (lightbox) {
      lightbox.hidden = false;
      lightbox.removeAttribute('inert');
      lightbox.getBoundingClientRect();
      lightbox.classList.add('active');
      syncZoomState();
      lightbox.setAttribute('aria-hidden', 'false');
      const closeBtn = lightbox.querySelector('.lightbox-close');
      if (!wasOpen && closeBtn) closeBtn.focus({ preventScroll: true });
    }
    const destination = lightboxImg.getBoundingClientRect();
    if (!wasOpen && origin && origin.width && destination.width && destination.height) {
      animateImage([
        { transform: photoTransform(origin, destination), transformOrigin: 'top left' },
        { transform: 'none', transformOrigin: 'top left' },
      ], 440);
    } else if (wasOpen && direction) {
      animateImage([
        { transform: `translateX(${direction * 38}px)`, opacity: 0.45 },
        { transform: 'none', opacity: 1 },
      ], 280);
    }

    // 只有网络条件允许时预取相邻照片。
    preloadAdjacent(idx);
  }

  // 只在网络条件允许时预取相邻照片。手机使用可用的中尺寸版本；
  // Save-Data、2G 与 3G 用户完全跳过相邻预取。
  function preloadAdjacent(idx) {
    if (networkPrefersLessData()) return;
    [idx + 1, idx - 1].forEach(function (i) {
      if (i >= 0 && i < galleryItems.length) {
        var source = lightboxSource(galleryItems[i]);
        if (source) {
          var pre = new Image();
          pre.src = source;
        }
      }
    });
  }

  function closeLightbox() {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    ++imageRequest;
    cancelImageAnimation();
    resetTouchGesture();
    const returnItem = galleryItems[currentIndex];
    const returnImage = returnItem && returnItem.querySelector('img');
    const start = lightboxImg && lightboxImg.getBoundingClientRect();
    lightbox.classList.remove('active', 'is-zoomed');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.setAttribute('inert', '');
    document.body.style.overflow = previousBodyOverflow;
    setBackgroundInert(false);
    // 看过其他照片后回到当前照片；仍是原图时保留原有滚动位置。
    if (returnImage) {
      const bounds = returnImage.getBoundingClientRect();
      const stickyNav = document.getElementById('seriesNav');
      const visibleTop = stickyNav ? stickyNav.getBoundingClientRect().bottom : 80;
      if (bounds.bottom <= visibleTop || bounds.top >= window.innerHeight) {
        returnItem.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
      const destination = returnImage.getBoundingClientRect();
      if (start && start.width && start.height && destination.width && destination.height) {
        animateImage([
          { transform: 'none', transformOrigin: 'top left' },
          { transform: photoTransform(destination, start), transformOrigin: 'top left' },
        ], 320);
      }
    }
    currentIndex = -1;
    horizontalWheelDelta = 0;
    horizontalWheelLocked = false;
    if (horizontalWheelTimer) clearTimeout(horizontalWheelTimer);
    if (previousLenisState) {
      const { instance, stopped } = previousLenisState;
      // 返回其他照片时先同步实际位置，避免恢复运行后被打开前的旧目标拉走。
      instance.scrollTo(window.scrollY, { immediate: true, force: true });
      if (!stopped) instance.start();
      previousLenisState = null;
    }
    const focusTarget = returnItem || lastFocused;
    lastFocused = null;
    if (focusTarget && typeof focusTarget.focus === 'function') {
      focusTarget.focus({ preventScroll: true });
    }
    lightboxHideTimer = setTimeout(() => {
      if (lightbox.classList.contains('active')) return;
      lightbox.hidden = true;
      cancelImageAnimation();
      if (lightboxImg) {
        lightboxImg.removeAttribute('src');
        lightboxImg.alt = '';
      }
      lightboxHideTimer = null;
    }, reducedMotion.matches ? 0 : 360);
  }

  function goNext() {
    if (galleryItems.length === 0) return;
    const next = currentIndex < galleryItems.length - 1 ? currentIndex + 1 : 0;
    openLightbox(next, 1);
  }

  function goPrev() {
    if (galleryItems.length === 0) return;
    const prev = currentIndex > 0 ? currentIndex - 1 : galleryItems.length - 1;
    openLightbox(prev, -1);
  }

  function resetTouchGesture() {
    touchGesture = null;
    if (lightbox) lightbox.classList.remove('is-dragging');
    if (lightboxImg) {
      lightboxImg.style.removeProperty('transform');
      lightboxImg.style.removeProperty('opacity');
    }
  }

  function syncZoomState() {
    if (!lightbox) return;
    const zoomed = Boolean(window.visualViewport && window.visualViewport.scale > 1.05);
    lightbox.classList.toggle('is-zoomed', zoomed && lightbox.classList.contains('active'));
    if (zoomed) resetTouchGesture();
  }

  function keepBackgroundStill() {
    // 全站动画管理器回到可见标签时会恢复 Lenis；灯箱仍打开则继续保持暂停。
    if (!document.hidden && lightbox && lightbox.classList.contains('active') && previousLenisState) {
      previousLenisState.instance.stop();
    }
  }

  function handleTouchStart(event) {
    if (!lightbox.classList.contains('active')) return;
    // 双指与放大后的单指交给浏览器，保留原生缩放及缩放后的平移。
    if (event.touches.length !== 1 || (window.visualViewport && window.visualViewport.scale > 1.05)) {
      resetTouchGesture();
      suppressClickUntil = Date.now() + 450;
      return;
    }
    if (!event.target.closest('#lightboxImg')) return;
    cancelImageAnimation();
    const touch = event.touches[0];
    touchGesture = { x: touch.clientX, y: touch.clientY, dx: 0, started: performance.now(), axis: null };
  }

  function handleTouchMove(event) {
    if (!touchGesture) return;
    if (event.touches.length !== 1) {
      resetTouchGesture();
      suppressClickUntil = Date.now() + 450;
      return;
    }
    const dx = event.touches[0].clientX - touchGesture.x;
    const dy = event.touches[0].clientY - touchGesture.y;
    if (!touchGesture.axis && Math.max(Math.abs(dx), Math.abs(dy)) > 10) {
      touchGesture.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
    }
    if (touchGesture.axis !== 'x') return;
    if (event.cancelable) event.preventDefault();
    touchGesture.dx = dx;
    suppressClickUntil = Date.now() + 450;
    lightbox.classList.add('is-dragging');
    if (!reducedMotion.matches) {
      lightboxImg.style.transform = `translateX(${dx * 0.85}px)`;
      lightboxImg.style.opacity = String(Math.max(0.6, 1 - Math.abs(dx) / window.innerWidth * 0.35));
    }
  }

  function handleTouchEnd(event) {
    if (!touchGesture) return;
    const gesture = touchGesture;
    const movedTransform = lightboxImg.style.transform;
    const movedOpacity = lightboxImg.style.opacity;
    resetTouchGesture();
    if (event.touches.length || gesture.axis !== 'x') return;
    suppressClickUntil = Date.now() + 450;
    const speed = Math.abs(gesture.dx) / Math.max(1, performance.now() - gesture.started);
    const threshold = Math.min(85, window.innerWidth * 0.2);
    if (Math.abs(gesture.dx) >= threshold || (Math.abs(gesture.dx) > 28 && speed > 0.45)) {
      if (gesture.dx < 0) goNext();
      else goPrev();
    } else {
      animateImage([
        { transform: movedTransform || 'none', opacity: movedOpacity || 1 },
        { transform: 'none', opacity: 1 },
      ], 220);
    }
  }

  // 触控板惯性滚动锁定到本次手势结束，避免一次滑动跳过多张。
  function handleHorizontalWheel(e) {
    if (!lightbox || !lightbox.classList.contains('active')) return;
    if (e.ctrlKey || (window.visualViewport && window.visualViewport.scale > 1.05)) return;
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

    if ('IntersectionObserver' in window && sections.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            navLinks.forEach(l => {
              const active = l.getAttribute('data-target') === id;
              l.classList.toggle('active', active);
              if (active) l.setAttribute('aria-current', 'location');
              else l.removeAttribute('aria-current');
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
        case 'Escape': e.preventDefault(); closeLightbox(); break;
        case 'ArrowRight': e.preventDefault(); goNext(); break;
        case 'ArrowLeft': e.preventDefault(); goPrev(); break;
      }
    });

    // Focus trap
    document.addEventListener('keydown', trapFocus);

    // 空白处关闭；滑动后的合成点击不触发关闭。
    if (lightbox) {
      lightbox.addEventListener('click', (e) => {
        if (Date.now() < suppressClickUntil && !e.target.closest('button')) return;
        if (!e.target.closest('#lightboxImg, .lightbox-info, .lightbox-close, .lightbox-prev, .lightbox-next')) {
          closeLightbox();
        }
      });
      lightbox.addEventListener('wheel', handleHorizontalWheel, { passive: false });
      lightbox.addEventListener('touchstart', handleTouchStart, { passive: true });
      lightbox.addEventListener('touchmove', handleTouchMove, { passive: false });
      lightbox.addEventListener('touchend', handleTouchEnd, { passive: true });
      lightbox.addEventListener('touchcancel', resetTouchGesture, { passive: true });
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', syncZoomState, { passive: true });
      }
      document.addEventListener('visibilitychange', keepBackgroundStill);
      window.addEventListener('pageshow', keepBackgroundStill);
    }
  });

})();
