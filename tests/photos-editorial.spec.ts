import { expect, test } from '@playwright/test';

test('影集保留全部照片、完整比例和图外题注', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/photos.html', { waitUntil: 'domcontentloaded' });
  const cards = page.locator('.gallery-item');
  await expect(cards).toHaveCount(36);
  const layouts = await cards.evaluateAll((items) => items.map((item) => {
    const frame = item.querySelector('.gallery-image')!;
    const image = item.querySelector('img')!;
    const caption = item.querySelector('.gallery-overlay')!;
    const bounds = frame.getBoundingClientRect();
    return {
      ratio: bounds.width / bounds.height,
      expectedRatio: Number(item.getAttribute('data-width')) / Number(item.getAttribute('data-height')),
      captionGap: caption.getBoundingClientRect().top - bounds.bottom,
      opacity: getComputedStyle(caption).opacity,
      objectFit: getComputedStyle(image).objectFit,
    };
  }));
  for (const layout of layouts) {
    expect(layout.ratio).toBeCloseTo(layout.expectedRatio, 2);
    expect(layout.captionGap).toBeGreaterThanOrEqual(-1);
    expect(layout.opacity).toBe('1');
    expect(layout.objectFit).toBe('contain');
  }
  if (testInfo.project.use.isMobile) {
    const firstImage = await cards.first().locator('.gallery-image').boundingBox();
    expect(firstImage?.y).toBeLessThan(470);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  }
});

test('关闭照片恢复原滚动位置，切图后焦点返回当前照片', async ({ page }) => {
  await page.goto('/photos.html', { waitUntil: 'domcontentloaded' });
  const cards = page.locator('.gallery-item');
  await cards.nth(9).scrollIntoViewIfNeeded();
  await cards.nth(9).click();
  const scrollBefore = await page.evaluate(() => scrollY);
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toBeHidden();
  await expect(cards.nth(9)).toBeFocused();
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(scrollBefore, 0);
  await cards.nth(9).click();
  await page.getByRole('button', { name: 'Next image', exact: true }).click();
  await expect(page.locator('#lightboxCounter')).toContainText('11 / 36');
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toBeHidden();
  await expect(cards.nth(10)).toBeFocused();
  await expect(cards.nth(10)).toBeInViewport();
  await cards.first().click();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#lightboxCounter')).toContainText('36 / 36');
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toBeHidden();
  await expect(cards.last()).toBeFocused();
  await expect(cards.last()).toBeInViewport();
});

test('手机单指横拖跟手切图，纵向及双指手势不误切', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, '触摸行为在手机项目验证');
  await page.goto('/photos.html', { waitUntil: 'domcontentloaded' });
  await page.locator('.gallery-item').first().click();
  const image = page.locator('#lightboxImg');
  await expect.poll(() => image.evaluate((element) => element.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);
  const bounds = (await image.boundingBox())!;
  const x = bounds.x + bounds.width * 0.7;
  const y = bounds.y + bounds.height * 0.5;
  const session = await page.context().newCDPSession(page);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 30, y }] });
  await expect(image).not.toHaveCSS('transform', 'none');
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - 105, y }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#lightboxCounter')).toContainText('2 / 36');
  await expect(page.locator('#lightbox')).toHaveClass(/active/);
  await expect.poll(() => image.evaluate((element) => element.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);
  const second = (await image.boundingBox())!;
  const center = { x: second.x + second.width / 2, y: second.y + second.height / 2 };
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: center.x + 3, y: center.y + 80 }] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#lightboxCounter')).toContainText('2 / 36');
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [
    { x: center.x - 30, y: center.y, id: 0 }, { x: center.x + 30, y: center.y, id: 1 },
  ] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
    { x: center.x - 80, y: center.y, id: 0 }, { x: center.x - 20, y: center.y, id: 1 },
  ] });
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(page.locator('#lightboxCounter')).toContainText('2 / 36');
  await session.detach();
});

test('大图失败保留缩略图并如实提示，继续切图仍正常', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { configurable: true, value: { saveData: true, effectiveType: '4g' } });
  });
  await page.route('**/qingdao-1-medium.webp', (route) => route.abort());
  await page.goto('/photos.html', { waitUntil: 'domcontentloaded' });
  await page.locator('.gallery-item').first().click();
  await expect(page.locator('#lightboxStatus')).toContainText('大图暂时无法加载');
  await expect.poll(() => page.locator('#lightboxImg').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#lightboxCounter')).toContainText('2 / 36');
  await expect(page.locator('#lightboxStatus')).toBeEmpty();
  await expect(page.locator('#lightboxImg')).toHaveAttribute('src', /qingdao-2-medium\.webp$/);
});

