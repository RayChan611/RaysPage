/* ============================================
   Card 3D Tilt — Perspective Hover Effect
   Contact cards, tags, social links
   ============================================ */

(function () {
  'use strict';

  // Skip touch devices
  if ('ontouchstart' in window) return;

  const SELECTOR = '.contact-card, .tag, .social-link';
  const MAX_TILT = 6;
  const PERSPECTIVE = 800;
  const TRANSITION_MS = 150;

  class CardTilt {
    constructor(el) {
      this.el = el;
      this.el.style.transformStyle = 'preserve-3d';
      this.el.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      this.el.__tilt = this;
      // 尺寸在构造时缓存一次，resize 时更新，避免 hover 每帧读取 offsetWidth/Height 触发强制重排
      this.w = el.offsetWidth;
      this.h = el.offsetHeight;
      window.addEventListener('resize', () => {
        this.w = el.offsetWidth;
        this.h = el.offsetHeight;
      }, { passive: true });
      this.bind();
    }

    bind() {
      this.el.addEventListener('mouseenter', () => this.enter());
      this.el.addEventListener('mousemove', (e) => this.move(e));
      this.el.addEventListener('mouseleave', () => this.leave());
    }

    enter() {
      // 尺寸已在构造函数缓存，hover 时无需再读取
    }

    move(e) {
      const rect = this.el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const px = (x / this.w - 0.5) * 2;  // -1..1
      const py = (y / this.h - 0.5) * 2;

      const ry = px * MAX_TILT;
      const rx = -py * MAX_TILT;

      this.el.style.transition = 'none';
      this.el.style.transform = `
        perspective(${PERSPECTIVE}px)
        rotateX(${rx}deg)
        rotateY(${ry}deg)
        scale3d(1.02, 1.02, 1.02)
      `;
    }

    leave() {
      this.el.style.transition = `transform ${TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      this.el.style.transform = `
        perspective(${PERSPECTIVE}px)
        rotateX(0deg)
        rotateY(0deg)
        scale3d(1, 1, 1)
      `;
    }
  }

  function init() {
    document.querySelectorAll(SELECTOR).forEach(el => {
      if (!el.__tilt) new CardTilt(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
