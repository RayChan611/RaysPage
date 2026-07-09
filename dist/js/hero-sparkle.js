/**
 * hero-sparkle.js
 * Canvas particle effect for notes/essays/photos pages.
 * Ported from Inspira UI <Sparkles> component.
 */
(function () {
  const CANVAS_ID = 'hero-sparkle-canvas';
  const MIN_SIZE   = 0.6;
  const MAX_SIZE   = 1.7;
  const DENSITY    = 45;    // particles per 1000px² (slightly bumped from 35)
  const COLORS     = ['rgba(255,255,255,0.5)', 'rgba(255,255,255,0.32)', 'rgba(210,210,210,0.4)', 'rgba(255,255,255,0.22)'];
  const MAX_PARTICLES = 80; // cap for low-end devices (bumped from 60)
  const RESIZE_DEBOUNCE = 150; // ms

  let canvas, ctx, particles = [];
  let w, h, animId = null;
  let resizeTimer = null;

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

  function animate() {
    ctx.clearRect(0, 0, w, h);
    ctx.globalAlpha = 1; // reset once per frame
    for (const p of particles) { p.update(); p.draw(); }
    animId = requestAnimationFrame(animate);
  }

  function init() {
    canvas = document.getElementById(CANVAS_ID);
    if (!canvas) return;

    // Skip on reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      canvas.style.display = 'none';
      return;
    }

    ctx = canvas.getContext('2d');
    resize();
    createParticles();

    if (animId) cancelAnimationFrame(animId);
    animate();

    // The sparkle canvas is position:fixed and fills the viewport, so it stays
    // visible while the user scrolls — keep animating. We only pause when the
    // tab itself is hidden (saves CPU/GPU), never on scroll.
    // Delegated to the shared manager (window.RayRAF): a single visibilitychange
    // listener on the page now handles every animation loop.
    if (window.RayRAF) {
      window.RayRAF.register({
        start: function () { if (!animId) animate(); },
        stop:  function () { if (animId) { cancelAnimationFrame(animId); animId = null; } },
      });
    }

    // Cleanup on page unload (SPA navigation, bfcache)
    window.addEventListener('pagehide', () => {
      if (animId) { cancelAnimationFrame(animId); animId = null; }
    });
  }

  /* ---- Boot ---- */
  function boot() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }

    // Debounced resize
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        createParticles();
      }, RESIZE_DEBOUNCE);
    });
  }

  boot();
})();
