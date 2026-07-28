/* back-lift.js
 * --------------------------------------------------------------------------
 * Shared behaviour for all pages.
 *
 * Lifts two fixed UI elements upward when the page footer scrolls into
 * view, so they never overlap the footer's text content:
 *
 *   - `.note-back-fixed`  ← Back button on essay/note detail pages
 *   - `#backToTop`        Back to top arrow (every page)
 *
 * The lift uses a requestAnimationFrame lerp loop (exponential smoothing,
 * factor 0.055) — this is what gives the subtle inertia / "settles into
 * place" feel rather than a hard binary jump. The lift is also proportional
 * to the footer's intersection ratio (ratio * 12, capped at 1), so the
 * buttons glide up gradually as you reach the bottom of the page.
 *
 * The lift amount is computed from the actual footer height, so each
 * button lands a fixed gap (GAP) above the divider line (the footer's
 * border-top). This works for footers of any height and adapts to resize.
 *
 * `el.style.bottom` is driven by JS every frame, so there is intentionally
 * NO `bottom` transition in CSS — adding one would fight the lerp.
 *
 * Generic: it only acts if at least one of the two buttons exists, so
 * including it on pages without either is a no-op.
 */
(function () {
  var RETRY_MS = 300;
  var LERP = 0.055;       // smoothing factor — smaller = floatier inertia
  var GAP = 16;           // px of clearance above the footer's top edge

  var backBtn = document.querySelector('.note-back-fixed');
  var topBtn = document.getElementById('backToTop');
  if (!backBtn && !topBtn) return;

  // Each button has its own resting bottom (its CSS-declared position).
  var buttons = [];
  if (backBtn) buttons.push({ el: backBtn, def: 32, lift: 0, current: 32, target: 32 });
  if (topBtn) buttons.push({ el: topBtn, def: 26, lift: 0, current: 26, target: 26 });

  var animId = null;

  function tick() {
    var maxDiff = 0;
    for (var i = 0; i < buttons.length; i++) {
      var d = Math.abs(buttons[i].target - buttons[i].current);
      if (d > maxDiff) maxDiff = d;
    }
    if (maxDiff < 0.3) {
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].current = buttons[i].target;
        buttons[i].el.style.bottom = buttons[i].current + 'px';
      }
      animId = null;
      return;
    }
    // exponential smoothing → smooth glide with a little inertia
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      b.current += (b.target - b.current) * LERP;
      b.el.style.bottom = b.current + 'px';
    }
    animId = requestAnimationFrame(tick);
  }

  function setupFooterObserver() {
    var footer = document.querySelector('.footer');
    if (!footer) {
      setTimeout(setupFooterObserver, RETRY_MS);
      return;
    }

    // Per-button lift amount, computed from actual footer height.
    // Target when fully visible = footerHeight + GAP (lands GAP px above divider).
    function recomputeLifts() {
      var fh = footer.offsetHeight;
      for (var i = 0; i < buttons.length; i++) {
        buttons[i].lift = fh + GAP - buttons[i].def;
      }
    }
    recomputeLifts();

    var io = new IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        if (!entry) return;
        // proportional lift: rises gradually as the footer scrolls in
        var lifted = Math.min(1, entry.intersectionRatio * 12);
        for (var i = 0; i < buttons.length; i++) {
          buttons[i].target = buttons[i].def + buttons[i].lift * lifted;
        }
        if (!animId) animId = requestAnimationFrame(tick);
      },
      // dense thresholds → smooth proportional updates as footer enters
      { threshold: Array.from({ length: 101 }, function (_, i) { return i / 100; }) }
    );

    io.observe(footer);

    // Recompute lifts when the footer resizes (responsive padding etc.)
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(recomputeLifts, 100);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(setupFooterObserver, 200);
    });
  } else {
    setTimeout(setupFooterObserver, 200);
  }
})();
