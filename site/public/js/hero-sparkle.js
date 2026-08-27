/**
 * hero-sparkle.js
 * Canvas particle effect for notes/essays/photos pages.
 * Ported from Inspira UI <Sparkles> component.
 */
(function () {
  // 计量网络用户跳过粒子特效
  if (window.__reducedData) return;
  const CANVAS_ID = 'hero-sparkle-canvas';
  const MIN_SIZE   = 0.6;
  const MAX_SIZE   = 1.7;
  const DENSITY    = 45;    // particles per 1000px² (slightly bumped from 35)
  const COLORS     = ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.32)', 'rgba(210,210,210,0.4)', 'rgba(255,255,255,0.22)'];
  const TOUCH_DEVICE = Boolean(
    (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches) ||
    navigator.maxTouchPoints > 0
  );
  const MAX_PARTICLES = TOUCH_DEVICE ? 36 : 80;
  const TARGET_FPS = TOUCH_DEVICE ? 30 : 60;
  const FRAME_INTERVAL = TOUCH_DEVICE ? 1000 / TARGET_FPS : 0;
  const RESIZE_DEBOUNCE = 150; // ms

  let canvas, ctx, particles = [];
  let w, h, animId = null;
  let resizeTimer = null;
  let lastFrame = 0;

  /* ---- Particle ---- */
  function rand(a, b) { return a + Math.random() * (b - a); }

  class Particle {
    constructor() { this.reset(true); }
    reset(initial) {
      this.x = rand(0, w);
      this.y = initial ? rand(0, h) : h + 10;
      this.r = rand(MIN_SIZE, MAX_SIZE);
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.vx = rand(-0.15, 0.15);
      this.vy = rand(-0.35, -0.08);
      this.life = 1;
      this.decay = rand(0.002, 0.006);
      this.phase = rand(0, Math.PI * 2);
      this.speed = rand(0.01, 0.03);
    }
    update() {
      this.phase += this.speed;
      this.x += this.vx + Math.sin(this.phase) * 0.12;
      this.y += this.vy;
      this.life -= this.decay;
      if (this.life <= 0 || this.y < -20 || this.x < -20 || this.x > w + 20) {
        this.reset(false);
      }
    }
    draw() {
      // Inline draw — no save/restore, no shadowBlur (massive perf win)
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = Math.max(0, this.life * 0.8);
      ctx.fill();
    }
  }

  /* ---- Init ---- */
  function resize() {
    if (!canvas || !ctx || !canvas.parentElement) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.parentElement.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width  = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width  = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticles() {
    const area = w * h;
    const target = Math.min(Math.floor(area / 1000 * (DENSITY / 100)), MAX_PARTICLES);
    // Trim excess when viewport shrinks
    if (particles.length > target) {
      particles.length = target;
    }
    while (particles.length < target) {
      particles.push(new Particle());
    }
  }

  function animate(timestamp) {
    animId = requestAnimationFrame(animate);
    if (FRAME_INTERVAL && lastFrame && timestamp - lastFrame < FRAME_INTERVAL) return;
    lastFrame = timestamp;
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1; // reset once per frame
    for (const p of particles) { p.update(); p.draw(); }
  }

  function start() {
    if (animId) return;
    lastFrame = 0;
    animId = requestAnimationFrame(animate);
  }
  function stop() {
    if (animId) cancelAnimationFrame(animId);
    animId = null;
    lastFrame = 0;
  }

  function init() {
    canvas = document.getElementById(CANVAS_ID);
    if (!canvas) return false;
    canvas.dataset.particleLimit = String(MAX_PARTICLES);
    canvas.dataset.frameRate = String(TARGET_FPS);

    // Skip on reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return false;
    }

    ctx = canvas.getContext('2d');
    if (!ctx) return false;
    resize();
    createParticles();

    if (animId) cancelAnimationFrame(animId);
    start();

    // The hero-bg-effect is `position: fixed; inset: 0` and stays visible
    // across the whole page, so the particle loop must keep running while the
    // tab is visible. We only pause for hidden tabs (delegated to RayRAF) —
    // pausing on scroll-out would freeze the background while it is still on
    // screen, which reads as a bug.
    if (window.RayRAF) {
      window.RayRAF.register({ start, stop });
    }

    // RayRAF pauses on hidden/pagehide and restarts on visible/pageshow,
    // including restoration from the browser back-forward cache.
    return true;
  }

  /* ---- Boot ---- */
  function boot() {
    function startEffect() {
      // Only install listeners after a canvas context exists. In reduced-motion
      // mode init() intentionally stops before context creation.
      if (!init()) return;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          resize();
          createParticles();
        }, RESIZE_DEBOUNCE);
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', startEffect, { once: true });
    } else {
      startEffect();
    }
  }

  boot();
})();
