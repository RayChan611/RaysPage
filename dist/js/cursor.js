/* ============================================
   Custom Cursor — Comet Trail
   Head tracks 1:1 (instant, no lag). A linear streak extends
   OPPOSITE the direction of motion; its length is proportional to
   speed and tapers to a point when the pointer is still.
   Uses translate3d (GPU-composited, no layout thrash).

   The RAF loop is started directly here (NOT relying on RayRAF to
   kick it) — RayRAF only pauses/resumes on tab visibility changes.
   ============================================ */

(function () {
  'use strict';

  // Respect reduced-motion preference → keep the native cursor.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function init() {
    if (window.innerWidth <= 768) return;

    const head = document.getElementById('cursorComet');
    const tail = document.getElementById('cursorCometTail');
    if (!head || !tail) {
      setTimeout(init, 50); // BaseLayout not painted yet
      return;
    }

    document.body.classList.add('custom-cursor-active');

    // --- tunables (physics feel) ---
    const TAIL_BASE = 190;   // px, full-length of the streak element
    const SPEED_K   = 0.55;  // length per px/frame of velocity
    const TAIL_MAX  = 190;   // cap on streak length
    const LEN_EASE  = 0.35;  // how fast length eases toward target
    const ANG_EASE  = 0.30;  // how fast angle eases (avoids jitter)

    // Start off-screen so there is no (0,0) flash before the first move.
    let mx = -100, my = -100;   // latest pointer position
    let px = -100, py = -100;   // previous frame position (for velocity)
    let len = 0;                // current eased streak length
    let ang = 0;                // current eased angle (rad)
    let hasMoved = false;
    let animId = null;

    head.style.opacity = '0';
    tail.style.opacity = '0';

    function reveal(e) {
      if (hasMoved) return;
      hasMoved = true;
      mx = e.clientX; my = e.clientY;
      px = mx; py = my;         // no huge initial velocity spike
      head.style.opacity = '1';
      tail.style.opacity = '1';
    }

    document.addEventListener('pointermove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      reveal(e);
    }, { capture: true, passive: true });

    // Fallback so the cursor lights up even if pointermove is not forwarded
    // (e.g. some embedded preview panels): any pointer entering the page reveals it.
    document.addEventListener('pointerover', reveal, { passive: true });

    function frame() {
      const vx = mx - px;
      const vy = my - py;
      const speed = Math.hypot(vx, vy);

      // head: exact 1:1, centered
      head.style.transform =
        'translate3d(' + (mx - 4.5) + 'px,' + (my - 4.5) + 'px,0)';

      // target length ∝ speed, capped
      const targetLen = Math.min(speed * SPEED_K, TAIL_MAX);
      len += (targetLen - len) * LEN_EASE;

      if (speed > 0.5) {
        let target = Math.atan2(vy, vx);
        let diff = target - ang;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        ang += diff * ANG_EASE;
      }

      if (len > 0.4) {
        tail.style.opacity = '1';
        tail.style.transform =
          'translate3d(' + (mx - TAIL_BASE) + 'px,' + (my - 1.25) + 'px,0) ' +
          'rotate(' + ang + 'rad) scaleX(' + (len / TAIL_BASE) + ')';
      } else {
        tail.style.opacity = '0';
      }

      px = mx; py = my;
      animId = requestAnimationFrame(frame);
    }

    // Start the loop directly (RayRAF does NOT auto-start registered loops).
    animId = requestAnimationFrame(frame);

    // Pause on hidden tab to save CPU (RayRAF only fires on visibilitychange).
    if (window.RayRAF) {
      window.RayRAF.register({
        start: function () { if (!animId) animId = requestAnimationFrame(frame); },
        stop:  function () { if (animId) { cancelAnimationFrame(animId); animId = null; } },
      });
    }

    // Hover affordance (event delegation)
    const hoverSel = 'a, button, .contact-card, .tag, .social-link, .gallery-item, .essay-card';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSel)) document.body.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSel)) document.body.classList.remove('cursor-hover');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
  } else {
    setTimeout(init, 50);
  }
})();
