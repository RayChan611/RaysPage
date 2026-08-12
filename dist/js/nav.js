/* ============================================
   Nav + Scroll Animations
   - Nav scroll effect
   - Mobile menu toggle
   - Intersection Observer scroll reveals
   - Hero entrance animation
   ============================================ */

(function () {
  'use strict';

  // ---- Nav scroll effect ----
  function handleNavScroll() {
    const nav = document.getElementById('nav');
    if (!nav) return;
    if (window.scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
  // Delegated to the shared RayScroll manager (single passive listener, rAF-throttled)
  window.RayScroll.add(handleNavScroll);

  // ---- Mobile menu (event delegation, works with BaseLayout-rendered nav) ----
  function setMobileMenu(open, restoreFocus) {
    const btn = document.getElementById('navMobileBtn');
    const links = document.getElementById('navLinks');
    if (!btn || !links) return;

    btn.classList.toggle('active', open);
    links.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
    if (!open && restoreFocus) btn.focus();
  }

  document.addEventListener('click', function (e) {
    if (!(e.target instanceof Element)) return;
    const mobileBtn = e.target.closest('#navMobileBtn');
    if (mobileBtn) {
      const isOpen = mobileBtn.getAttribute('aria-expanded') !== 'true';
      setMobileMenu(isOpen, false);
      return;
    }
    // Click on a nav link inside mobile menu — close menu
    const navLink = e.target.closest('#navLinks a');
    if (navLink) {
      setMobileMenu(false, false);
      return;
    }

    // An open dropdown should not linger after the user clicks elsewhere.
    const btn = document.getElementById('navMobileBtn');
    if (btn && btn.getAttribute('aria-expanded') === 'true' && !e.target.closest('#nav')) {
      setMobileMenu(false, false);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    const btn = document.getElementById('navMobileBtn');
    if (btn && btn.getAttribute('aria-expanded') === 'true') {
      e.preventDefault();
      setMobileMenu(false, true);
    }
  });

  // ---- Scroll Animations (Intersection Observer) ----
  function initScrollAnimations() {
    const scrollElements = document.querySelectorAll('.animate-on-scroll');
    if (!scrollElements.length) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px'
      });
      scrollElements.forEach(el => observer.observe(el));
    } else {
      scrollElements.forEach(el => el.classList.add('visible'));
    }
  }

  // ---- Hero entrance animation ----
  function initHeroAnimation() {
    const heroText = document.querySelector('.hero-text');
    if (heroText) {
      // 双 rAF 等待首帧样式就绪后触发，与 CSS 动画时序解耦（替代固定 300ms 魔法数字）
      requestAnimationFrame(() => requestAnimationFrame(() => heroText.classList.add('hero-loaded')));
    }
  }

  // ---- Init all ----
  function init() {
    initScrollAnimations();
    initHeroAnimation();
    // Base CSS remains fully visible without this marker. It is added only
    // after both animation initialisers complete successfully.
    document.documentElement.classList.add('motion-ready');
    // Mobile menu uses event delegation — no init needed
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }
})();