test('迟到的大图不会覆盖已经切换的照片', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', '异步竞态只需在一个手机上下文验证');
  await page.route('**/qingdao-1-medium.webp', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.goto('/photos.html', { waitUntil: 'domcontentloaded' });
  await page.locator('.gallery-item').first().click();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#lightboxImg')).toHaveAttribute('src', /qingdao-2-medium\.webp$/);
  await page.waitForTimeout(1100);
  await expect(page.locator('#lightboxImg')).toHaveAttribute('src', /qingdao-2-medium\.webp$/);
  await expect(page.locator('#lightboxCounter')).toContainText('2 / 36');
});

test('减少动态效果时照片直接打开和关闭且保持可用', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/photos.html', { waitUntil: 'domcontentloaded' });
  const first = page.locator('.gallery-item').first();
  await first.click();
  await expect(page.locator('#lightbox')).toHaveClass(/active/);
  expect(await page.locator('#lightboxImg').evaluate((element) => element.getAnimations().length)).toBe(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toBeHidden();
  await expect(first).toBeFocused();
});

test('放大照片后支持原生横向平移，缩小后恢复切图手势', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', '原生缩放只需在一个 Chromium 手机上下文验证');
  await page.goto('/photos.html', { waitUntil: 'domcontentloaded' });
  await page.locator('.gallery-item').first().click();
  const lightbox = page.locator('#lightbox');
  const image = page.locator('#lightboxImg');
  await expect.poll(() => image.evaluate((element) => element.getAnimations().filter((animation) => animation.playState === 'running').length)).toBe(0);
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
  await expect(lightbox).toHaveClass(/is-zoomed/);
  await expect(image).toHaveCSS('touch-action', 'auto');
  await expect(page.locator('.lightbox-content')).toHaveCSS('touch-action', 'auto');
  const before = await page.evaluate(() => visualViewport!.offsetLeft);
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 160, y: 300 }] });
  for (const x of [145, 120, 90, 60]) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: 300 }] });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => page.evaluate(() => visualViewport!.offsetLeft)).toBeGreaterThan(before + 30);
  await expect(page.locator('#lightboxCounter')).toContainText('1 / 36');
  await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 1 });
  await expect(lightbox).not.toHaveClass(/is-zoomed/);
  await expect(image).toHaveCSS('touch-action', 'pan-y pinch-zoom');
  await session.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });
  await expect(lightbox).toHaveClass(/is-zoomed/);
  await page.keyboard.press('Escape');
  await expect(lightbox).toBeHidden();
  await expect(lightbox).not.toHaveClass(/is-zoomed/);
  await session.detach();
});

test('桌面惯性滚动中打开照片会冻结背景，关闭保留位置及原运行状态', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '只有桌面启用 Lenis 滚动插值');
  await page.goto('/photos.html', { waitUntil: 'domcontentloaded' });
  const first = page.locator('.gallery-item').first();
  await expect(first).toBeInViewport();
  await page.waitForTimeout(800);
  await page.mouse.move(100, 700);
  await page.mouse.wheel(0, 600);
  await page.waitForTimeout(80);
  // 直接点击仍在视口里的首图，不等待惯性滚动完成。
  await page.mouse.click(100, 700);
  await expect(page.locator('#lightbox')).toHaveClass(/active/);
  const openedAt = await page.evaluate(() => scrollY);
  // 标签恢复时，全站管理器先启动动画，灯箱必须随后继续暂停背景。
  await page.evaluate(() => {
    window.dispatchEvent(new Event('pageshow'));
    document.dispatchEvent(new Event('visibilitychange'));
  });
  expect(await page.evaluate(() => (window as Window & { lenis?: { isStopped: boolean } }).lenis?.isStopped)).toBe(true);
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(openedAt, 0);
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toBeHidden();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(openedAt, 0);
  await expect(first).toBeFocused();
  await expect(first).toBeInViewport();
  expect(await page.evaluate(() => (window as Window & { lenis?: { isStopped: boolean } }).lenis?.isStopped)).toBe(false);
  await page.evaluate(() => (window as Window & { lenis?: { stop(): void } }).lenis?.stop());
  await first.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#lightbox')).toBeHidden();
  expect(await page.evaluate(() => (window as Window & { lenis?: { isStopped: boolean } }).lenis?.isStopped)).toBe(true);
});
