import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const keyPages = ['/index.html', '/essays.html', '/notes.html', '/photos.html', '/essay-embers-remain.html'];
const openPage = (page: Page, path: string) => page.goto(path, { waitUntil: 'domcontentloaded' });

test('navigation spacing follows the responsive stylesheet', async ({ page }, testInfo) => {
  await openPage(page, '/index.html');
  const layout = await page.locator('#nav').evaluate((nav) => ({
    paddingLeft: Number.parseFloat(getComputedStyle(nav).paddingLeft),
    paddingRight: Number.parseFloat(getComputedStyle(nav).paddingRight),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

  const isMobileProject = Boolean(testInfo.project.use.isMobile);
  expect(layout.paddingLeft).toBe(isMobileProject ? 20 : 64);
  expect(layout.paddingRight).toBeCloseTo(isMobileProject ? 20 : 38.4, 1);
  expect(layout.overflow).toBeLessThanOrEqual(1);
});

test('core content remains visible when JavaScript is disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();

  await page.goto('http://127.0.0.1:4322/index.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.hero-name-line').first()).toBeVisible();
  await expect(page.locator('#hero-tagline')).toContainText('Ground-up rebuild.');
  await expect(page.locator('.animate-on-scroll').first()).toBeVisible();

  await page.goto('http://127.0.0.1:4322/photos.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.gallery-item').first()).toBeVisible();

  await context.close();
});

test('mobile navigation remains available when JavaScript is disabled', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '独立手机上下文只需执行一次');
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 568 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4322/index.html', { waitUntil: 'domcontentloaded' });

  const links = page.locator('#navLinks .nav-link');
  await expect(links).toHaveCount(5);
  expect(await links.evaluateAll((items) => items.every((item) => {
    const style = getComputedStyle(item);
    return style.display !== 'none' && style.visibility === 'visible' && Number(style.opacity) > 0;
  }))).toBe(true);
  await expect(page.locator('#navMobileBtn')).toBeHidden();
  await expect(page.locator('#quickSearchTrigger')).toBeHidden();
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth
  )).toBeLessThanOrEqual(1);

  await context.close();
});

test('slow runtime loading does not disable entrance animations', async ({ page }) => {
  await page.route('**/js/nav.js', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2200));
    await route.continue();
  });

  await openPage(page, '/index.html');
  await expect(page.locator('html')).toHaveClass(/(?:^|\s)motion-ready(?:\s|$)/);
  await expect(page.locator('html')).toHaveClass(/(?:^|\s)js(?:\s|$)/);
  await expect(page.locator('html')).not.toHaveClass(/(?:^|\s)motion-fallback(?:\s|$)/);
  await expect(page.locator('.hero-name-line').first()).toBeVisible();
});

test('hero typewriter does not reveal the complete fallback copy first', async ({ page, request }) => {
  const html = await (await request.get('/index.html')).text();
  const css = await (await request.get('/css/style.css')).text();
  expect(html).toContain('class="hero-tagline typewriter-pending"');
  expect(css).toMatch(
    /\.js \.hero-text\.hero-loaded > \.hero-tagline\.typewriter-pending\s*\{[^}]*opacity:\s*0/s,
  );

  await openPage(page, '/index.html');
  const tagline = page.locator('#hero-tagline');
  await expect.poll(() => tagline.evaluate((element) => ({
    active: element.classList.contains('typewriter-active'),
    hasCompleteSecondLine: (element.textContent || '').includes('Capabilities. Mindset. Vision.'),
  }))).toEqual({ active: true, hasCompleteSecondLine: false });
});

test('failed typewriter runtime releases the complete static tagline', async ({ page }) => {
  await page.route('**/js/hero-typewriter.js', (route) => route.abort());
  await openPage(page, '/index.html');

  await expect(page.locator('html')).toHaveClass(/(?:^|\s)motion-ready(?:\s|$)/);
  const tagline = page.locator('#hero-tagline');
  await expect(tagline).not.toHaveClass(/(?:^|\s)typewriter-pending(?:\s|$)/, { timeout: 7000 });
  await expect(tagline).toBeVisible();
  await expect(tagline).toHaveText('Ground-up rebuild.Capabilities. Mindset. Vision.');
});

