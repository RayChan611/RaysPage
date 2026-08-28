/* ============================================
   Nav + Scroll Animations
   - Nav scroll effect
   - Mobile menu toggle
   - Intersection Observer scroll reveals
   - Hero entrance animation
   ============================================ */

(function () {
  'use strict';

  let mobileMenuFocusFrame = null;

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

    if (mobileMenuFocusFrame !== null) {
      cancelAnimationFrame(mobileMenuFocusFrame);
      mobileMenuFocusFrame = null;
    }

    if (open) {
      // 链接在 DOM 中位于菜单按钮之前；打开后主动把焦点移入菜单，
      // 避免用户下一次按 Tab 时直接越过全部导航项。
      mobileMenuFocusFrame = requestAnimationFrame(function () {
        mobileMenuFocusFrame = null;
        if (btn.getAttribute('aria-expanded') !== 'true') return;
        const firstLink = links.querySelector('a[href]');
        if (firstLink) firstLink.focus();
      });
    } else if (restoreFocus) {
      btn.focus();
    }
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
  function initScrollAnimations(recoveringFromFallback) {
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
      scrollElements.forEach(el => {
        // 兜底期间内容已经可见。恢复动效前先同步固定首屏元素的最终
        // 状态，避免重新加回 .js 时出现一帧闪烁；折叠以下仍正常揭示。
        const rect = el.getBoundingClientRect();
        if (recoveringFromFallback && rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('visible');
          return;
        }
        observer.observe(el);
      });
    } else {
      scrollElements.forEach(el => el.classList.add('visible'));
    }
  }

  // ---- Hero entrance animation ----
  function initHeroAnimation(recoveringFromFallback) {
    const heroText = document.querySelector('.hero-text');
    if (heroText) {
      if (recoveringFromFallback) {
        heroText.classList.add('hero-loaded');
        return;
      }
      // 双 rAF 等待首帧样式就绪后触发，与 CSS 动画时序解耦（替代固定 300ms 魔法数字）
      requestAnimationFrame(() => requestAnimationFrame(() => heroText.classList.add('hero-loaded')));
    }
  }

  // ---- Init all ----
  function init() {
    const root = document.documentElement;
    const recoveringFromFallback = root.classList.contains('motion-fallback');
    initScrollAnimations(recoveringFromFallback);
    initHeroAnimation(recoveringFromFallback);
    // Base CSS remains fully visible without this marker. It is added only
    // after both animation initialisers complete successfully.
    root.classList.remove('motion-fallback');
    root.classList.add('js', 'motion-ready');
    // Mobile menu uses event delegation — no init needed
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
  } else {
    setTimeout(init, 100);
  }
})();
