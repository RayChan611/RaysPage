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

test('hero typewriter does not reveal the complete fallback copy first', async ({ page }) => {
  await openPage(page, '/index.html');
  const tagline = page.locator('#hero-tagline');

  await expect(tagline).toHaveClass(/(?:^|\s)typewriter-pending(?:\s|$)/);
  const pending = await tagline.evaluate((element) => ({
    opacity: Number.parseFloat(getComputedStyle(element).opacity),
    text: element.textContent || '',
  }));
  expect(pending.text).toContain('Capabilities. Mindset. Vision.');
  expect(pending.opacity).toBeLessThan(0.01);

  await expect(tagline).toHaveClass(/(?:^|\s)typewriter-active(?:\s|$)/);
  await expect(tagline).not.toContainText('Capabilities. Mindset. Vision.');
});

test('failed animation runtime releases static content', async ({ page }) => {
  await page.route('**/js/nav.js', (route) => route.abort());
  await openPage(page, '/index.html');

  await expect(page.locator('html')).not.toHaveClass(/(?:^|\s)js(?:\s|$)/, { timeout: 3000 });
  await expect(page.locator('html')).toHaveClass(/(?:^|\s)motion-fallback(?:\s|$)/);
  await expect(page.locator('.hero-name-line').first()).toBeVisible();
  await expect(page.locator('#hero-tagline')).toHaveText('Ground-up rebuild.Capabilities. Mindset. Vision.');
  await expect(page.locator('.animate-on-scroll').first()).toBeVisible();
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
  const activeLine = await page.locator('.nav-link-active').evaluate((link) => ({
    linkWidth: link.getBoundingClientRect().width,
    lineWidth: Number.parseFloat(getComputedStyle(link, '::after').width),
    menuWidth: link.parentElement?.getBoundingClientRect().width || 0,
  }));
  expect(activeLine.lineWidth).toBeCloseTo(activeLine.linkWidth, 0);
  expect(activeLine.linkWidth).toBeLessThan(activeLine.menuWidth * 0.75);
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
  const analyticsTag = html.match(/<script[^>]+cloud\.umami\.is[^>]*>/)?.[0] || '';
  expect(analyticsTag).toContain('async');
  expect(analyticsTag).not.toContain('defer');
  expect(html).not.toContain('Noto+Serif+SC');

  await openPage(page, '/essays.html');
  await expect(page.locator('.essay-card-title').first()).toHaveCSS(
    'font-family',
    /Songti SC.*STSong.*Source Han Serif SC.*Noto Serif CJK SC/,
  );
});

test('all photo cards are present in static markup and the lightbox interactions work', async ({ page, request }) => {
  const response = await request.get('/photos.html');
  const html = await response.text();
  expect((html.match(/class="gallery-item /g) || []).length).toBe(39);
  expect((html.match(/-medium\.webp \d+w/g) || []).length).toBe(28);
  expect(html).toContain('/photos/qingdao/qingdao-1-medium.webp 1280w');
  expect(html).not.toContain('/photos/qingdao/qingdao-1.webp 2000w');
  const mediumPhoto = await request.get('/photos/qingdao/qingdao-1-medium.webp');
  expect(mediumPhoto.ok()).toBe(true);
  expect(mediumPhoto.headers()['content-type']).toContain('image/webp');

  await openPage(page, '/photos.html');
  const cards = page.locator('.gallery-item');
  await expect(cards).toHaveCount(39);
  await cards.first().click();
  const lightbox = page.locator('#lightbox');
  await expect(lightbox).toHaveClass(/active/);
  await expect(page.locator('#lightboxCounter')).toContainText('1 / 39');

  await lightbox.dispatchEvent('wheel', { deltaX: 72, deltaY: 0, deltaMode: 0 });
  await expect(page.locator('#lightboxCounter')).toContainText('2 / 39');

  await lightbox.click({ position: { x: 8, y: 8 } });
  await expect(lightbox).toHaveAttribute('aria-hidden', 'true');
  await expect(lightbox).toHaveAttribute('inert', '');
});

test('photo hover keeps its border, shadow and image on a stable transition path', async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.use.isMobile), '移动端没有鼠标悬停状态');
  await openPage(page, '/photos.html#series-moments');

  const card = page.locator('[data-title="Cactus Garden"]');
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
  expect(errors).toEqual([]);
});

test('article back links always return to their collection lists', async ({ page }) => {
  await openPage(page, '/essays.html');

  await Promise.all([
    page.waitForURL(/essay-embers-remain\.html$/),
    page.locator('a[href="essay-embers-remain.html"]').click(),
  ]);
  await Promise.all([
    page.waitForURL(/essay-youqingchi\.html$/),
    page.locator('a.article-pagination-link--previous').click(),
  ]);

  await page.locator('a.note-back-fixed').click();
  await page.waitForURL(/essays\.html$/);

  await openPage(page, '/note-principles.html');
  await page.locator('a.note-back-fixed').click();
  await page.waitForURL(/notes\.html$/);
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
