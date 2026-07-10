/* back-lift.js
 * --------------------------------------------------------------------------
 * Shared behaviour for essay/note detail pages.
 *
 * The "← Back" button (`.note-back-fixed`) sits fixed at the bottom-left.
 * When the page footer scrolls into view, the button smoothly lifts upward
 * so it never overlaps the footer. Promoted from the per-page `inlineScripts`
 * (was duplicated on every essay/note detail page) into this shared file.
 *
 * Generic: it only acts if a `.note-back-fixed` element exists, so including
 * it on pages without one is a no-op.
 */
(function () {
  var RETRY_MS = 300;

  var btn = document.querySelector('.note-back-fixed');
  if (!btn) return;

  var DEFAULT_BOTTOM = 32;
  var LIFT_HEIGHT = 78;
  var currentBottom = DEFAULT_BOTTOM;
  var targetBottom = DEFAULT_BOTTOM;
  var animId = null;

  // Slow lerp — smooths the position change over many frames
  function tick() {
    var diff = targetBottom - currentBottom;
    if (Math.abs(diff) < 0.3) {
      currentBottom = targetBottom;
      btn.style.bottom = currentBottom + 'px';
      animId = null;
      return; // stop RAF loop when stable
    }
    currentBottom += diff * 0.055; // 5.5% per frame ≈ 300ms to cross 78px
    btn.style.bottom = currentBottom + 'px';
    animId = requestAnimationFrame(tick);
  }

  function setupFooterObserver() {
    var footer = document.querySelector('.footer');
    if (!footer) {
      setTimeout(setupFooterObserver, RETRY_MS);
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        if (!entry) return;
        var ratio = entry.intersectionRatio;
        var lifted = Math.min(1, ratio * 12);
        targetBottom = DEFAULT_BOTTOM + LIFT_HEIGHT * lifted;
        if (!animId) animId = requestAnimationFrame(tick);
      },
      { threshold: Array.from({ length: 101 }, function (_, i) { return i / 100; }) }
    );

    io.observe(footer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(setupFooterObserver, 200);
    });
  } else {
    setTimeout(setupFooterObserver, 200);
  }
})();
