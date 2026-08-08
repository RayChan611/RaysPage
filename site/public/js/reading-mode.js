/* Focused reading mode for essay and detailed-note pages. */
(function () {
  'use strict';

  function initReadingMode() {
    var toggle = document.getElementById('readingModeToggle');
    if (!toggle) return;

    var label = toggle.querySelector('[data-reading-mode-label]');

    function setReadingMode(active) {
      document.body.classList.toggle('reading-mode-active', active);
      toggle.setAttribute('aria-pressed', String(active));
      toggle.setAttribute('aria-label', active ? '退出专注阅读模式' : '开启专注阅读模式');
      if (label) label.textContent = active ? 'Exit focus' : 'Focus';
      document.dispatchEvent(new CustomEvent('ray:reading-mode', { detail: { active: active } }));
    }

    toggle.addEventListener('click', function () {
      setReadingMode(!document.body.classList.contains('reading-mode-active'));
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && document.body.classList.contains('reading-mode-active')) {
        setReadingMode(false);
        toggle.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReadingMode);
  } else {
    initReadingMode();
  }
})();
