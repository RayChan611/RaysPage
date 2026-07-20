/**
 * button-effects.js
 * 磁吸跟随 + 点击涟漪特效
 */

(function () {
  const MAGNETIC_STRENGTH = 0.3; // 磁吸强度（0-1）
  const RIPPLE_DURATION = 650; // 涟漪动画时长 ms

  // 仅在有精确指针的设备上启用磁吸（排除纯触屏）
  const isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 磁吸效果 ---------- */
  function initMagnetic() {
    if (!isFinePointer) return;

    document.querySelectorAll('.btn-magnetic').forEach((wrapper) => {
      const btn = wrapper.querySelector('.btn-primary');
      if (!btn) return;

      wrapper.addEventListener('mouseenter', () => {
        wrapper.classList.add('is-magnetic');
      });

      wrapper.addEventListener('mousemove', (e) => {
        const rect = wrapper.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        // 偏移量通过 CSS 变量传递，transition 交由 CSS 统一管理，mousemove 不再每帧覆写 style.transition
        wrapper.style.setProperty('--mx', `${x * MAGNETIC_STRENGTH}px`);
        wrapper.style.setProperty('--my', `${y * MAGNETIC_STRENGTH}px`);
      });

      wrapper.addEventListener('mouseleave', () => {
        wrapper.classList.remove('is-magnetic');
        wrapper.style.setProperty('--mx', '0px');
        wrapper.style.setProperty('--my', '0px');
      });
    });
  }

  /* ---------- 点击涟漪 ---------- */
  function initRipple() {
    document.querySelectorAll('.btn-primary').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');

        const rect = btn.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = `${size}px`;
        ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
        ripple.style.top = `${e.clientY - rect.top - size / 2}px`;

        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), RIPPLE_DURATION);
      });
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    initMagnetic();
    initRipple();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
