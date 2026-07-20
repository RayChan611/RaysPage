/* ============================================
   Custom Cursor — Stardust Spray
   The head pins 1:1 to the pointer. While moving, it sheds small
   glowing particles that inherit the head's velocity, get damped,
   drift down under a gentle gravity, and fade out — a loose spray
   of stardust, not a connected ribbon. Each particle is drawn on a
   full-screen canvas (GPU-friendly). The RAF loop is started here
   directly; RayRAF only pauses it when the tab is hidden.
   ============================================ */

(function () {
  'use strict';

  // Respect reduced-motion preference → keep the native cursor.
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // 计量网络用户跳过粒子特效
  if (window.__reducedData) return;

  function init() {
    if (window.innerWidth <= 768) return;

    const head = document.getElementById('cursorComet');
    const canvas = document.getElementById('cursorStream');
    if (!head || !canvas) {
      setTimeout(init, 50); // BaseLayout not painted yet
      return;
    }
    const ctx = canvas.getContext('2d');

    document.body.classList.add('custom-cursor-active');

    // --- tunables (subtle stardust) ---
    const MAX_PARTICLES = 60;  // hard cap to protect perf
    const EMIT_DIST   = 6.5;   // px the head must travel before shedding a particle
    const DAMP        = 0.92;  // velocity friction (0-1; higher = longer glide)
    const GRAVITY     = 0.15;  // heavier downward drift (clear weight/fall)
    const JITTER      = 0.4;   // random velocity spread on emission
    const FADE_EASE   = 0.12;  // global opacity ease in/out
    const SHRINK      = 0.6;   // px/frame threshold for "still"
    const HEAD_R      = 4.5;   // half of the 9px head, for centering

    // head state
    let mx = -100, my = -100;
    let hx = -100, hy = -100;
    let hvx = 0, hvy = 0;      // head velocity, seeds particle motion
    let fade = 0;
    let hasMoved = false;
    let animId = null;
    let hover = 0;             // 0..1 eased hover boost for particle brightness

    // particle pool (newest pushed to end)
    const particles = [];
    let emitAcc = 0;

    head.style.opacity = '0';
    canvas.style.opacity = '0';

    // Size the canvas to the viewport (DPR-aware).
    function sizeCanvas() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(innerWidth * dpr);
      canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + 'px';
      canvas.style.height = innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);

    function reveal(e) {
      if (hasMoved) return;
      hasMoved = true;
      mx = e.clientX; my = e.clientY;
      hx = mx; hy = my;
      head.style.opacity = '1';
    }

    document.addEventListener('pointermove', (e) => {
      mx = e.clientX;
      my = e.clientY;
      reveal(e);
    }, { capture: true, passive: true });

    document.addEventListener('pointerover', reveal, { passive: true });

    function spawn(x, y, vx, vy) {
      if (particles.length >= MAX_PARTICLES) particles.shift();
      particles.push({
        x: x, y: y,
        vx: vx, vy: vy,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.015,
        r: 1 + Math.random() * 1.5,
      });
    }

    function frame() {
      const dx = mx - hx;
      const dy = my - hy;

      // head: exact 1:1, remember velocity to seed particles
      hvx = dx;
      hvy = dy;
      hx += dx;
      hy += dy;
      head.style.transform =
        'translate3d(' + (hx - HEAD_R) + 'px,' + (hy - HEAD_R) + 'px,0)';

      const dist = Math.hypot(dx, dy);

      // shed particles while moving (minimum spacing for a clean, sparse spray)
      if (hasMoved && dist > 0) {
        emitAcc += dist;
        while (emitAcc >= EMIT_DIST) {
          const t = EMIT_DIST / dist; // lerp fraction for this emission
          const ex = hx - hvx * t;
          const ey = hy - hvy * t;
          spawn(
            ex, ey,
            hvx * 0.32 + (Math.random() - 0.5) * JITTER,
            hvy * 0.32 + (Math.random() - 0.5) * JITTER
          );
          emitAcc -= EMIT_DIST;
        }
      }

      // evolve particles: drag, gravity, fade
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.vx *= DAMP;
        p.vy *= DAMP;
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
      }
      while (particles.length && particles[0].life <= 0) particles.shift();

      // fade in while moving, fade out when still
      const moving = dist > SHRINK;
      const target = (moving || particles.length > 0) ? 1 : 0;
      fade += (target - fade) * FADE_EASE;

      // eased hover boost (brightens the spray near interactive elements)
      const isHover = document.body.classList.contains('cursor-hover') ? 1 : 0;
      hover += (isHover - hover) * 0.15;

      // draw
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      if (fade > 0.001) {
        const baseA = 0.5 + hover * 0.3; // dim baseline, brighter on hover
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const a = Math.max(0, p.life) * baseA * fade;
          if (a <= 0) continue;
          const r = p.r * (0.6 + p.life * 0.6);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
          ctx.shadowColor = 'rgba(255,255,255,' + (a * 0.6).toFixed(3) + ')';
          ctx.shadowBlur = 4;
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      canvas.style.opacity = fade.toFixed(3);

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
