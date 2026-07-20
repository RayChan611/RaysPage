/**
 * hero-typewriter.js
 * Typewriter effect for hero tagline
 *
 * Performance: uses createTextNode + appendChild instead of innerHTML
 * to avoid full HTML re-parse on every character.
 *
 * Starts as soon as the hero name entrance animation finishes, driven by
 * the CSS transitionend event on the last name line. A reduced-motion
 * check + fallback timeout keeps it robust if transitions are disabled.
 */
(function () {
  const TARGET_ID = 'hero-tagline';

  const LINES      = ['Ground-up rebuild.', 'Capabilities. Mindset. Vision.'];
  const SPEED      = 80;    // ms per character
  const LINE_PAUSE = 400;   // ms to pause after finishing a line (before <br>)
  const FALLBACK_MS = 2500; // safety net if transition events never fire

  function typewrite() {
    const el = document.getElementById(TARGET_ID);
    if (!el || el.textContent) return;

    el.setAttribute('aria-label', LINES.join(' '));
    el.classList.add('typing');

    const lineNodes = [];
    LINES.forEach((line, i) => {
      const tn = document.createTextNode('');
      el.appendChild(tn);
      lineNodes.push(tn);
      if (i < LINES.length - 1) {
        el.appendChild(document.createElement('br'));
      }
    });

    let lineIndex = 0;
    let charIndex = 0;
    let lastTime = 0;

    function tick(now) {
      if (now - lastTime < SPEED) {
        requestAnimationFrame(tick);
        return;
      }
      lastTime = now;

      const line = LINES[lineIndex];
      charIndex++;
      lineNodes[lineIndex].nodeValue = line.slice(0, charIndex);

      if (charIndex >= line.length) {
        if (lineIndex < LINES.length - 1) {
          lineIndex++;
          charIndex = 0;
          setTimeout(function () {
            lastTime = performance.now();
            requestAnimationFrame(tick);
          }, LINE_PAUSE);
          return;
        } else {
          el.classList.remove('typing');
          return;
        }
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function start() {
    // Short buffer after the name entrance finishes so the tagline settles.
    setTimeout(typewrite, 120);
  }

  function isReady(heroText) {
    // If reduced motion is preferred, CSS transitions are effectively instant — start now.
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
    // If the hero animation has already completed, the last line is fully opaque.
    const lastLine = heroText.querySelector('.hero-name-line:last-child');
    if (lastLine) {
      const style = window.getComputedStyle(lastLine);
      const opacity = parseFloat(style.opacity);
      if (opacity >= 0.99) return true;
    }
    return false;
  }

  function init() {
    const heroText = document.querySelector('.hero-text');
    const lines = heroText ? Array.from(heroText.querySelectorAll('.hero-name-line')) : [];

    if (!lines.length) {
      setTimeout(typewrite, FALLBACK_MS);
      return;
    }

    // If already loaded (e.g. reduced motion or cached state), start immediately.
    if (heroText.classList.contains('hero-loaded') && isReady(heroText)) {
      start();
      return;
    }

    let started = false;
    const lastLine = lines[lines.length - 1];

    function cleanup() {
      lines.forEach(function (l) { l.removeEventListener('transitionend', onTransitionEnd); });
    }

    function onTransitionEnd(e) {
      if (started) return;
      // Only fire once, from the last name line.
      if (e.target !== lastLine) return;
      started = true;
      cleanup();
      start();
    }

    lines.forEach(function (l) { l.addEventListener('transitionend', onTransitionEnd); });

    // Fallback: if transitions never fire, start after a generous timeout.
    setTimeout(function () {
      if (!started) {
        started = true;
        cleanup();
        typewrite();
      }
    }, FALLBACK_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
