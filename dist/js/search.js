/* ============================================
   Search - client-side filtering with DOM reorder
   1) Relevance-scored sort (title > body, exact > partial)
   2) Stagger blur+dim unmatched cards (Phase 1)
   3) JS exact-height collapse hidden cards (Phase 2)
   4) Matched cards reordered to TOP; placeholder forced to bottom
   5) Clear: staged reverse — restore order (invisible) → expand → fade in
   ============================================ */

(function () {
  'use strict';

  var DEBOUNCE = 120;
  var STAGGER = 38;          // ms between each card's fade start
  var FADE_MS = 280;          // phase-1 duration
  var COLLAPSE_AT = 160;      // ms after fade before height collapse begins
  var COLLAPSE_MS = 300;      // height collapse animation
  var RESTORE_MS = 340;       // restore expand+fade duration

  var reduceMotion = !!(window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---- Relevance scoring ---- */
  // Higher score = better match → appears earlier
  function scoreMatch(item, query) {
    var q = query.toLowerCase();
    var titleEl = item.querySelector('a[href*="essay"], a[href*="note"], h2, h3');
    var titleText = titleEl ? titleEl.textContent.toLowerCase() : '';
    var bodyText = item.textContent.toLowerCase();

    var score = 0;
    if (titleText.indexOf(q) !== -1) {
      score += 100;
      if (titleText.indexOf(q) === 0) score += 20;   // title starts with query
    } else if (bodyText.indexOf(q) !== -1) {
      score += 50;
      if (bodyText.indexOf(q) === 0) score += 10;
    }
    return score;
  }

  function initSearch(listId, itemSelector) {
    var input = document.getElementById('searchInput');
    var noResults = document.getElementById('searchNoResults');
    var list = document.getElementById(listId);
    if (!input || !list) return;

    var prevMatches = new Map();
    var debounceTimer = null;
    // Capture original DOM order ONCE so clearing search can restore it
    var originalOrder = Array.prototype.slice.call(list.children);

    input.addEventListener('input', function () {
      var query = this.value.toLowerCase().trim();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        runFilter(query, list, itemSelector, noResults, prevMatches, originalOrder);
      }, DEBOUNCE);
    });
  }

  function runFilter(query, list, itemSelector, noResults, prevMatches, originalOrder) {
    var items = Array.prototype.slice.call(list.querySelectorAll(itemSelector));
    // Exclude placeholder cards — they are NOT filterable results
    items = items.filter(function (el) {
      return !el.classList.contains('essay-card-placeholder') &&
             !el.classList.contains('note-card-placeholder');
    });

    var hasQuery = query.length > 0;
    var placeholder = list.querySelector('.essay-card-placeholder, .note-card-placeholder');

    // Cancel pending timers from previous run
    if (list._timers) {
      list._timers.forEach(function (t) { clearTimeout(t); });
    }
    list._timers = [];  // always (re)initialise — first call has undefined

    // ====== CLEAR: staged reverse animation (restore order invisible → expand → fade in) ======
    if (!hasQuery) {
      // Restore original DOM order FIRST — hidden cards are collapsed (opacity:0), so
      // the reorder is invisible. Visible cards may shift slightly but they stay in the
      // same viewport area.
      originalOrder.forEach(function (el) { list.appendChild(el); });

      var wasHidden = items.filter(function (el) {
        return el.classList.contains('is-hidden');
      });

      if (!reduceMotion && wasHidden.length > 0) {
        // Pre-measure natural heights: clear inline collapse styles, read offsetHeight,
        // then snap back to 0. All invisible (is-hidden keeps opacity:0).
        var sizes = wasHidden.map(function (el) {
          el.style.height = '';
          el.style.marginTop = '';
          el.style.marginBottom = '';
          el.style.paddingTop = '';
          el.style.paddingBottom = '';
          el.style.overflow = '';

          var h = el.offsetHeight;
          var cs = getComputedStyle(el);
          var mt = parseFloat(cs.marginTop) || 0;
          var mb = parseFloat(cs.marginBottom) || 0;
          var pt = parseFloat(cs.paddingTop) || 0;
          var pb = parseFloat(cs.paddingBottom) || 0;

          // Snap back to collapsed
          el.style.height = '0';
          el.style.marginTop = '0';
          el.style.marginBottom = '0';
          el.style.paddingTop = '0';
          el.style.paddingBottom = '0';
          el.style.overflow = 'hidden';

          return { el: el, h: h, mt: mt, mb: mb, pt: pt, pb: pb };
        });

        // Force reflow so browser registers collapsed starting state
        void list.offsetHeight;

        // Staggered expand + fade in
        sizes.forEach(function (info, i) {
          info.el.classList.add('is-restoring');

          // Phase 1: animate height 0 → natural (is-hidden keeps opacity:0 during expand)
          list._timers.push(setTimeout(function () {
            info.el.style.height = info.h + 'px';
            info.el.style.marginTop = info.mt + 'px';
            info.el.style.marginBottom = info.mb + 'px';
            info.el.style.paddingTop = info.pt + 'px';
            info.el.style.paddingBottom = info.pb + 'px';
          }, i * STAGGER));

          // Phase 2: fade in — remove is-hidden so opacity/filter/transform animate to visible
          list._timers.push(setTimeout(function () {
            info.el.classList.remove('is-hidden');
          }, i * STAGGER + 80));

          // Phase 3: clean up inline styles + is-restoring class
          list._timers.push(setTimeout(function () {
            info.el.style.height = '';
            info.el.style.marginTop = '';
            info.el.style.marginBottom = '';
            info.el.style.paddingTop = '';
            info.el.style.paddingBottom = '';
            info.el.style.overflow = '';
            info.el.style.transitionDelay = '';
            info.el.classList.remove('is-restoring');
          }, i * STAGGER + 80 + RESTORE_MS));
        });
      } else {
        // Reduced motion or nothing was hidden: instant restore
        items.forEach(function (el) {
          el.style.height = '';
          el.style.marginTop = '';
          el.style.marginBottom = '';
          el.style.paddingTop = '';
          el.style.paddingBottom = '';
          el.style.overflow = '';
          el.style.transitionDelay = '';
          el.classList.remove('is-hidden', 'is-revealing', 'is-restoring');
        });
      }

      // Clean up already-visible cards (residual classes from filter flow)
      items.forEach(function (el) {
        if (!el.classList.contains('is-hidden')) {
          el.classList.remove('is-revealing');
          el.style.transitionDelay = '';
        }
        prevMatches.set(el, true);
      });

      if (placeholder) placeholder.classList.remove('is-hidden');
      if (noResults) noResults.classList.remove('visible');
      return;
    }

    // ====== FILTER: normal search flow ======
    var visibleCount = 0;
    var hiding = [];
    var revealing = [];
    var matched = [];       // { el, score }

    items.forEach(function (item) {
      var match = item.textContent.toLowerCase().indexOf(query) !== -1;
      var wasMatch = prevMatches.get(item);

      if (match) {
        visibleCount++;
        var s = scoreMatch(item, query);
        matched.push({ el: item, score: s });
        if (wasMatch === false) revealing.push({ el: item });
        // Restore collapsed inline styles immediately
        item.style.height = '';
        item.style.marginTop = '';
        item.style.marginBottom = '';
        item.style.paddingTop = '';
        item.style.paddingBottom = '';
        item.style.overflow = '';
        item.classList.remove('is-hidden', 'is-revealing', 'is-restoring');
        prevMatches.set(item, true);
      } else {
        hiding.push({ el: item });
        item.classList.add('is-hidden');
        item.classList.remove('is-revealing', 'is-restoring');
        prevMatches.set(item, false);
      }
    });

    // No-results toggle
    if (noResults) {
      noResults.classList.toggle('visible', visibleCount === 0 && hasQuery);
    }

    // Hide placeholder + push to very bottom (instant, always)
    if (placeholder) {
      placeholder.classList.add('is-hidden');
      list.appendChild(placeholder);
    }

    // ====== Sort by relevance (desc). Stable sort keeps original order within same score ======
    matched.sort(function (a, b) { return b.score - a.score; });

    // ====== Reorder DOM: matches FIRST (sorted), hidden cards keep slots, placeholder last ======
    matched.forEach(function (m, i) {
      var currentPos = -1;
      for (var c = 0; c < list.children.length; c++) {
        if (list.children[c] === m.el) { currentPos = c; break; }
      }
      if (currentPos !== i) {
        var ref = list.children[i];
        if (ref && ref !== m.el) {
          list.insertBefore(m.el, ref);
        } else if (!ref) {
          list.appendChild(m.el);
        }
      }
    });

    // Reorder above is instant (no animation) — safe under reduced motion too.
    if (reduceMotion) return;

    // --- Stagger OUT ---
    hiding.forEach(function (entry, i) {
      entry.el.style.transitionDelay = (i * STAGGER) + 'ms';
    });

    // --- Stagger IN ---
    revealing.forEach(function (entry, i) {
      entry.el.classList.add('is-revealing');
      entry.el.style.transitionDelay = (i * STAGGER + 16) + 'ms';
      (function (el, idx) {
        list._timers.push(setTimeout(function () {
          el.classList.remove('is-revealing');
          el.style.transitionDelay = '';
        }, FADE_MS + 80 + idx * STAGGER));
      })(entry.el, i);
    });

    // --- Phase 2: exact-height collapse for hidden cards ---
    hiding.forEach(function (entry, i) {
      list._timers.push(setTimeout(function () {
        var el = entry.el;
        var cs = getComputedStyle(el);
        var h = el.offsetHeight;
        var mt = parseFloat(cs.marginTop) || 0;
        var mb = parseFloat(cs.marginBottom) || 0;
        var pt = parseFloat(cs.paddingTop) || 0;
        var pb = parseFloat(cs.paddingBottom) || 0;

        // Set explicit FROM values
        el.style.height = h + 'px';
        el.style.marginTop = mt + 'px';
        el.style.marginBottom = mb + 'px';
        el.style.paddingTop = pt + 'px';
        el.style.paddingBottom = pb + 'px';

        /* force reflow */ void el.offsetHeight;

        // Collapse TO zero — CSS transition animates
        el.style.height = '0';
        el.style.marginTop = '0';
        el.style.marginBottom = '0';
        el.style.paddingTop = '0';
        el.style.paddingBottom = '0';
        el.style.overflow = 'hidden';
      }, COLLAPSE_AT + i * STAGGER));
    });

    // Cleanup after all animations settle
    var maxT = COLLAPSE_AT + hiding.length * STAGGER + COLLAPSE_MS + 60;
    list._timers.push(setTimeout(function () {
      hiding.forEach(function (e) { e.el.style.transitionDelay = ''; });
    }, maxT));
  }

  // ---- Auto-init ----
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      initSearch('notesList', '.note-card');
      initSearch('essaysList', '.essay-card');
    });
  } else {
    initSearch('notesList', '.note-card');
    initSearch('essaysList', '.essay-card');
  }
})();