test('failed animation runtime releases static content', async ({ page }, testInfo) => {
  await page.route('**/js/nav.js', (route) => route.abort());
  await openPage(page, '/index.html');

  await expect(page.locator('html')).not.toHaveClass(/(?:^|\s)js(?:\s|$)/, { timeout: 3000 });
  await expect(page.locator('html')).toHaveClass(/(?:^|\s)motion-fallback(?:\s|$)/);
  await expect(page.locator('.hero-name-line').first()).toBeVisible();
  await expect(page.locator('#hero-tagline')).toHaveText('Ground-up rebuild.Capabilities. Mindset. Vision.');
  await expect(page.locator('.animate-on-scroll').first()).toBeVisible();
  if (testInfo.project.use.isMobile) {
    await expect(page.locator('#navLinks .nav-link').first()).toBeVisible();
    await expect(page.locator('#navMobileBtn')).toBeHidden();
  }
});

test('quick search is inert as soon as it starts closing', async ({ page }) => {
  await openPage(page, '/index.html');
  const trigger = page.locator('#quickSearchTrigger');
  const search = page.locator('#quickSearch');

  await trigger.click();
  await expect(search).toHaveClass(/is-active/);
  await expect(search).not.toHaveAttribute('inert', '');
  await expect(page.locator('#quickSearchInput')).toBeFocused();

  await page.locator('.quick-search-close').click();
  await expect(search).toHaveAttribute('aria-hidden', 'true');
  await expect(search).toHaveAttribute('inert', '');
  await expect(trigger).toBeFocused();
});

test('quick search can reopen after an immediate open-close cycle', async ({ page }) => {
  await openPage(page, '/index.html');
  const trigger = page.locator('#quickSearchTrigger');
  const search = page.locator('#quickSearch');

  // 在同一任务内完成打开与关闭，确保关闭发生在打开用的
  // requestAnimationFrame 之前；旧实现会在关闭后错误加回 is-active。
  await page.evaluate(() => {
    document.getElementById('quickSearchTrigger')?.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await expect(search).not.toHaveClass(/is-active/);
  await expect(search).toHaveAttribute('aria-hidden', 'true');
  await expect(search).toHaveAttribute('inert', '');
  await expect(search).toBeHidden();

  await trigger.click();
  await expect(search).toHaveClass(/is-active/);
  await expect(page.locator('#quickSearchInput')).toBeFocused();
});

test('mobile controls, inputs and active navigation remain touch-friendly', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, '只检查手机端触控布局');
  await openPage(page, '/essays.html');

  const listInputFontSize = await page.locator('.search-input').evaluate((input) => Number.parseFloat(getComputedStyle(input).fontSize));
  expect(listInputFontSize).toBeGreaterThanOrEqual(16);

  const trigger = page.locator('#quickSearchTrigger');
  const menu = page.locator('#navMobileBtn');
  const top = page.locator('#backToTop');
  for (const control of [trigger, menu, top]) {
    const box = await control.boundingBox();
    // Chromium 在部分缩放比例下会把 CSS 的 44px 回传为 43.99999px。
    expect(box?.width).toBeGreaterThanOrEqual(43.9);
    expect(box?.height).toBeGreaterThanOrEqual(43.9);
  }

  await trigger.click();
  const quickInputFontSize = await page.locator('#quickSearchInput').evaluate((input) => Number.parseFloat(getComputedStyle(input).fontSize));
  expect(quickInputFontSize).toBeGreaterThanOrEqual(16);
  const closeBox = await page.locator('.quick-search-close').boundingBox();
  expect(closeBox?.width).toBeGreaterThanOrEqual(43.9);
  expect(closeBox?.height).toBeGreaterThanOrEqual(43.9);
  await page.locator('.quick-search-close').click();

  await menu.click();
  await expect(page.locator('#navLinks a').first()).toBeFocused();
  const activeLine = await page.locator('.nav-link-active').evaluate((link) => ({
    linkWidth: link.getBoundingClientRect().width,
    lineWidth: Number.parseFloat(getComputedStyle(link, '::after').width),
    menuWidth: link.parentElement?.getBoundingClientRect().width || 0,
  }));
  expect(activeLine.lineWidth).toBeCloseTo(activeLine.linkWidth, 0);
  expect(activeLine.linkWidth).toBeLessThan(activeLine.menuWidth * 0.75);
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
});

