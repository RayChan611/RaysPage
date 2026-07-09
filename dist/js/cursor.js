/* ============================================
   Custom Cursor - desktop only
   Delayed init so BaseLayout can render DOM first
   ============================================ */

(function () {
  'use strict';

  // Respect reduced motion preference
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  function init() {
    if (window.innerWidth <= 768) return;

    const dot = document.getElementById('cursorDot');
    const outline = document.getElementById('cursorOutline');
    if (!dot || !outline) {
      // BaseLayout hasn't rendered yet, retry shortly
      setTimeout(init, 50);
      return;
    }

    // Mark body so CSS can hide default cursor
    document.body.classList.add('custom-cursor-active');

    let mouseX = 0, mouseY = 0;
    let outlineX = 0, outlineY = 0;
    let animId = null;
    let hasMoved = false; // track if user has moved mouse yet

    // Hide cursor initially to prevent (0,0) flash on page navigation
    dot.style.opacity = '0';
    outline.style.opacity = '0';

    // Use pointermove instead of mousemove to capture all pointer types
    // (mouse, touchpad, pen) including during pointer capture (e.g. scratch-to-reveal)
    document.addEventListener('pointermove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = (mouseX - 3) + 'px';
      dot.style.top = (mouseY - 3) + 'px';
      dot.style.opacity = '1';

      // First move: reveal outline and kick off animation if not yet started
      if (!hasMoved) {
        hasMoved = true;
        outlineX = mouseX;
        outlineY = mouseY;
        outline.style.left = (outlineX - 15) + 'px';
        outline.style.top = (outlineY - 15) + 'px';
        outline.style.opacity = '1';
        if (!animId) animId = requestAnimationFrame(animateOutline);
      } else if (!animId) {
        // Restart RAF if it was stopped (mouse moved again after settling)
        animId = requestAnimationFrame(animateOutline);
      }
    }, { capture: true });

    function animateOutline() {
      outlineX += (mouseX - outlineX) * 0.12;
      outlineY += (mouseY - outlineY) * 0.12;
      outline.style.left = (outlineX - 15) + 'px';
      outline.style.top = (outlineY - 15) + 'px';

      // Stop RAF when outline is close enough to mouse — saves CPU when idle
      const dx = mouseX - outlineX;
      const dy = mouseY - outlineY;
      if (dx * dx + dy * dy < 0.5) {
        animId = null; // stop loop, will restart on next pointermove
        return;
      }
      animId = requestAnimationFrame(animateOutline);
    }
    // Animation now starts on first mousemove event (see above)
    // This avoids the cursor jumping to (0,0) on page navigation

    // Pause on hidden tab to save CPU — delegated to the shared manager.
    if (window.RayRAF) {
      window.RayRAF.register({
        start: function () { if (!animId) animId = requestAnimationFrame(animateOutline); },
        stop:  function () { if (animId) { cancelAnimationFrame(animId); animId = null; } },
      });
    }

    // Hover effects on interactive elements (event delegation)
    document.addEventListener('mouseover', function (e) {
      const target = e.target.closest('a, button, .contact-card, .tag, .social-link, .gallery-item, .essay-card');
      if (target) {
        dot.style.transform = 'scale(2.5)';
        outline.style.width = '40px';
        outline.style.height = '40px';
        outline.style.borderColor = 'rgba(255,255,255,0.7)';
      }
    });
    document.addEventListener('mouseout', function (e) {
      const target = e.target.closest('a, button, .contact-card, .tag, .social-link, .gallery-item, .essay-card');
      if (target) {
        dot.style.transform = 'scale(1)';
        outline.style.width = '30px';
        outline.style.height = '30px';
        outline.style.borderColor = 'rgba(255,255,255,0.4)';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 50));
  } else {
    setTimeout(init, 50);
  }
})();
