/* 全站 Cmd/Ctrl+K 搜索：输入、真实焦点与结果导航保持一致。 */
(function () {
  'use strict';

  var root = document.getElementById('quickSearch');
  var trigger = document.getElementById('quickSearchTrigger');
  var input = document.getElementById('quickSearchInput');
  var results = document.getElementById('quickSearchResults');
  var status = document.getElementById('quickSearchStatus');
  if (!root || !trigger || !input || !results || !status) return;

  var searchIndex = null;
  var loadingPromise = null;
  var activeIndex = -1;
  var lastFocused = null;
  var closeTimer = null;
  var openFrame = null;
  var composing = false;
  var searchRequest = 0;
  var backgroundState = new Map();
  var isMac = /Mac|iPhone|iPad|iPod/.test(navigator.platform || '');
  var shortcut = document.querySelector('[data-search-shortcut]');
  if (shortcut) shortcut.textContent = isMac ? '\u2318K' : 'Ctrl K';

  var TYPE_LABELS = {
    page: 'Page',
    essay: 'Essay',
    note: 'Note',
    photo: 'Photo',
  };

  function setBackgroundInert(enabled) {
    Array.prototype.forEach.call(document.body.children, function (element) {
      if (element === root || element.id === 'pageTransitionOverlay' || element.tagName === 'SCRIPT') return;
      if (enabled) {
        if (!backgroundState.has(element)) {
          backgroundState.set(element, {
            ariaHidden: element.getAttribute('aria-hidden'),
            inert: element.hasAttribute('inert'),
          });
        }
        element.setAttribute('inert', '');
        element.setAttribute('aria-hidden', 'true');
      } else {
        var previous = backgroundState.get(element);
        if (!previous) return;
        if (previous.inert) element.setAttribute('inert', '');
        else element.removeAttribute('inert');
        if (previous.ariaHidden === null) element.removeAttribute('aria-hidden');
        else element.setAttribute('aria-hidden', previous.ariaHidden);
      }
    });
    if (!enabled) backgroundState.clear();
  }

  function normalise(value) {
    return String(value || '').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  }

  function loadIndex() {
    if (searchIndex) return Promise.resolve(searchIndex);
    if (loadingPromise) return loadingPromise;

    status.textContent = 'Loading the archive…';
    loadingPromise = fetch('/search-index.json', { headers: { Accept: 'application/json' } })
      .then(function (response) {
        if (!response.ok) throw new Error('Search index request failed');
        return response.json();
      })
      .then(function (items) {
        searchIndex = items.map(function (item) {
          item._haystack = normalise([item.title, item.description, item.summary, item.author, item.content, item.meta, (item.keywords || []).join(' ')].join(' '));
          item._title = normalise(item.title);
          return item;
        });
        return searchIndex;
      })
      .catch(function () {
        loadingPromise = null;
        status.textContent = 'Search is temporarily unavailable.';
        renderEmpty('暂时无法载入搜索索引。');
        return null;
      });
    return loadingPromise;
  }

  function scoreItem(item, tokens, query) {
    if (!tokens.every(function (token) { return item._haystack.indexOf(token) !== -1; })) return -1;
    var score = item.featured ? 4 : 0;
    if (item._title === query) score += 120;
    else if (item._title.indexOf(query) === 0) score += 70;
    else if (item._title.indexOf(query) !== -1) score += 45;
    tokens.forEach(function (token) {
      if (item._title.indexOf(token) !== -1) score += 16;
      if (normalise(item.meta).indexOf(token) !== -1) score += 6;
    });
    return score;
  }

  function getMatches(query) {
    if (!searchIndex) return [];
    var cleaned = normalise(query);
    if (!cleaned) {
      return searchIndex.filter(function (item) { return item.featured; }).slice(0, 8);
    }
    var tokens = cleaned.split(' ').filter(Boolean);
    return searchIndex
      .map(function (item) { return { item: item, score: scoreItem(item, tokens, cleaned) }; })
      .filter(function (entry) { return entry.score >= 0; })
      .sort(function (a, b) { return b.score - a.score; })
      .slice(0, 10)
      .map(function (entry) { return entry.item; });
  }

  function renderEmpty(message) {
    results.textContent = '';
    var empty = document.createElement('div');
    empty.className = 'quick-search-empty';
    empty.textContent = message;
    results.appendChild(empty);
    activeIndex = -1;
  }

  function resultSnippet(item, query) {
    var fields = [item.description, item.summary, item.author, item.content].filter(Boolean);
    var tokens = normalise(query).split(' ').filter(Boolean);
    var text = fields[0] || '';
    var matchAt = -1;
    fields.some(function (field) {
      var cleaned = normalise(field);
      var positions = tokens.map(function (token) { return cleaned.indexOf(token); })
        .filter(function (position) { return position >= 0; });
      if (!positions.length) return false;
      text = String(field).replace(/\s+/g, ' ').trim();
      matchAt = Math.min.apply(Math, positions);
      return true;
    });
    // 命中词尽量靠前，窄屏单行截断后仍能看见匹配依据。
    var start = Math.max(0, matchAt - 12);
    var end = Math.min(text.length, start + 100);
    return (start ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
  }

  function render(items, query) {
    results.textContent = '';
    activeIndex = -1;

    if (!items.length) {
      status.textContent = query ? '0 results' : 'Suggested places';
      renderEmpty('没有找到相符的内容。');
      return;
    }

    status.textContent = query ? items.length + ' results' : 'Suggested places';
    items.forEach(function (item, index) {
      var link = document.createElement('a');
      link.className = 'quick-search-result';
      link.href = item.href;
      link.id = 'quick-search-result-' + index;
      link.dataset.resultIndex = String(index);

      var type = document.createElement('span');
      type.className = 'quick-search-result-type';
      type.textContent = TYPE_LABELS[item.type] || item.type;

      var main = document.createElement('span');
      main.className = 'quick-search-result-main';
      var title = document.createElement('span');
      title.className = 'quick-search-result-title';
      title.textContent = item.title;
      var description = document.createElement('span');
      description.className = 'quick-search-result-description';
      description.textContent = resultSnippet(item, query);
      main.appendChild(title);
      main.appendChild(description);

      var meta = document.createElement('span');
      meta.className = 'quick-search-result-meta';
      meta.textContent = item.meta || '';

      link.appendChild(type);
      link.appendChild(main);
      link.appendChild(meta);
      link.addEventListener('click', closeSearch);
      link.addEventListener('focus', function () { setActive(index); });
      results.appendChild(link);
    });
    setActive(0);
  }

  function resultLinks() {
    return Array.prototype.slice.call(results.querySelectorAll('.quick-search-result'));
  }

  function setActive(index, moveFocus) {
    var links = resultLinks();
    if (!links.length) return;
    activeIndex = (index + links.length) % links.length;
    links.forEach(function (link, linkIndex) {
      var active = linkIndex === activeIndex;
      link.classList.toggle('is-active', active);
    });
    if (moveFocus) links[activeIndex].focus({ preventScroll: true });
    links[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  function updateResults() {
    if (composing) return;
    var query = input.value;
    var request = ++searchRequest;
    loadIndex().then(function (loaded) {
      if (!loaded || request !== searchRequest || composing) return;
      render(getMatches(query), query.trim());
    });
  }

  function openSearch() {
    clearTimeout(closeTimer);
    closeTimer = null;
    if (root.classList.contains('is-active') || openFrame !== null) return;
    if (document.querySelector('.lightbox.active')) return;
    lastFocused = document.activeElement;
    root.hidden = false;
    root.removeAttribute('inert');
    root.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.classList.add('quick-search-open');
    setBackgroundInert(true);
    root.getBoundingClientRect();
    openFrame = requestAnimationFrame(function () {
      openFrame = null;
      if (root.hidden || root.getAttribute('aria-hidden') === 'true') return;
      root.classList.add('is-active');
      input.focus();
    });
    updateResults();
  }

  function closeSearch() {
    if (root.hidden || root.getAttribute('aria-hidden') === 'true') return;
    if (openFrame !== null) {
      cancelAnimationFrame(openFrame);
      openFrame = null;
    }
    root.classList.remove('is-active');
    root.setAttribute('aria-hidden', 'true');
    // 淡出开始即移出焦点和无障碍树；动画结束后再设置 hidden。
    root.setAttribute('inert', '');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('quick-search-open');
    setBackgroundInert(false);
    closeTimer = setTimeout(function () {
      if (root.getAttribute('aria-hidden') === 'true') root.hidden = true;
      closeTimer = null;
    }, 380);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  trigger.addEventListener('click', openSearch);
  Array.prototype.forEach.call(root.querySelectorAll('[data-search-close]'), function (button) {
    button.addEventListener('click', closeSearch);
  });
  input.addEventListener('input', updateResults);
  input.addEventListener('compositionstart', function () { composing = true; });
  input.addEventListener('compositionend', function () {
    composing = false;
    updateResults();
  });
  input.addEventListener('focus', function () { setActive(0); });

  document.addEventListener('keydown', function (event) {
    // 组合输入期间，回车、方向键与 Esc 属于输入法；229 兼容部分 Safari。
    if (composing || event.isComposing || Reflect.get(event, 'keyCode') === 229) return;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!root.hidden && root.getAttribute('aria-hidden') !== 'true') closeSearch();
      else openSearch();
      return;
    }
    if (root.hidden || root.getAttribute('aria-hidden') === 'true') return;
    var focused = document.activeElement;
    var links = resultLinks();
    var focusedIndex = links.indexOf(focused);
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeSearch();
    } else if (event.key === 'ArrowDown' && (focused === input || focusedIndex !== -1)) {
      event.preventDefault();
      setActive(focusedIndex === -1 ? 0 : focusedIndex + 1, true);
    } else if (event.key === 'ArrowUp' && (focused === input || focusedIndex !== -1)) {
      event.preventDefault();
      setActive(focusedIndex === -1 ? links.length - 1 : focusedIndex - 1, true);
    } else if (event.key === 'Enter' && focused === input) {
      if (links[activeIndex]) {
        event.preventDefault();
        links[activeIndex].click();
      }
    } else if (event.key === 'Tab') {
      // 按实际 DOM 顺序循环，末项 Tab 能回到位于输入框之前的关闭按钮。
      var focusable = Array.prototype.slice.call(root.querySelectorAll('button:not([disabled]), input:not([disabled]), a[href]'))
        .filter(function (element) { return element.offsetParent !== null; });
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
})();