test('secondary photo and note controls remain touch-friendly on mobile', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, '只检查手机端触控布局');

  await openPage(page, '/notes.html');
  const noteButtons = page.locator('.note-expand-button:visible');
  expect(await noteButtons.count()).toBeGreaterThan(0);
  for (const button of await noteButtons.all()) {
    const box = await button.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(43.9);
    expect(box?.height).toBeGreaterThanOrEqual(43.9);
  }

  await openPage(page, '/photos.html');
  for (const link of await page.locator('.series-nav-link').all()) {
    const box = await link.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(43.9);
    expect(box?.height).toBeGreaterThanOrEqual(43.9);
  }

  await page.locator('.gallery-item').first().click();
  for (const control of await page.locator('.lightbox-close, .lightbox-prev, .lightbox-next').all()) {
    const box = await control.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(43.9);
    expect(box?.height).toBeGreaterThanOrEqual(43.9);
  }
});

test('collection search status starts empty and announces a no-match result', async ({ page }) => {
  const collections = [
    { path: '/essays.html', empty: 'No matching entries found.' },
    { path: '/notes.html', empty: 'No matching notes found.' },
  ];

  for (const collection of collections) {
    await openPage(page, collection.path);
    const input = page.locator('#searchInput');
    const status = page.locator('#searchNoResults');
    await expect(status).toHaveText('');

    await input.fill('__definitely_no_matching_content__');
    await expect(status).toHaveText(collection.empty);
    await expect(status).toHaveClass(/visible/);

    await input.fill('');
    await expect(status).toHaveText('');
    await expect(status).not.toHaveClass(/visible/);
  }
});

test('short mobile essays keep the footer at the viewport edge and Back clear of it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', '固定在 390×844 高屏手机上检查');
  await openPage(page, '/essay-no-belief.html');

  await expect.poll(() => page.evaluate(() => {
    const footer = document.querySelector('.footer')?.getBoundingClientRect();
    const back = document.querySelector('.note-back-fixed')?.getBoundingClientRect();
    return Boolean(footer && back && back.bottom <= Math.min(footer.top, innerHeight) - 12);
  })).toBe(true);

  const layout = await page.evaluate(() => {
    const footer = document.querySelector('.footer')?.getBoundingClientRect();
    const back = document.querySelector('.note-back-fixed');
    return {
      bodyDisplay: getComputedStyle(document.body).display,
      mainFlexGrow: getComputedStyle(document.querySelector('.site-main') as Element).flexGrow,
      backPosition: back ? getComputedStyle(back).position : '',
      gapAfterFooter: footer && document.documentElement.scrollHeight <= innerHeight + 1
        ? innerHeight - footer.bottom
        : 0,
    };
  });
  expect(layout.bodyDisplay).toBe('flex');
  expect(layout.mainFlexGrow).toBe('1');
  expect(layout.backPosition).toBe('static');
  expect(Math.abs(layout.gapAfterFooter)).toBeLessThanOrEqual(1);
});

test('320px Soul-Searching title stays compact without horizontal overflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-narrow', '固定在 320×568 极窄手机上检查');
  await openPage(page, '/essays.html');
  const title = await page.locator('.essays-title').evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      height: rect.height,
      whiteSpace: getComputedStyle(element).whiteSpace,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(title.whiteSpace).toBe('nowrap');
  expect(title.height).toBeLessThanOrEqual(52);
  expect(title.overflow).toBeLessThanOrEqual(1);
});

