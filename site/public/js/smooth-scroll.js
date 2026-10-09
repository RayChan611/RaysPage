/* ============================================
   Smooth Scroll - Lenis integration
   ============================================ */

(function () {
  'use strict';

  let lenis;
  let animId = null;
  const reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersNativeTouch = Boolean(
    (window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches) ||
    navigator.maxTouchPoints > 0
  );
  const isHome = document.body.classList.contains('page-home');

  // Keep native history restoration. Lenis only owns animated/programmatic
  // scrolling; forcing manual restoration made Back return every list to top.
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'auto';
  }

  // 滚轮插值虽然不是 CSS 动画，仍可能引起不适；减少动态效果时保留原生滚动。
  // 触摸设备本来就使用浏览器原生惯性滚动；不启动 Lenis，避免一个没有
  // 实际视觉收益的常驻 requestAnimationFrame 循环。
  // 首页保留与内容页一致的平滑滚动，但缩短响应时间，避免一秒拖尾。
  if (window.Lenis && !reduceMotion && !prefersNativeTouch) {
    lenis = new Lenis({
      duration: isHome ? 0.7 : 1.0,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      syncTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      animId = requestAnimationFrame(raf);
    }
    animId = requestAnimationFrame(raf);

    // Pause Lenis raf loop when tab is hidden — delegated to shared manager.
    if (window.RayRAF) {
      window.RayRAF.register({
        start: function () { if (!animId) animId = requestAnimationFrame(raf); if (lenis) lenis.start(); },
        stop:  function () { if (animId) { cancelAnimationFrame(animId); animId = null; } if (lenis) lenis.stop(); },
      });
    }

    // Expose globally for other scripts
    window.lenis = lenis;
  }

  function getHashTarget(hash) {
    if (!hash || hash === '#' || hash.length < 2) return null;
    var id = hash.slice(1);
    try { id = decodeURIComponent(id); } catch (_) {}
    return document.getElementById(id);
  }

  function getFixedOffset(target) {
    const navEl = document.getElementById('nav');
    let offset = navEl ? navEl.offsetHeight : 0;
    // 摄影系列位于第二层吸顶导航下方，动态计入它的实际高度，
    // 避免锚点标题被两层导航遮住。
    if (target.classList.contains('series-section')) {
      const seriesNav = document.getElementById('seriesNav');
      if (seriesNav) {
        const stickyTop = Number.parseFloat(getComputedStyle(seriesNav).top);
        offset = (Number.isFinite(stickyTop) ? stickyTop : offset) + seriesNav.offsetHeight;
      }
    }
    return offset;
  }

  function scrollToTarget(target, duration) {
    // 搜索筛选会立即改变列表高度，Lenis 的延迟尺寸观测此时可能仍是旧值。
    // 先刷新滚动边界，否则 scrollTo 会把目标截断在筛选后的短页面底部。
    if (lenis) lenis.resize();
    const targetPos = target.getBoundingClientRect().top + window.scrollY - getFixedOffset(target);
    if (lenis) {
      lenis.scrollTo(targetPos, reduceMotion ? { immediate: true } : { duration: duration });
    } else {
      window.scrollTo({ top: targetPos, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
  }

  // Handle URL hash on page load
  function scrollToHashTarget(resetToTop) {
    const hash = window.location.hash;
    // Resolve by id instead of treating user-controlled hashes as CSS
    // selectors; malformed/escaped hashes must never throw on page load.
    const target = getHashTarget(hash);
    if (!target) return;
    // 首次载入带片段的网址时，从顶部开始能避免浏览器原生定位与
    // 自定义吸顶偏移互相争抢；历史前进/后退则保留当前位置，
    // 否则会先闪回顶部再滚到目标系列。
    if (resetToTop) window.scrollTo(0, 0);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToTarget(target, 0.8);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { scrollToHashTarget(true); });
  } else {
    scrollToHashTarget(true);
  }
  window.addEventListener('popstate', function () { scrollToHashTarget(false); });

  // 同页锚点也可能写成完整路径（如全站搜索结果 /notes.html#note-extra-1）。
  // 统一交给 Lenis 滚动，避免浏览器原生滚动与 Lenis 当前目标互相争抢。
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const anchor = e.target instanceof Element && e.target.closest('a[href]');
    if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;
    let url;
    try { url = new URL(anchor.href, window.location.href); } catch (_) { return; }
    if (url.origin !== window.location.origin || url.pathname !== window.location.pathname ||
        url.search !== window.location.search || !url.hash) return;
    const target = getHashTarget(url.hash);
    if (target) {
      e.preventDefault();
      if (anchor.classList.contains('skip-link')) {
        try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
      }
      scrollToTarget(target, 0.7);
      // preventDefault 会同时阻止浏览器写入片段历史；这里显式恢复，
      // 让当前系列可以被收藏，也支持浏览器前进与后退。
      if (window.location.hash !== url.hash) {
        history.pushState(null, '', url.hash);
      }
    }
  });
})();
