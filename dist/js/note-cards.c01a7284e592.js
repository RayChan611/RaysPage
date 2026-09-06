/* Compact standalone note excerpts with an accessible expand/collapse control. */
(function () {
  'use strict';

  function initNoteCards() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('[data-note-expand]'));
    if (!buttons.length) return;

    function measure(button) {
      var card = button.closest('.note-card');
      var excerpt = card && card.querySelector('.note-excerpt');
      if (!card || !excerpt) return;

      card.style.setProperty('--note-expanded-height', excerpt.scrollHeight + 'px');

      var collapsedValue = getComputedStyle(card).getPropertyValue('--note-collapsed-height').trim();
      var collapsedHeight = parseFloat(collapsedValue);
      if (collapsedValue.endsWith('rem')) {
        collapsedHeight *= parseFloat(getComputedStyle(document.documentElement).fontSize);
      }
      var needsToggle = excerpt.scrollHeight > collapsedHeight + 2;
      button.hidden = !needsToggle;
      card.classList.toggle('note-card--complete', !needsToggle);
    }

    buttons.forEach(function (button) {
      measure(button);
      button.addEventListener('click', function () {
        var card = button.closest('.note-card');
        if (!card) return;
        var expanded = card.classList.toggle('is-expanded');
        button.setAttribute('aria-expanded', String(expanded));
        var label = button.querySelector('[data-note-expand-label]');
        if (label) label.textContent = expanded ? '收起' : '展开全部';
      });
    });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        buttons.forEach(measure);
      }, 120);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNoteCards);
  } else {
    initNoteCards();
  }
})();
