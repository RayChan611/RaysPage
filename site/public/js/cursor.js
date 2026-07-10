/* ============================================
   Custom Cursor — Soft Fluid Stream (particle trail)
   The head pins 1:1 to the pointer. The trail is a fluid ribbon made
   of small particles emitted from the head while moving. Each particle
   carries inherited velocity, gets damped, and drifts slightly, so the
   ribbon has its own life: it swirls behind fast motion, softens on
   curves, and dissolves naturally when you stop.

   The latest particles are connected by a smooth SVG path; older
   particles fade out and are recycled. The head uses translate3d
   (GPU-composited). The RAF loop is started directly here.
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

    // --- tunables (subtle stardust) ---
    const MAX_PTS    = 9;    // how many particles form the visible ribbon (shorter = subtler)
    const EMIT_DIST  = 6.5;  // px the head must travel before emitting a particle (wider = fewer)
    const DAMP       = 0.92; // velocity friction (0-1; higher = longer glide)
    const GRAVITY    = 0.04; // tiny downward drift (weight, not droop)
    const JITTER     = 0.25; // random velocity perturbation
    const FADE_EASE  = 0.12; // global opacity ease in/out
    const SHRINK     = 0.6;  // px/frame threshold for "still"
    const RIBBON_WIDTH = 2.5;  // stroke width

    // head state
    let mx = -100, my = -100;
    let hx = -100, hy = -100;
    let hvx = 0, hvy = 0;      // head velocity used to seed particles
    let fade = 0;
    let hasMoved = false;
    let animId = null;

    // particle pool: newest at end, oldest at start
    const particles = [];
    let emitAcc = 0; // accumulated head travel since last emission

    head.style.opacity = '0';
    svg.style.opacity = '0';

    function reveal(e) {
      if (hasMoved) return;
      hasMoved = true;
      mx = e.clientX; my = e.clientY;
      hx = mx; hy = my;
      hvx = 0; hvy = 0;
      particles.length = 0;
      head.style.opacity = '1';
    }

    document.addEventListener('pointermove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      reveal(e);
    }, { capture: true, passive: true });

    document.addEventListener('pointerover', reveal, { passive: true });

    // Smooth path through points with quadratic bezier midpoints.
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

    // Age out the oldest particles until we are at MAX_PTS.
    function trim() {
      while (particles.length > MAX_PTS) particles.shift();
    }

    function frame() {
      const dx = mx - hx;
      const dy = my - hy;
      const dist = Math.hypot(dx, dy);

      // head: exact 1:1, but remember velocity for particle seeding
      hvx = dx;
      hvy = dy;
      hx += dx;
      hy += dy;
      head.style.transform =
        'translate3d(' + (hx - 4.5) + 'px,' + (hy - 4.5) + 'px,0)';

      // emit particles while moving; keep a minimum spacing for a clean line
      if (hasMoved && dist > 0) {
        emitAcc += dist;
        while (emitAcc >= EMIT_DIST) {
          const t = EMIT_DIST / dist; // lerp fraction for this emission
          const ex = hx - hvx * t;
          const ey = hy - hvy * t;
          particles.push({
            x: ex,
            y: ey,
            vx: (hvx * 0.35) + (Math.random() - 0.5) * JITTER,
            vy: (hvy * 0.35) + (Math.random() - 0.5) * JITTER,
            life: 1.0,
            decay: 0.022 + Math.random() * 0.012,
          });
          emitAcc -= EMIT_DIST;
        }
      }

      // evolve particles: drag, gravity, jitter, fade
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx *= DAMP;
        p.vy *= DAMP;
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
      }
      // drop dead particles
      while (particles.length && particles[0].life <= 0) particles.shift();
      trim();

      // fade in while moving, fade out when still
      const moving = Math.hypot(dx, dy) > SHRINK;
      const target = (moving || particles.length > 2) ? 1 : 0;
      fade += (target - fade) * FADE_EASE;

      if (fade > 0.001 && particles.length >= 2) {
        path.setAttribute('d', buildPath(particles));
        const tail = particles[0];
        const headP = particles[particles.length - 1];
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

    animId = requestAnimationFrame(frame);

    if (window.RayRAF) {
      window.RayRAF.register({
        start: function () { if (!animId) animId = requestAnimationFrame(frame); },
        stop:  function () { if (animId) { cancelAnimationFrame(animId); animId = null; } },
      });
    }

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
