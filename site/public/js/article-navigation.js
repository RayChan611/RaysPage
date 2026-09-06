/* 普通多页面链接保留浏览器的打开新标签、历史记录与无脚本退路。
 * 这里只记住目录的阅读位置；标题动画由浏览器原生视图转场承担。 */
(function () {
  'use strict';
  var stateKey = 'ray:essay-position:v1';
  var returnKey = 'ray:essay-return:v1';
  var isIndex = /\/essays\.html$/.test(location.pathname);
  var restored = false;

  function readState() {
    try {
      var state = JSON.parse(sessionStorage.getItem(stateKey) || 'null');
      if (!state || Date.now() - state.time > 30 * 60 * 1000) return null;
      if (typeof state.id !== 'string' || typeof state.query !== 'string' || !Number.isFinite(state.scroll)) return null;
      return state;
    } catch (_) { return null; }
  }

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;
    var link = event.target.closest('a');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    var target = new URL(link.href, location.href);
    if (target.origin !== location.origin) return;
    try {
      if (isIndex && link.hasAttribute('data-essay-link')) {
        var input = document.getElementById('searchInput');
        sessionStorage.setItem(stateKey, JSON.stringify({
          id: link.getAttribute('data-essay-link'),
          scroll: window.scrollY,
          query: input instanceof HTMLInputElement ? input.value : '',
          time: Date.now()
        }));
        sessionStorage.removeItem(returnKey);
      } else if (!isIndex && /\/essays\.html$/.test(target.pathname)) {
        sessionStorage.setItem(returnKey, 'true');
      }
    } catch (_) { /* 私密模式或禁用存储时，链接依旧正常导航。 */ }
  });

  function restoreIndex() {
    if (!isIndex || restored) return;
    var input = document.getElementById('searchInput');
    if (!(input instanceof HTMLInputElement)) return;
    // pagereveal 可能早于 defer 脚本初始化，不能提前消费恢复标记。
    if (input.dataset.searchReady !== 'true') return;
    var navigationEntry = performance.getEntriesByType('navigation')[0];
    var returning = navigationEntry && 'type' in navigationEntry && navigationEntry.type === 'back_forward';
    try { returning = returning || sessionStorage.getItem(returnKey) === 'true'; } catch (_) {}
    if (!returning) return;
    var state = readState();
    if (!state) return;
    restored = true;
    try { sessionStorage.removeItem(returnKey); } catch (_) {}
    input.value = state.query;
    // 列表同步恢复筛选，避免先展示全部卡片再收缩导致标题转场跳动。
    input.dispatchEvent(new Event('ray:restore-search'));
    var scrollPosition = Math.max(0, state.scroll);
    window.scrollTo({ top: scrollPosition, behavior: 'instant' });
    var card = document.getElementById('entry-' + state.id);
    if (card) card.focus({ preventScroll: true });
  }

  // pagereveal 在原生转场截图前恢复目录；其余浏览器在 DOM 就绪时退回普通导航。
  window.addEventListener('pagereveal', restoreIndex);
  document.addEventListener('ray:search-ready', restoreIndex);
  document.addEventListener('DOMContentLoaded', restoreIndex);
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) restored = false;
    restoreIndex();
  });
})();
