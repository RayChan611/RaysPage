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

  // 由 CSS 的 bottom transition 完成平滑过渡，去掉独立的 RAF lerp 循环
  btn.style.bottom = DEFAULT_BOTTOM + 'px';

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
        // footer 进入视口 → 抬起按钮，离开 → 降回；过渡动画交给 CSS
        btn.style.bottom = (entry.isIntersecting ? DEFAULT_BOTTOM + LIFT_HEIGHT : DEFAULT_BOTTOM) + 'px';
      },
      { threshold: 0 }
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
