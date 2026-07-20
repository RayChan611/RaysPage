/* ============================================
   ScratchToReveal - pure JS port of Inspira UI
   Canvas-based scratch-off effect with gradient cover
   ============================================ */

(function () {
  'use strict';

  // Respect reduced motion — skip the effect entirely
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Touch devices get native behavior (scratch needs precise pointer)
  if (matchMedia('(pointer: coarse)').matches) return;

  const MAX_RETRY = 15;
  const MIN_SCRATCH_PERCENT = 50;
  // Muted, darker palette — fits the B&W minimal aesthetic
  const GRADIENT_COLORS = ['#3B3654', '#4A3D5C', '#5C4A4A'];
  const BRUSH_RADIUS = 22;
  const CHECK_THROTTLE_MS = 300; // min interval between completion checks

  function hexToRgba(hex, a) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  function initCard(card) {
    // Only init once
    if (card.dataset.scratchReady === '1') return;
    card.dataset.scratchReady = '1';

    // Build DOM: canvas overlay on top of content
    const canvas = document.createElement('canvas');
    canvas.className = 'scratch-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const ctx = canvas.getContext('2d');

    // Insert canvas as first child (above content via z-index)
    card.insertBefore(canvas, card.firstChild);

    let isDrawing = false;
    let lastX = 0, lastY = 0;
    let completed = false;
    let lastCheckTime = 0;

    function resize() {
      const rect = card.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawCover();
    }

    function drawCover() {
      const rect = card.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      // Diagonal gradient using the 3 inspira colors
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, GRADIENT_COLORS[0]);
      grad.addColorStop(0.5, GRADIENT_COLORS[1]);
      grad.addColorStop(1, GRADIENT_COLORS[2]);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Subtle hint text
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SCRATCH TO REVEAL', w / 2, h / 2);
    }

    function getPos(e) {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX !== undefined ? e.clientX : e.touches[0].clientX) - rect.left;
      const y = (e.clientY !== undefined ? e.clientY : e.touches[0].clientY) - rect.top;
      return { x, y };
    }

    function scratch(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, BRUSH_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      // Smooth line between last point and current
      if (lastX !== 0 || lastY !== 0) {
        ctx.lineWidth = BRUSH_RADIUS * 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      lastX = x;
      lastY = y;
    }

    function checkCompletion() {
      if (completed) return;
      const now = Date.now();
      if (now - lastCheckTime < CHECK_THROTTLE_MS) return;
      lastCheckTime = now;

      const cw = canvas.width, ch = canvas.height;
      // 仅扫描中心 50% 区域即可判定完成度，开销降为约 1/4（避免全画布 getImageData）
      const sx = Math.floor(cw * 0.25), sy = Math.floor(ch * 0.25);
      const sw = Math.floor(cw * 0.5), sh = Math.floor(ch * 0.5);
      const imgData = ctx.getImageData(sx, sy, sw, sh);
      const total = imgData.data.length / 4;
      let cleared = 0;
      // Sample every 8th pixel for performance
      for (let i = 3; i < imgData.data.length; i += 32) {
        if (imgData.data[i] === 0) cleared++;
      }
      const pct = (cleared / (total / 8)) * 100;
      if (pct >= MIN_SCRATCH_PERCENT) {
        completed = true;
        // Fade out the rest
        canvas.style.transition = 'opacity 0.6s ease';
        canvas.style.opacity = '0';
        setTimeout(() => {
          canvas.style.pointerEvents = 'none';
          card.classList.add('scratch-revealed');
        }, 600);
      }
    }

    // Pointer events (unified mouse + touch + pen)
    function onDown(e) {
      if (completed) return;
      e.preventDefault();
      isDrawing = true;
      const { x, y } = getPos(e);
      lastX = x; lastY = y;
      scratch(x, y);
    }
    function onMove(e) {
      if (!isDrawing || completed) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      scratch(x, y);
      // Throttled check during draw
      checkCompletion();
    }
    function onUp() {
      if (!isDrawing) return;
      isDrawing = false;
      lastX = 0; lastY = 0;
      // Full check on stroke end (more accurate)
      checkCompletion();
    }

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointerleave', onUp);

    // Re-draw on resize (reset scratch — acceptable trade-off)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (!completed) resize();
      }, 200);
    });

    // Init
    resize();
  }

  function initAll(retryCount) {
    retryCount = retryCount || 0;
    const cards = document.querySelectorAll('.contact-card');
    if (!cards.length) {
      if (retryCount < MAX_RETRY) {
        setTimeout(() => initAll(retryCount + 1), 100);
      }
      return;
    }
    cards.forEach(initCard);
  }

  // Initialize on the first animation frame (no artificial delay) so the
  // scratch cover is painted in place BEFORE the page-transition overlay
  // fades out. A former 200ms setTimeout let the card content flash through
  // during the overlay fade when navigating cross-page to #contact.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(() => initAll(0)));
  } else {
    requestAnimationFrame(() => initAll(0));
  }
})();
