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
  document.addEventListener('click', function (e) {
    const mobileBtn = e.target.closest('#navMobileBtn');
    if (mobileBtn) {
      const navLinks = document.getElementById('navLinks');
      if (!navLinks) return;
      const isOpen = mobileBtn.classList.toggle('active');
      navLinks.classList.toggle('open');
      mobileBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      return;
    }
    // Click on a nav link inside mobile menu — close menu
    const navLink = e.target.closest('#navLinks a');
    if (navLink) {
      const btn = document.getElementById('navMobileBtn');
      const links = document.getElementById('navLinks');
      if (btn && links && btn.classList.contains('active')) {
        btn.classList.remove('active');
        links.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
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
    // Mobile menu uses event delegation — no init needed
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }
})();
