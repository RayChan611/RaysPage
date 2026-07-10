/* ============================================
   Custom Cursor — Soft Streamline (damped cascade)
   The head pins 1:1 to the pointer. The trail is a short cascade of
   N points, each lerping toward the point ahead of it with a small
   delay. This gives the ribbon fluid inertia without the physical
   instability of a spring/gravity chain: it follows the real path,
   stays compact, and settles quickly when you stop.
   Rendered as a smoothed SVG path (tail→head transparent→visible
   gradient + gaussian blur). The head uses translate3d (GPU-composited).

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
    const svg  = document.getElementById('cursorStream');
    const path = document.getElementById('streamPath');
    const grad = document.getElementById('streamGrad');
    if (!head || !svg || !path || !grad) {
      setTimeout(init, 50); // BaseLayout not painted yet
      return;
    }

    document.body.classList.add('custom-cursor-active');

    // --- tunables ---
    const N         = 8;    // trail length (compact)
    const LAG        = 0.28; // how tightly each point follows the one ahead
    const FADE_EASE  = 0.12; // global opacity ease in/out
    const SHRINK     = 0.6;  // px/frame threshold for "still"

    // head
    let mx = -100, my = -100;
    let hx = -100, hy = -100;
    let fade = 0;
    let hasMoved = false;
    let animId = null;

    // trail points: p[0] is just behind the head, p[N-1] is the tail tip
    const pts = [];
    for (let i = 0; i < N; i++) pts.push({ x: -100, y: -100 });

    head.style.opacity = '0';
    svg.style.opacity = '0';

    function reveal(e) {
      if (hasMoved) return;
      hasMoved = true;
      mx = e.clientX; my = e.clientY;
      hx = mx; hy = my;
      for (let i = 0; i < N; i++) { pts[i].x = mx; pts[i].y = my; }
      head.style.opacity = '1';
    }

    document.addEventListener('pointermove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      reveal(e);
    }, { capture: true, passive: true });

    // Fallback: light up even if pointermove is not forwarded (embedded previews).
    document.addEventListener('pointerover', reveal, { passive: true });

    // Quadratic bezier through midpoints for a smooth ribbon.
    function buildPath(p) {
      if (p.length < 2) return '';
      let d = 'M ' + p[0].x.toFixed(1) + ' ' + p[0].y.toFixed(1);
      for (let i = 1; i < p.length - 1; i++) {
        const xc = (p[i].x + p[i + 1].x) / 2;
        const yc = (p[i].y + p[i + 1].y) / 2;
        d += ' Q ' + p[i].x.toFixed(1) + ' ' + p[i].y.toFixed(1) +
             ' ' + xc.toFixed(1) + ' ' + yc.toFixed(1);
      }
      const last = p[p.length - 1];
      d += ' L ' + last.x.toFixed(1) + ' ' + last.y.toFixed(1);
      return d;
    }

    function frame() {
      const dx = mx - hx;
      const dy = my - hy;

      // head: exact 1:1
      hx += dx;
      hy += dy;
      head.style.transform =
        'translate3d(' + (hx - 4.5) + 'px,' + (hy - 4.5) + 'px,0)';

      // damped cascade: each point follows the one ahead
      pts[0].x += (hx - pts[0].x) * LAG;
      pts[0].y += (hy - pts[0].y) * LAG;
      for (let i = 1; i < N; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * LAG;
        pts[i].y += (pts[i - 1].y - pts[i].y) * LAG;
      }

      // fade in while moving, fade out when still
      const moving = Math.hypot(dx, dy) > SHRINK;
      const target = moving ? 1 : 0;
      fade += (target - fade) * FADE_EASE;

      if (fade > 0.001) {
        path.setAttribute('d', buildPath(pts));
        const tail = pts[N - 1];
        const headP = pts[0];
        grad.setAttribute('x1', tail.x);
        grad.setAttribute('y1', tail.y);
        grad.setAttribute('x2', headP.x);
        grad.setAttribute('y2', headP.y);
        svg.style.opacity = fade.toFixed(3);
      } else {
        path.setAttribute('d', '');
        svg.style.opacity = '0';
      }

      animId = requestAnimationFrame(frame);
    }

    // Start the loop directly (RayRAF does NOT auto-start registered loops).
    animId = requestAnimationFrame(frame);

    // Pause on hidden tab to save CPU.
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
