/* ============================================
   Smooth Scroll - Lenis integration
   ============================================ */

(function () {
  'use strict';

  let lenis;
  let animId = null;

  // Keep native history restoration. Lenis only owns animated/programmatic
  // scrolling; forcing manual restoration made Back return every list to top.
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'auto';
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
    const target = getHashTarget(targetId);
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
