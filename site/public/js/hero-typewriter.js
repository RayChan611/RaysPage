/**
 * hero-typewriter.js
 * Typewriter effect for hero tagline
 *
 * IMPORTANT: Waits until name animation fully finishes before starting,
 * to avoid reflow competition with CSS transitions on .hero-name-line.
 */
(function () {
  const TARGET_ID = 'hero-tagline';

  // Wait until ALL name-line transitions have finished before starting typewriter.
  // Name animation timeline (from style.css):
  //   line 1: delay 0.35s + duration 0.7s  = finishes at 1.05s
  //   line 2: delay 0.60s + duration 0.7s  = finishes at 1.30s
  // Add 200ms buffer → start typewriter at 1.50s after .hero-loaded
  const START_AFTER_HERO_LOADED = 1500;  // ms

  // Lines to type, one per line
  const LINES      = ['Ground-up rebuild.', 'Capabilities. Mindset. Vision.'];
  const SPEED      = 80;    // ms per character
  const LINE_PAUSE = 400;   // ms to pause after finishing a line (before <br>)

  function typewrite() {
    const el = document.getElementById(TARGET_ID);
    if (!el) return;

    el.setAttribute('aria-label', LINES.join(' '));
    el.classList.add('typing');

    let lineIndex = 0;   // which line we're on
    let charIndex = 0;    // which char within current line
    let currentHTML = '';  // accumulated HTML (lines + <br>)
    let lastTime = 0;

    function tick(now) {
      if (now - lastTime < SPEED) {
        requestAnimationFrame(tick);
        return;
      }
      lastTime = now;

      // Type next character
      const line = LINES[lineIndex];
      charIndex++;
      currentHTML = LINES.slice(0, lineIndex).map(l => l + '<br>').join('') + line.slice(0, charIndex);
      el.innerHTML = currentHTML;

      // If finished current line
      if (charIndex >= line.length) {
        // If more lines left, add <br> and move to next line
        if (lineIndex < LINES.length - 1) {
          currentHTML = LINES.slice(0, lineIndex + 1).map(l => l + '<br>').join('');
          el.innerHTML = currentHTML;
          lineIndex++;
          charIndex = 0;
          // Pause before typing next line
          setTimeout(() => {
            lastTime = performance.now();
            requestAnimationFrame(tick);
          }, LINE_PAUSE);
          return;
        } else {
          // All done
          el.classList.remove('typing');
          return;
        }
      }

      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function init() {
    const heroText = document.querySelector('.hero-text');
    if (!heroText) {
      setTimeout(typewrite, START_AFTER_HERO_LOADED);
      return;
    }
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.target.classList.contains('hero-loaded')) {
          observer.disconnect();
          // Wait until name animation fully completes before starting typewriter
          setTimeout(typewrite, START_AFTER_HERO_LOADED);
        }
      });
    });
    observer.observe(heroText, { attributes: true, attributeFilter: ['class'] });

    // Fallback: if hero-loaded never fires, start anyway after 5s
    setTimeout(() => {
      const el = document.getElementById(TARGET_ID);
      if (el && !el.textContent) {
        observer.disconnect();
        typewrite();
      }
    }, 5000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
