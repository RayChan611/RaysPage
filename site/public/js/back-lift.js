/* back-lift.js
 * --------------------------------------------------------------------------
 * Shared behaviour for essay/note detail pages.
 *
 * The "← Back" button (`.note-back-fixed`) sits fixed at the bottom-left.
 * When the page footer scrolls into view, the button smoothly lifts upward
 * so it never overlaps the footer.
 *
 * The lift uses a requestAnimationFrame lerp loop (exponential smoothing
 * with a 0.055 factor) — this is what gives the subtle inertia / "settles
 * into place" feel, rather than a hard binary jump. The lift is also
 * proportional: the button rises gradually as more of the footer comes
 * into view (intersectionRatio * 12), so it glides up as you reach the
 * bottom of the page.
 *
 * `btn.style.bottom` is driven by JS every frame, so there is intentionally
 * NO `bottom` transition in CSS — adding one would fight the lerp.
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
  var LERP = 0.055; // smoothing factor — smaller = floatier inertia

  var currentBottom = DEFAULT_BOTTOM;
  var targetBottom = DEFAULT_BOTTOM;
  var animId = null;

  function tick() {
    var diff = targetBottom - currentBottom;
    if (Math.abs(diff) < 0.3) {
      currentBottom = targetBottom;
      btn.style.bottom = currentBottom + 'px';
      animId = null;
      return;
    }
    // exponential smoothing → smooth glide with a little inertia
    currentBottom += diff * LERP;
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
        // proportional lift: rises gradually as the footer scrolls in
        var lifted = Math.min(1, entry.intersectionRatio * 12);
        targetBottom = DEFAULT_BOTTOM + LIFT_HEIGHT * lifted;
        if (!animId) animId = requestAnimationFrame(tick);
      },
      // dense thresholds → smooth proportional updates as footer enters
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
