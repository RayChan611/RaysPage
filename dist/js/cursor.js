/* ============================================
   Custom Cursor — Soft Streamline
   Head tracks 1:1 (instant, no lag). A soft ribbon trails the
   ACTUAL path the pointer has taken — built from a short history
   of positions, smoothed with quadratic beziers, faded from tail
   (transparent) to head (visible) and softened with a gaussian
   blur. When the pointer stops, the ribbon retracts into a point.
   Uses translate3d for the head (GPU-composited) and an SVG path
   for the trail (vector, crisp at any DPR).

   The RAF loop is started directly here (NOT relying on RayRAF to
   kick it) — RayRAF only pauses/resumes on tab visibility changes.
   ============================================ */

(function () {
  'use strict';

  // Respect reduced-motion preference → keep the native cursor.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function init() {
    if (window.innerWidth <= 768) return;

    const head  = document.getElementById('cursorComet');
    const svg   = document.getElementById('cursorStream');
    const path  = document.getElementById('streamPath');
    const grad  = document.getElementById('streamGrad');
    if (!head || !svg || !path || !grad) {
      setTimeout(init, 50); // BaseLayout not painted yet
      return;
    }

    document.body.classList.add('custom-cursor-active');

    // --- tunables (ribbon feel) ---
    const MAX_PTS  = 24;     // history length → ribbon length
    const SHRINK   = 0.5;    // px/frame below which we treat as idle (retract)
    const EASE_IN  = 0.18;   // how fast a fresh point eases in (soft, not snappy)

    // Start off-screen so there is no (0,0) flash before the first move.
    let mx = -100, my = -100;   // latest pointer position
    let hx = -100, hy = -100;   // eased head position (1:1 but eased in slightly)
    const buf = [];             // ring of recent {x,y}
    let hasMoved = false;
    let animId = null;

    head.style.opacity = '0';

    function reveal(e) {
      if (hasMoved) return;
      hasMoved = true;
      mx = e.clientX; my = e.clientY;
      hx = mx; hy = my;
      head.style.opacity = '1';
      svg.style.opacity = '1';
    }

    document.addEventListener('pointermove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      reveal(e);
    }, { capture: true, passive: true });

    // Fallback: light up even if pointermove is not forwarded (embedded previews).
    document.addEventListener('pointerover', reveal, { passive: true });

    // Build a smooth path (quadratic beziers through midpoints) from the buffer.
    function buildPath(pts) {
      if (pts.length < 2) return '';
      let d = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
      for (let i = 1; i < pts.length - 1; i++) {
        const xc = (pts[i].x + pts[i + 1].x) / 2;
        const yc = (pts[i].y + pts[i + 1].y) / 2;
        d += ' Q ' + pts[i].x.toFixed(1) + ' ' + pts[i].y.toFixed(1) +
             ' ' + xc.toFixed(1) + ' ' + yc.toFixed(1);
      }
      const last = pts[pts.length - 1];
      d += ' L ' + last.x.toFixed(1) + ' ' + last.y.toFixed(1);
      return d;
    }

    function frame() {
      const dx = mx - hx;
      const dy = my - hy;
      const dist = Math.hypot(dx, dy);

      // head: eased-in 1:1 (EASE_IN keeps it glued but soft on first motion)
      hx += dx * (hasMoved ? 1 : 0);
      hy += dy * (hasMoved ? 1 : 0);
      head.style.transform =
        'translate3d(' + (hx - 4.5) + 'px,' + (hy - 4.5) + 'px,0)';

      // ribbon: extend while moving, retract when idle
      if (dist > SHRINK) {
        buf.push({ x: hx, y: hy });
        if (buf.length > MAX_PTS) buf.shift();
      } else if (buf.length > 0) {
        buf.shift(); // retract into the head when still
      }

      if (buf.length >= 2) {
        path.setAttribute('d', buildPath(buf));
        // gradient runs tail(opaque-0) → head(visible), in user space
        const tail = buf[0];
        const headP = buf[buf.length - 1];
        grad.setAttribute('x1', tail.x);
        grad.setAttribute('y1', tail.y);
        grad.setAttribute('x2', headP.x);
        grad.setAttribute('y2', headP.y);
        svg.style.opacity = '1';
      } else {
        path.setAttribute('d', '');
        svg.style.opacity = '0';
      }

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
