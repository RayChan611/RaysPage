/* ============================================
   Custom Cursor — Minimal SVG ring + dot
   A thin stroke ring lerps softly behind the pointer (premium trail
   without noise); a precise dot pins 1:1 to the pointer. Over interactive
   elements the ring expands + brightens and the dot fades, forming a quiet
   "target". Replaces the old stardust-spray particle canvas.
   ============================================ */

(function () {
  'use strict';

  // Respect reduced-motion preference → keep the native cursor.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // 计量网络用户跳过粒子特效
  if (window.__reducedData) return;

  function init() {
    if (window.innerWidth <= 768) return;

    const ring = document.getElementById('cursorRing');
    const dot  = document.getElementById('cursorDot');
    if (!ring || !dot) {
      setTimeout(init, 50); // BaseLayout not painted yet
      return;
    }

    const RING_HALF = 22; // half of the 44px ring svg
    const DOT_HALF  = 7;  // half of the 14px dot svg

    document.body.classList.add('custom-cursor-active');

    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;            // ring position (lerped)
    let scale = 1, targetScale = 1;
    let dotOpacity = 1, targetDotOpacity = 1;
    let hasMoved = false;
    let animId = null;

    ring.style.opacity = '0';

    document.addEventListener('pointermove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!hasMoved) { hasMoved = true; rx = mx; ry = my; ring.style.opacity = '1'; }
    }, { capture: true, passive: true });

    // Hide the ring when the pointer leaves the window, restore on return.
    document.documentElement.addEventListener('mouseleave', () => { ring.style.opacity = '0'; });
    document.documentElement.addEventListener('mouseenter', () => { if (hasMoved) ring.style.opacity = '1'; });

    const hoverSel = 'a, button, .contact-card, .tag, .social-link, .gallery-item, .essay-card, input, textarea, [role="button"]';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest && e.target.closest(hoverSel)) {
        document.body.classList.add('cursor-hover');
        targetScale = 1.9;        // ring blooms around the target
        targetDotOpacity = 0;     // precise dot steps aside
      }
    });
    document.addEventListener('mouseout', (e) => {
      const to = e.relatedTarget;
      const leftInteractive = !to || !to.closest || !to.closest(hoverSel);
      if (leftInteractive) {
        document.body.classList.remove('cursor-hover');
        targetScale = 1;
        targetDotOpacity = 1;
      }
      if (!to) ring.style.opacity = '0'; // pointer left the window
    });

    function frame() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      scale += (targetScale - scale) * 0.15;
      dotOpacity += (targetDotOpacity - dotOpacity) * 0.15;

      ring.style.transform =
        'translate3d(' + (rx - RING_HALF) + 'px,' + (ry - RING_HALF) + 'px,0) scale(' + scale.toFixed(3) + ')';
      dot.style.transform =
        'translate3d(' + (mx - DOT_HALF) + 'px,' + (my - DOT_HALF) + 'px,0)';
      dot.style.opacity = dotOpacity.toFixed(3);

      animId = requestAnimationFrame(frame);
    }
    animId = requestAnimationFrame(frame);

    if (window.RayRAF) {
      window.RayRAF.register({
        start: function () { if (!animId) animId = requestAnimationFrame(frame); },
        stop:  function () { if (animId) { cancelAnimationFrame(animId); animId = null; } },
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
  } else {
    setTimeout(init, 50);
  }
})();
