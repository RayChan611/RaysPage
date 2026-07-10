/* ============================================
   Search - client-side filtering with DOM reorder
   1) Relevance-scored sort (title > body, exact > partial)
   2) Stagger blur+dim unmatched cards (Phase 1)
   3) JS exact-height collapse hidden cards (Phase 2)
   4) Matched cards reordered to TOP; placeholder forced to bottom
   5) Clear: FLIP reverse — capture positions, restore order, then animate
   ============================================ */

(function () {
  'use strict';

  var DEBOUNCE = 120;
  var STAGGER = 38;          // ms between each card's fade start
  var FADE_MS = 280;          // phase-1 duration
  var COLLAPSE_AT = 160;      // ms after fade before height collapse begins
  var COLLAPSE_MS = 300;      // height collapse animation

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

  function cleanupCard(el) {
    el.style.height = '';
    el.style.marginTop = '';
    el.style.marginBottom = '';
    el.style.paddingTop = '';
    el.style.paddingBottom = '';
    el.style.overflow = '';
    el.style.transitionDelay = '';
    el.style.transition = '';
    el.style.transform = '';
    el.style.opacity = '';
    el.style.filter = '';
    el.style.pointerEvents = '';
    el._searchAnim = null;
    el.classList.remove('is-hidden', 'is-revealing', 'is-flipping');
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

    // Snapshot hidden state BEFORE we touch any classes — the clear path needs
    // it to know which cards to float back in (cleanupCard below strips is-hidden).
    var hiddenSnapshot = new Map();
    items.forEach(function (el) {
      hiddenSnapshot.set(el, el.classList.contains('is-hidden'));
    });

    // Cancel any in-flight FLIP animation + clear residual inline styles so a
    // quick re-type mid-clear can't leave a card stuck invisible/blurred.
    items.forEach(function (el) {
      if (el._searchAnim) { el._searchAnim.cancel(); el._searchAnim = null; }
      cleanupCard(el);
    });

    // Cancel pending timers from previous run
    if (list._timers) {
      list._timers.forEach(function (t) { clearTimeout(t); });
    }
    list._timers = [];  // always (re)initialise — first call has undefined

    // ====== CLEAR: WAAPI FLIP reverse animation (no height snapping, no stagger pause) ======
    if (!hasQuery) {
      noResults && noResults.classList.remove('visible');
      if (placeholder) placeholder.classList.remove('is-hidden');

      // (timers + in-flight WAAPI already cancelled at the top of runFilter)

      if (reduceMotion || !Element.prototype.animate) {
        originalOrder.forEach(function (el) { list.appendChild(el); });
        items.forEach(function (el) { cleanupCard(el); });
        prevMatches.clear();
        items.forEach(function (el) { prevMatches.set(el, true); });
        return;
      }

      // 1) Capture current positions of every card (visible + hidden)
      var firstRects = new Map();
      items.forEach(function (el) {
        firstRects.set(el, el.getBoundingClientRect());
      });

      // 2) Reveal hidden cards in the DOM but keep them visually identical to
      //    the .is-hidden state so there is zero flash while we measure.
      items.forEach(function (el) {
        if (!hiddenSnapshot.get(el)) return;
        el.classList.remove('is-hidden');
        el.style.opacity = '0';
        el.style.filter = 'blur(4px) brightness(0.3)';
        el.style.transform = 'translateY(-6px) scale(0.96)';
        el.style.pointerEvents = 'none';
        el.style.overflow = 'hidden';
      });

      // 3) Restore original order
      originalOrder.forEach(function (el) { list.appendChild(el); });

      // 4) Measure final layout with all cards at their natural height
      void list.offsetHeight;
      var lastRects = new Map();
      items.forEach(function (el) {
        lastRects.set(el, el.getBoundingClientRect());
      });

      // 5) Snap every card visually back to where it was before the DOM change
      items.forEach(function (el) {
        var f = firstRects.get(el);
        var l = lastRects.get(el);
        var dx = f.left - l.left;
        var dy = f.top - l.top;
        var hidden = hiddenSnapshot.get(el);

        if (hidden) {
          el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) translateY(-12px) scale(0.96)';
          el.style.opacity = '0';
          el.style.filter = 'blur(4px) brightness(0.3)';
        } else {
          el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
          el.style.opacity = '';
          el.style.filter = '';
        }
        el.style.pointerEvents = 'none';
        el.style.transition = 'none';
        el.classList.add('is-flipping');
      });

      // 6) Play WAAPI animations on the compositor (smooth, no layout thrash)
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          items.forEach(function (el, i) {
            var hidden = hiddenSnapshot.get(el);
            var f = firstRects.get(el);
            var l = lastRects.get(el);
            var dx = f.left - l.left;
            var dy = f.top - l.top;

            var keyframes;
            if (hidden) {
              keyframes = [
                {
                  transform: 'translate(' + dx + 'px, ' + dy + 'px) translateY(-12px) scale(0.96)',
                  opacity: '0',
                  filter: 'blur(4px) brightness(0.3)'
                },
                {
                  transform: 'translate(0, 0) scale(1)',
                  opacity: '1',
                  filter: 'blur(0px) brightness(1)'
                }
              ];
            } else {
              keyframes = [
                { transform: 'translate(' + dx + 'px, ' + dy + 'px)' },
                { transform: 'translate(0, 0)' }
              ];
            }

            var opts = {
              duration: hidden ? 720 : 760,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              fill: 'backwards'
            };
            if (hidden) {
              // Gentle stagger so hidden cards bloom rather than popping all at once
              opts.delay = Math.min(i * 26, 240);
            }

            var anim = el.animate(keyframes, opts);
            el._searchAnim = anim;

            anim.onfinish = function () {
              if (el._searchAnim === anim) el._searchAnim = null;
              cleanupCard(el);
            };
          });

          // Safety net: clean up if onfinish ever fails to fire
          list._timers.push(setTimeout(function () {
            items.forEach(cleanupCard);
          }, 1300));
        });
      });

      items.forEach(function (el) { prevMatches.set(el, true); });
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
        item.classList.remove('is-hidden', 'is-revealing');
        prevMatches.set(item, true);
      } else {
        hiding.push({ el: item });
        item.classList.add('is-hidden');
        item.classList.remove('is-revealing');
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