test('compact mobile article navigation stacks and quick search survives keyboard height', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-compact', '固定在 375px 手机断点检查');
  await openPage(page, '/essay-qingsimeng.html');
  const pagination = await page.locator('.article-pagination').evaluate((nav) => {
    const previous = nav.querySelector('.article-pagination-link--previous')?.getBoundingClientRect();
    const next = nav.querySelector('.article-pagination-link--next')?.getBoundingClientRect();
    return { previousBottom: previous?.bottom || 0, nextTop: next?.top || 0 };
  });
  expect(pagination.nextTop).toBeGreaterThan(pagination.previousBottom);

  await page.setViewportSize({ width: 375, height: 380 });
  await openPage(page, '/index.html');
  await page.locator('#quickSearchTrigger').click();
  const searchLayout = await page.locator('.quick-search-panel').evaluate((panel) => ({
    bottom: panel.getBoundingClientRect().bottom,
    viewportHeight: innerHeight,
    footerDisplay: getComputedStyle(document.querySelector('.quick-search-footer') as Element).display,
    resultsMinHeight: getComputedStyle(document.querySelector('.quick-search-results') as Element).minHeight,
  }));
  expect(searchLayout.bottom).toBeLessThanOrEqual(searchLayout.viewportHeight);
  expect(searchLayout.footerDisplay).toBe('none');
  expect(searchLayout.resultsMinHeight).toBe('0px');
});

test('touch devices use native scrolling and the lower-cost particle profile', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, '只检查触摸设备性能策略');
  await openPage(page, '/essays.html');
  await expect.poll(() => page.evaluate(() => Boolean((window as Window & { lenis?: unknown }).lenis))).toBe(false);
  await expect(page.locator('#hero-sparkle-canvas')).toHaveAttribute('data-particle-limit', '36');
  await expect(page.locator('#hero-sparkle-canvas')).toHaveAttribute('data-frame-rate', '30');
});

