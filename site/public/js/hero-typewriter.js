/**
 * hero-typewriter.js
 * Typewriter effect for hero tagline
 *
 * Performance: uses createTextNode + appendChild instead of innerHTML
 * to avoid full HTML re-parse on every character.
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

    // Build DOM structure once: one text node per line, separated by <br>
    const lineNodes = [];   // Array<Text>
    const brs = [];         // Array<HTMLElement>
    LINES.forEach((line, i) => {
      const tn = document.createTextNode('');
      el.appendChild(tn);
      lineNodes.push(tn);
      if (i < LINES.length - 1) {
        const br = document.createElement('br');
        el.appendChild(br);
        brs.push(br);
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
      // Incremental update — only modify the current line's text node
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

  function init() {
    const heroText = document.querySelector('.hero-text');
    if (!heroText) {
      setTimeout(typewrite, START_AFTER_HERO_LOADED);
      return;
    }
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.target.classList.contains('hero-loaded')) {
          observer.disconnect();
          setTimeout(typewrite, START_AFTER_HERO_LOADED);
        }
      });
    });
    observer.observe(heroText, { attributes: true, attributeFilter: ['class'] });

    // Fallback: if hero-loaded never fires, start anyway after 5s
    setTimeout(function () {
      var el = document.getElementById(TARGET_ID);
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
