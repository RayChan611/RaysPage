/* Lightweight, motion-aware background for the standalone 404 page. */
(function () {
  'use strict';

  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reduceData = window.matchMedia('(prefers-reduced-data: reduce)').matches;
  if (reduceMotion || reduceData) {
    canvas.hidden = true;
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let animationId = null;
  const particles = [];

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function createParticle() {
    return {
      x: Math.random() * width,
      y: height + 10,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -(Math.random() * 0.5 + 0.2),
      alpha: Math.random() * 0.5 + 0.2,
    };
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    while (particles.length < 50) particles.push(createParticle());

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.alpha -= 0.002;

      if (particle.alpha <= 0 || particle.y < -10) {
        particles.splice(index, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
      ctx.fill();
    }

    animationId = window.requestAnimationFrame(animate);
  }

  function start() {
    if (animationId === null && !document.hidden) animate();
  }

  function stop() {
    if (animationId !== null) {
      window.cancelAnimationFrame(animationId);
      animationId = null;
    }
  }

  resize();
  start();
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () {
    document.hidden ? stop() : start();
  });
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', start);
})();
