/* ============================================
   Smooth Scroll - Lenis integration
   ============================================ */

(function () {
  'use strict';

  let lenis;
  let animId = null;
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Keep native history restoration. Lenis only owns animated/programmatic
  // scrolling; forcing manual restoration made Back return every list to top.
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'auto';
  }

  // 滚轮插值虽然不是 CSS 动画，仍可能引起不适；减少动态效果时保留原生滚动。
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({
      duration: 1.0,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      syncTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      animId = requestAnimationFrame(raf);
    }
    animId = requestAnimationFrame(raf);

    // Pause Lenis raf loop when tab is hidden — delegated to shared manager.
    if (window.RayRAF) {
      window.RayRAF.register({
        start: function () { if (!animId) animId = requestAnimationFrame(raf); if (lenis) lenis.start(); },
        stop:  function () { if (animId) { cancelAnimationFrame(animId); animId = null; } if (lenis) lenis.stop(); },
      });
    }

    // Expose globally for other scripts
    window.lenis = lenis;
  }

  function getHashTarget(hash) {
    if (!hash || hash === '#' || hash.length < 2) return null;
    var id = hash.slice(1);
    try { id = decodeURIComponent(id); } catch (_) {}
    return document.getElementById(id);
  }

  // Handle URL hash on page load
  function scrollToHashTarget() {
    const hash = window.location.hash;
    // Resolve by id instead of treating user-controlled hashes as CSS
    // selectors; malformed/escaped hashes must never throw on page load.
    const target = getHashTarget(hash);
    if (!target) return;
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const navEl = document.getElementById('nav');
        const navHeight = navEl ? navEl.offsetHeight : 0;
        // Use scrollY (pageYOffset is deprecated)
        const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
        if (lenis) {
          lenis.scrollTo(targetPos, { duration: 0.8 });
        } else {
          window.scrollTo({ top: targetPos, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scrollToHashTarget);
  } else {
    scrollToHashTarget();
  }

  // Smooth scroll for anchor links — event delegation
  // Works regardless of when BaseLayout renders nav
  document.addEventListener('click', function (e) {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    const targetId = anchor.getAttribute('href');
    const target = getHashTarget(targetId);
    if (target) {
      e.preventDefault();
      if (anchor.classList.contains('skip-link')) {
        try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
      }
      const navEl = document.getElementById('nav');
      const navHeight = navEl ? navEl.offsetHeight : 0;
      const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
      if (lenis) {
        lenis.scrollTo(targetPos, { duration: 0.7 });
      } else {
        window.scrollTo({ top: targetPos, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    }
  });
})();
