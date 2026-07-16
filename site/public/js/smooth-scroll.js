/* ============================================
   Smooth Scroll - Lenis integration
   ============================================ */

(function () {
  'use strict';

  let lenis;
  let animId = null;

  // Disable browser native scroll restoration — Lenis takes over
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  if (window.Lenis) {
    lenis = new Lenis({
      duration: 1.0,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smooth: true,
      direction: 'vertical',
      gestureDirection: 'vertical',
      smoothTouch: false,
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

  // Handle URL hash on page load
  function scrollToHashTarget() {
    const hash = window.location.hash;
    if (!hash) return;
    const target = document.querySelector(hash);
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
          window.scrollTo({ top: targetPos, behavior: 'smooth' });
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
    if (targetId === '#' || targetId.length < 2) return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      const navEl = document.getElementById('nav');
      const navHeight = navEl ? navEl.offsetHeight : 0;
      const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
      if (lenis) {
        lenis.scrollTo(targetPos, { duration: 0.7 });
      } else {
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    }
  });
})();