test('external resources cannot destabilize Chinese article layout or core initialization', async ({ page, request }) => {
  const response = await request.get('/essays.html');
  const html = await response.text();
  const errorHtml = await (await request.get('/404.html')).text();
  const globalCss = await (await request.get('/css/style.css')).text();
  expect(html).not.toMatch(/<script[^>]+src=["']https:\/\/cloud\.umami\.is\/script\.js/);
  expect(html).toContain("window.addEventListener('load'");
  expect(html).toContain('analyticsScript.async = true');
  expect(html + errorHtml).not.toContain('fonts.googleapis.com');
  expect(html + errorHtml).not.toContain('fonts.gstatic.com');
  expect(globalCss).toContain('/assets/contact/flower-800.webp');
  expect(globalCss).not.toContain('/assets/contact/flower.jpg');

  await openPage(page, '/essays.html');
  await expect(page.locator('.essay-card-title').first()).toHaveCSS(
    'font-family',
    /Songti SC.*STSong.*Source Han Serif SC.*Noto Serif CJK SC/,
  );
});

test('all photo cards are present in static markup and the lightbox interactions work', async ({ page, request }) => {
  const response = await request.get('/photos.html');
  const html = await response.text();
  expect((html.match(/class="gallery-item /g) || []).length).toBe(36);
  expect((html.match(/-400\.webp 400w/g) || []).length).toBe(36);
  expect((html.match(/-600\.webp 600w/g) || []).length).toBe(36);
  expect((html.match(/-medium\.webp \d+w/g) || []).length).toBe(26);
  expect(html).not.toContain('/photos/f1-2025-shanghai/f1-2.jpeg');
  expect(html).not.toContain('/photos/photo-4.webp');
  expect(html).not.toContain('/photos/photo-6.webp');
  expect(html).toContain('/photos/qingdao/qingdao-1-400.webp 400w');
  expect(html).toContain('/photos/qingdao/qingdao-1-600.webp 600w');
  expect(html).toContain('/photos/qingdao/qingdao-1-medium.webp 1280w');
  expect(html).not.toContain('/photos/qingdao/qingdao-1.webp 2000w');
  const mediumPhoto = await request.get('/photos/qingdao/qingdao-1-medium.webp');
  expect(mediumPhoto.ok()).toBe(true);
  expect(mediumPhoto.headers()['content-type']).toContain('image/webp');
  const mobilePhoto = await request.get('/photos/qingdao/qingdao-1-400.webp');
  expect(mobilePhoto.ok()).toBe(true);
  expect(mobilePhoto.headers()['content-type']).toContain('image/webp');

  await openPage(page, '/photos.html');
  const cards = page.locator('.gallery-item');
  await expect(cards).toHaveCount(36);
  await cards.first().click();
  const lightbox = page.locator('#lightbox');
  await expect(lightbox).toHaveClass(/active/);
  await expect(page.locator('#lightboxCounter')).toContainText('1 / 36');

  await lightbox.dispatchEvent('wheel', { deltaX: 72, deltaY: 0, deltaMode: 0 });
  await expect(page.locator('#lightboxCounter')).toContainText('2 / 36');

  await lightbox.click({ position: { x: 8, y: 8 } });
  await expect(lightbox).toHaveAttribute('aria-hidden', 'true');
  await expect(lightbox).toHaveAttribute('inert', '');
});

test('desktop photo sizes stop at the capped gallery width', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '桌面 DPR 1 资源选择只需执行一次');
  await page.setViewportSize({ width: 1920, height: 900 });
  await openPage(page, '/photos.html');

  const wide = page.locator('.gallery-item--wide img, .gallery-item--feature-wide img, .gallery-item--feature img').first();
  await expect(wide).toHaveAttribute(
    'sizes',
    '(max-width: 768px) calc(100vw - 48px), (max-width: 1280px) calc(50vw - 46px), 594px',
  );
  await expect.poll(() => wide.evaluate((image: HTMLImageElement) => image.currentSrc)).toMatch(/-600\.webp$/);

  const portrait = page.locator('.gallery-item--portrait img').first();
  await expect(portrait).toHaveAttribute(
    'sizes',
    '(max-width: 768px) calc(50vw - 28px), (max-width: 1280px) calc(25vw - 29px), 291px',
  );
  await expect.poll(() => portrait.evaluate((image: HTMLImageElement) => image.currentSrc)).toMatch(/-400\.webp$/);
});

test('photo series anchors use one scroll path and preserve fragment history', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '桌面端启用 Lenis，检查重复调用最精确');
  await openPage(page, '/photos.html');

  await page.evaluate(() => {
    const scopedWindow = window as Window & {
      lenis?: { scrollTo: (...args: unknown[]) => unknown };
      __seriesScrollCalls?: number;
    };
    if (!scopedWindow.lenis) throw new Error('Lenis was not initialised');
    const original = scopedWindow.lenis.scrollTo.bind(scopedWindow.lenis);
    scopedWindow.__seriesScrollCalls = 0;
    scopedWindow.lenis.scrollTo = (...args: unknown[]) => {
      scopedWindow.__seriesScrollCalls = (scopedWindow.__seriesScrollCalls || 0) + 1;
      return original(...args);
    };
  });

  const link = page.locator('.series-nav-link[data-target="series-f1-2025"]');
  await link.click();
  await expect(page).toHaveURL(/#series-f1-2025$/);
  await expect.poll(() => page.evaluate(() =>
    (window as Window & { __seriesScrollCalls?: number }).__seriesScrollCalls
  )).toBe(1);
  await expect(link).toHaveAttribute('aria-current', 'location');
  await expect.poll(() => page.evaluate(() => {
    const target = document.getElementById('series-f1-2025');
    const seriesNav = document.getElementById('seriesNav');
    if (!target || !seriesNav) return Number.POSITIVE_INFINITY;
    const stickyTop = Number.parseFloat(getComputedStyle(seriesNav).top);
    return Math.abs(target.getBoundingClientRect().top - stickyTop - seriesNav.offsetHeight);
  })).toBeLessThanOrEqual(3);

  await page.locator('.series-nav-link[data-target="series-moments"]').click();
  await expect(page).toHaveURL(/#series-moments$/);
  await page.goBack();
  await expect(page).toHaveURL(/#series-f1-2025$/);
  await expect.poll(() => page.evaluate(() => {
    const target = document.getElementById('series-f1-2025');
    const seriesNav = document.getElementById('seriesNav');
    if (!target || !seriesNav) return Number.POSITIVE_INFINITY;
    const stickyTop = Number.parseFloat(getComputedStyle(seriesNav).top);
    return Math.abs(target.getBoundingClientRect().top - stickyTop - seriesNav.offsetHeight);
  })).toBeLessThanOrEqual(3);
});

test('Save-Data uses a medium lightbox image and skips adjacent originals', async ({ browser }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '独立上下文只需执行一次');
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', {
      configurable: true,
      value: { saveData: true, effectiveType: '4g' },
    });
  });
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto('http://127.0.0.1:4322/photos.html', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => page.evaluate(() =>
    Boolean((window as Window & { __reducedData?: boolean }).__reducedData)
  )).toBe(true);
  await page.locator('.gallery-item').first().click();
  await expect(page.locator('#lightboxImg')).toHaveAttribute('src', /-medium\.webp$/);
  await page.waitForTimeout(250);

  const originalRequests = requests.filter((url) =>
    url.includes('/photos/') &&
    /\.(?:webp|jpe?g)(?:\?|$)/i.test(url) &&
    !url.includes('-thumb.') &&
    !url.includes('-medium.') &&
    !/-(?:400|600)\.webp(?:\?|$)/i.test(url)
  );
  expect(originalRequests).toEqual([]);
  await context.close();
});

