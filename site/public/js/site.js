/* site.js — RaysPage 迁移到 Astro 后的客户端运行时。
 *
 * 旧版 components.js 同时注入导航、页脚等共享节点并执行页面行为；
 * 新架构改由 BaseLayout 静态渲染节点，这里只保留运行时行为和共享管理器。
 * initAll 可以直接假设这些共享节点已经存在。
 */
(function () {
  'use strict';

  // 计量网络用户跳过非必要动画（如 sparkle），由各特效脚本读取。
  // Chromium 系浏览器通过 Network Information API 暴露“省流量”与慢网，
  // 不应只依赖尚未广泛支持的 prefers-reduced-data 媒体查询。
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const slowConnection = !!(connection && /^(slow-2g|2g|3g)$/.test(connection.effectiveType || ''));
  window.__reducedData = !!(
    (window.matchMedia && window.matchMedia('(prefers-reduced-data: reduce)').matches) ||
    (connection && connection.saveData) ||
    slowConnection
  );

  // ---- Shared RAF visibility manager ----
  // 用一个 visibilitychange 监听统一暂停/恢复所有已注册的动画循环，
  // 取代 hero-sparkle、smooth-scroll 等脚本各自绑定监听的旧实现。
  window.RayRAF = (function () {
    const loops = new Set();
    let bound = false;

    function bind() {
      if (bound) return;
      bound = true;
      function updateLoops(shouldStop) {
        loops.forEach(function (l) {
          try { shouldStop ? l.stop() : l.start(); } catch (e) {}
        });
      }
      document.addEventListener('visibilitychange', function () {
        updateLoops(document.hidden);
      });
      window.addEventListener('pagehide', function () { updateLoops(true); });
      window.addEventListener('pageshow', function () {
        if (!document.hidden) updateLoops(false);
      });
    }

    return {
      register: function (loop) {
        if (!loop || typeof loop.start !== 'function' || typeof loop.stop !== 'function') return;
        loops.add(loop);
        bind();
      },
      unregister: function (loop) { loops.delete(loop); },
    };
  })();

  // ---- Shared scroll manager ----
  // A single passive scroll listener drives every registered handler, throttled
  // with requestAnimationFrame. Replaces the 4 separate scroll listeners that
  // site.js and nav.js used to attach (reading progress, back-to-top, nav
  // state, and article scroll-depth analytics).
  window.RayScroll = (function () {
    const handlers = new Set();
    let bound = false;
    let ticking = false;

    function flush() {
      ticking = false;
      handlers.forEach(function (fn) {
        try { fn(); } catch (e) {}
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(flush);
    }

    function bind() {
      if (bound) return;
      bound = true;
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return {
      add: function (fn) {
        if (typeof fn !== 'function') return;
        handlers.add(fn);
        bind();
        // run once so the handler sets its initial state (e.g. on reload at a
        // scrolled position, or a restored scroll offset)
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(flush);
        }
      },
      remove: function (fn) { handlers.delete(fn); },
    };
  })();

  // ---- Page Transition Logic ----
  function initPageTransition() {
    // 阅读页交给浏览器的原生标题转场；旧黑幕会盖住共享标题的快照。
    if (document.documentElement.hasAttribute('data-article-navigation')) return;
    const overlay = document.getElementById('pageTransitionOverlay');
    if (!overlay) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Take over from the short CSS failsafe animation now that the full
    // transition runtime is known to be healthy.
    overlay.classList.remove('page-transition-overlay--entering');
    overlay.style.animation = 'none';
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'auto';
    overlay.style.transition = 'none';

    function fadeOut() {
      overlay.style.transition = 'opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }

    requestAnimationFrame(() => requestAnimationFrame(fadeOut));

    window.addEventListener('pageshow', function (e) {
      if (!e.persisted && parseFloat(overlay.style.opacity) < 1) return;
      overlay.style.transition = 'none';
      overlay.style.opacity = '1';
      overlay.getBoundingClientRect();
      requestAnimationFrame(() => requestAnimationFrame(fadeOut));
    });

    document.addEventListener('click', function (e) {
      // Leave modified/non-primary clicks to the browser. Intercepting these
      // breaks expected behaviours such as Cmd/Ctrl+click opening a new tab.
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!(e.target instanceof Element)) return;

      const link = e.target.closest('a[href]');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      if (href.startsWith('#')) return;
      if (href.startsWith('http') || href.startsWith('//')) return;
      // javascript: links (e.g. <a href="javascript:history.back()">) must run
      // natively — intercepting and doing window.location.href='javascript:...'
      // is deprecated, CSP-blockable, and silently fails in some browsers.
      if (href.startsWith('javascript:')) return;
      if (link.target === '_blank') return;
      if (link.hasAttribute('download')) return;

      const currentFile = window.location.pathname.split('/').pop() || 'index.html';
      const targetFile = (href.split('#')[0].split('?')[0]).split('/').pop();
      if (targetFile === currentFile) return;

      if (reduceMotion) return;
      e.preventDefault();

      overlay.style.transition = 'opacity 0.24s cubic-bezier(0.4, 0, 0.2, 1)';
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';

      setTimeout(() => { window.location.href = href; }, 260);
    });
  }

  // ---- Reading Progress logic ----
  function initReadingProgress() {
    const progressBar = document.getElementById('readingProgress');
    if (!progressBar) return;

    const content = document.querySelector('.essay-content')
      || document.querySelector('.essays-list')
      || document.querySelector('.notes-list')
      || document.querySelector('.note-body');
    if (!content) return;

    function updateProgress() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      progressBar.style.width = Math.min(progress, 100) + '%';
    }

    RayScroll.add(updateProgress);
  }

  // ---- Back to Top logic ----
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    RayScroll.add(function () {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    const reduceMotion = !!(window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches);

    btn.addEventListener('click', function () {
      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        window.lenis.scrollTo(0, reduceMotion ? { immediate: true } : { duration: 0.8 });
      } else {
        window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    });
  }

  // ---- Analytics: Umami custom events (centralised, runs on every page) ----
  function initAnalytics() {
    var Q = [];

    function _send(name, data) {
      if (!window.umami || typeof window.umami.track !== 'function') return false;
      try {
        window.umami.track(name, data);
        return true;
      } catch (_) {
        return false;
      }
    }

    function _track(name, data) {
      data = data || {};
      if (!_send(name, data)) Q.push({ name: name, data: data });
    }

    function _flush() {
      if (!window.umami || typeof window.umami.track !== 'function') return;
      var queued = Q.splice(0, Q.length);
      for (var i = 0; i < queued.length; i++) {
        if (!_send(queued[i].name, queued[i].data)) {
          Q = queued.slice(i).concat(Q);
          break;
        }
      }
    }

    // BaseLayout 在页面 load 后才请求第三方脚本；显式监听完成事件，
    // 即使网络超过轮询窗口，之前排队的事件也不会永久滞留。
    window.addEventListener('ray:analytics-ready', _flush, { once: true });

    if (!window.umami) {
      var tries = 0, timer = setInterval(function () {
        if (window.umami) {
          clearInterval(timer);
          _flush();
        } else if (++tries > 40) {
          clearInterval(timer);
        }
      }, 150);
    }

    document.addEventListener('click', function (ev) {
      var a = ev.target.closest ? ev.target.closest('a') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      try {
        var url = new URL(href, window.location.href);
        if (/^https?:$/.test(url.protocol) && url.origin !== window.location.origin) {
          _track('outbound_link', { href: url.href });
        }
      } catch (_) {}
    }, true);

    var backBtn = document.querySelector('.note-back-fixed');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        _track('back_button', {});
      });
    }

    var isArticle = document.querySelector('.essay-hero-title, .note-title');
    if (isArticle) {
      var marks = [25, 50, 75, 100], fired = {};
      RayScroll.add(function () {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        if (h <= 0) return;
        var pct = Math.round((window.scrollY / h) * 100);
        for (var i = 0; i < marks.length; i++) {
          var m = marks[i];
          if (!fired[m] && pct >= m) { fired[m] = true; _track('scroll_depth', { percent: m }); }
        }
      });
    }
  }

  // ---- Contact card click-to-copy + inline success hint ----
  function initContactCopy() {
    var cards = document.querySelectorAll('.contact-card[data-copy]');
    if (!cards.length) return;

    cards.forEach(function (card) {
      var hint = card.querySelector('.copy-hint');
      if (!hint) {
        hint = document.createElement('span');
        hint.className = 'copy-hint';
        hint.textContent = '点击复制';
        card.appendChild(hint);
      }
      // 当前联系卡标题使用 h3，同时兼容旧的 h4，避免标题层级调整后丢失辅助名称。
      var label = (card.querySelector('h3, h4') || {}).textContent || '内容';
      card.style.cursor = 'pointer';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', '复制' + label.trim());

      // Hover/focus reveals the "点击复制" hint — but never while the success
      // state is showing, so it can't flip back to "点击复制" mid-copy.
      function showHint() {
        if (card.classList.contains('copied')) return;
        hint.textContent = '点击复制';
        hint.classList.add('show');
      }
      function hideHint() {
        if (card.classList.contains('copied')) return;
        hint.classList.remove('show');
      }
      card.addEventListener('mouseenter', showHint);
      card.addEventListener('mouseleave', hideHint);
      card.addEventListener('focus', showHint);
      card.addEventListener('blur', hideHint);

      var trigger = function () {
        copyText(card, hint, card.getAttribute('data-copy'));
      };
      card.addEventListener('click', trigger);
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger(); }
      });
    });

    function copyText(card, hint, text) {
      function ok() {
        hint.textContent = '复制成功';
        hint.classList.add('show', 'success');
        card.classList.add('copied');
        clearTimeout(card._copiedTimer);
        card._copiedTimer = setTimeout(function () {
          card.classList.remove('copied');
          hint.classList.remove('success');
          // Fade out cleanly — no hover-hint re-show; next hover re-reveals.
          hint.classList.remove('show');
        }, 2000);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok).catch(function () { fallbackCopy(text, ok); });
      } else {
        fallbackCopy(text, ok);
      }
    }
    function fallbackCopy(text, ok) {
      var previousFocus = document.activeElement;
      var ta = document.createElement('textarea');
      var copied = false;
      try {
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        // Keep the deprecated API isolated behind a narrow local type: it is
        // only a fallback for browsers without the asynchronous Clipboard API.
        /** @type {{ execCommand(commandId: string): boolean }} */
        var legacyDocument = document;
        copied = legacyDocument.execCommand('copy');
      } catch (e) {
        copied = false;
      } finally {
        ta.remove();
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
          previousFocus.focus({ preventScroll: true });
        }
      }
      if (copied) ok();
      else showToast('复制失败，请手动复制');
    }
  }

  // ---- Toast (shared, lazy-created) ----
  var toastTimer = null;
  function showToast(msg) {
    var el = document.getElementById('rayToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'rayToast';
      el.className = 'ray-toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    // force reflow so repeated toasts re-trigger the transition
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1800);
  }

  // ---- Init ----
  function initAll() {
    initBackToTop();
    initReadingProgress();
    initPageTransition();
    initAnalytics();
    initContactCopy();
  }

  function boot() { initAll(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
