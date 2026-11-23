(() => {
  const viewport = document.querySelector('#recent .recent-photo-view');
  if (!viewport || !('IntersectionObserver' in window) || !('inert' in HTMLElement.prototype)) return;

  const track = viewport.querySelector('#recent-track');
  const previous = viewport.querySelector('[data-recent-prev]');
  const next = viewport.querySelector('[data-recent-next]');
  if (!track || !previous || !next) return;

  const frames = Array.from(track.querySelectorAll('.recent-photo-frame'));
  if (frames.length < 2) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const interval = 3000;
  let index = -1;
  let destination = null;
  let timer;
  let visible = false;
  let hovering = false;
  let touching = false;

  function preparePhoto(photoIndex) {
    const template = frames[photoIndex].querySelector('template');
    // 浏览器会提前下载横向轨道内的懒加载图片，模板可把下载延后到实际需要时。
    if (template) template.replaceWith(template.content);
  }

  function updatePosition() {
    const width = track.getBoundingClientRect().width;
    if (!width) return;
    const current = Math.min(frames.length - 1, Math.max(0, Math.round(track.scrollLeft / width)));
    if (destination !== null && Math.abs(track.scrollLeft - destination * width) < 1) destination = null;
    if (index === current) return;

    index = current;
    preparePhoto(index);
    if (visible) preparePhoto((index + 1) % frames.length);
    frames.forEach((frame, frameIndex) => { frame.inert = frameIndex !== index; });
  }

  function moveBy(step) {
    const from = destination ?? index;
    const to = (from + step + frames.length) % frames.length;
    // 到达首尾时直接回绕，避免滑过中间的所有照片。
    const wraps = from + step !== to;
    destination = to;
    preparePhoto(to);
    track.scrollTo({
      left: to * track.getBoundingClientRect().width,
      behavior: wraps || reducedMotion.matches ? 'auto' : 'smooth',
    });
    updatePosition();
  }

  function schedule() {
    clearTimeout(timer);
    if (!visible || hovering || touching || viewport.hasAttribute('data-keyboard-focus') || reducedMotion.matches || document.hidden) return;
    timer = setTimeout(() => {
      moveBy(1);
      schedule();
    }, interval);
  }

  function updateTouch(event) {
    touching = event.touches.length > 0;
    schedule();
  }

  function setKeyboardFocus(focused) {
    viewport.toggleAttribute('data-keyboard-focus', focused);
    schedule();
  }

  previous.addEventListener('click', () => { moveBy(-1); schedule(); });
  next.addEventListener('click', () => { moveBy(1); schedule(); });
  track.addEventListener('scroll', updatePosition, { passive: true });
  track.addEventListener('pointerdown', () => {
    destination = null;
  });
  track.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) && !event.shiftKey) return;
    destination = null;
    schedule();
  }, { passive: true });
  // 将箭头也放在悬停区域内，避免光标从照片移向按钮时恢复轮播。
  viewport.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'touch') return;
    hovering = true;
    schedule();
  });
  viewport.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'touch') return;
    hovering = false;
    schedule();
  });
  viewport.addEventListener('touchstart', updateTouch, { passive: true });
  viewport.addEventListener('touchend', updateTouch, { passive: true });
  viewport.addEventListener('touchcancel', updateTouch, { passive: true });
  // 指针点在原本已有焦点的按钮上时，浏览器不会再触发 focusin。
  viewport.addEventListener('pointerdown', () => setKeyboardFocus(false));
  viewport.addEventListener('keydown', () => setKeyboardFocus(true));
  viewport.addEventListener('focusin', (event) => {
    setKeyboardFocus(event.target.matches(':focus-visible'));
  });
  viewport.addEventListener('focusout', () => setKeyboardFocus(false));
  reducedMotion.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', schedule);

  track.dataset.carouselReady = '';
  previous.hidden = false;
  next.hidden = false;
  updatePosition();

  new IntersectionObserver(([entry]) => {
    visible = entry.intersectionRatio >= 0.5;
    if (entry.isIntersecting) preparePhoto((index + 1) % frames.length);
    schedule();
  }, { threshold: [0, 0.5] }).observe(track);
})();