test('photo hover keeps its border, shadow and image on a stable transition path', async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), '移动端没有鼠标悬停状态');
  await openPage(page, '/photos.html#series-moments');

  const card = page.locator('[data-title="Into the Woods"]');
  await card.scrollIntoViewIfNeeded();
  const restingStyle = await card.evaluate((element) => {
    const image = element.querySelector('img');
    const style = getComputedStyle(element);
    const imageStyle = image ? getComputedStyle(image) : null;
    return {
      isolation: style.isolation,
      transitionProperties: style.transitionProperty.split(',').map((property) => property.trim()),
      imageTransform: imageStyle?.transform || 'none',
    };
  });

  expect(restingStyle.isolation).toBe('isolate');
  expect(restingStyle.transitionProperties).toEqual(['opacity', 'border-color', 'transform', 'box-shadow']);
  expect(restingStyle.imageTransform).not.toBe('none');

  await card.hover();
  await expect(card.locator('.gallery-overlay')).toHaveCSS('opacity', '1');
});

test('reduced motion renders final content and does not install a broken canvas resize path', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await openPage(page, '/index.html');
  await expect(page.locator('#hero-tagline')).toHaveText('Ground-up rebuild.Capabilities. Mindset. Vision.');
  await expect(page.locator('.contact-card').nth(0)).toHaveAttribute('aria-label', '复制Email');
  await expect(page.locator('.contact-card').nth(1)).toHaveAttribute('aria-label', '复制WeChat / Phone');
  await expect(page.locator('.contact-card').nth(2)).toHaveAttribute('aria-label', '复制Location');
  await expect.poll(() => page.evaluate(() => Boolean((window as Window & { lenis?: unknown }).lenis))).toBe(false);

  await openPage(page, '/essays.html');
  await expect(page.locator('#hero-sparkle-canvas')).toHaveCSS('display', 'none');
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await page.waitForTimeout(200);

  const topButton = page.locator('#backToTop');
  const restingBottom = await topButton.evaluate((button) => button.style.bottom);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect.poll(() => topButton.evaluate((button) => button.style.bottom)).not.toBe(restingBottom);
  const liftedBottom = await topButton.evaluate((button) => button.style.bottom);
  await page.waitForTimeout(150);
  await expect(topButton).toHaveCSS('bottom', liftedBottom);
  const positionAfterClick = await page.evaluate(() => {
    document.getElementById('backToTop')?.click();
    return window.scrollY;
  });
  expect(positionAfterClick).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('article back links always return to their collection lists', async ({ page }) => {
  await openPage(page, '/essays.html');

  await Promise.all([
    page.waitForURL(/essay-embers-remain\.html$/, { waitUntil: 'domcontentloaded' }),
    page.locator('a[href="essay-embers-remain.html"]').click(),
  ]);
  await Promise.all([
    page.waitForURL(/essay-youqingchi\.html$/, { waitUntil: 'domcontentloaded' }),
    page.locator('a.article-pagination-link--previous').click(),
  ]);

  await Promise.all([
    page.waitForURL(/essays\.html$/, { waitUntil: 'domcontentloaded' }),
    page.locator('a.note-back-fixed').click(),
  ]);

  await openPage(page, '/note-principles.html');
  await Promise.all([
    page.waitForURL(/notes\.html$/, { waitUntil: 'domcontentloaded' }),
    page.locator('a.note-back-fixed').click(),
  ]);
});

test('essay and note detail pages do not include focus reading mode', async ({ page, request }) => {
  for (const path of ['/essay-qingsimeng.html', '/note-principles.html']) {
    const response = await request.get(path);
    const html = await response.text();
    expect(html).not.toContain('reading-mode.js');
    expect(html).not.toContain('readingModeToggle');

    await openPage(page, path);
    await expect(page.locator('.reading-mode-toggle')).toHaveCount(0);
    await expect(page.locator('.article-tools')).toHaveCount(0);
  }
});

test('article pagination follows the visible newest-first list order', async ({ request }) => {
  const collections = [
    { listPath: '/essays.html', cardPattern: /<a href="(essay-[^"]+\.html)" class="essay-card\b/g },
    { listPath: '/notes.html', cardPattern: /<a[^>]+href="(note-[^"]+\.html)"[^>]+class="[^"]*note-card-link/g },
  ];

  for (const collection of collections) {
    const listResponse = await request.get(collection.listPath);
    expect(listResponse.ok(), `${collection.listPath} should load`).toBe(true);
    const listHtml = await listResponse.text();
    const detailPaths = [...listHtml.matchAll(collection.cardPattern)].map((match) => match[1]);
    expect(detailPaths.length, `${collection.listPath} should contain detail links`).toBeGreaterThan(0);

    for (const [index, detailPath] of detailPaths.entries()) {
      const detailResponse = await request.get(`/${detailPath}`);
      expect(detailResponse.ok(), `/${detailPath} should load`).toBe(true);
      const detailHtml = await detailResponse.text();
      const previousHref = detailHtml.match(/article-pagination-link--previous" href="([^"]+)"/)?.[1] ?? null;
      const nextHref = detailHtml.match(/article-pagination-link--next" href="([^"]+)"/)?.[1] ?? null;

      expect(previousHref, `${detailPath} previous link`).toBe(detailPaths[index - 1] ?? null);
      expect(nextHref, `${detailPath} next link`).toBe(detailPaths[index + 1] ?? null);
    }
  }
});

test('key pages have no serious accessibility violations or horizontal overflow', async ({ page }) => {
  // 一次连续扫描 5 个页面；四个响应式项目并行运行时，axe 在较慢的
  // CI 机器上可能超过全局 30 秒，但检查范围不应因此缩减。
  test.setTimeout(60_000);
  for (const path of keyPages) {
    await openPage(page, path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} has horizontal overflow`).toBeLessThanOrEqual(1);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const serious = results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''));
    expect(serious, `${path} has serious accessibility violations`).toEqual([]);
  }
});

test('the global footer uses the same surface on home and content pages', async ({ page }) => {
  const styles = [];
  for (const path of ['/index.html', '/essays.html', '/note-principles.html']) {
    await openPage(page, path);
    styles.push(await page.locator('.footer').evaluate((footer) => {
      const style = getComputedStyle(footer);
      return {
        background: style.backgroundColor,
        paddingTop: style.paddingTop,
        paddingBottom: style.paddingBottom,
      };
    }));
  }
  expect(styles[1]).toEqual(styles[0]);
  expect(styles[2]).toEqual(styles[0]);
});
