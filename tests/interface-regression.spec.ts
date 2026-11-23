import { expect, test } from '@playwright/test';

test('手机横屏菜单独立滚动，最后一项可以触达', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, '仅检查手机菜单');
  await page.setViewportSize({ width: 667, height: 320 });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#navMobileBtn').click();
  const menu = page.locator('#navLinks');
  const bounds = (await menu.boundingBox())!;
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(320);
  await expect(menu).toHaveCSS('overflow-y', 'auto');
  const last = menu.locator('a[href="essays.html"]');
  await last.scrollIntoViewIfNeeded();
  const lastBounds = (await last.boundingBox())!;
  expect(lastBounds.y + lastBounds.height).toBeLessThanOrEqual(320);
  await last.click();
  await expect(page).toHaveURL(/essays\.html$/);
});

for (const result of ['false', 'throw', 'true']) {
  test(`兼容复制返回 ${result} 时提示正确并清理临时元素与焦点`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', '不依赖尺寸的复制逻辑只检查一次');
    await page.addInitScript((copyResult) => {
      Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
      Reflect.set(document, 'execCommand', () => {
        if (copyResult === 'throw') throw new Error('模拟复制权限失败');
        return copyResult === 'true';
      });
    }, result);
    await page.goto('/index.html#contact', { waitUntil: 'domcontentloaded' });
    const card = page.locator('.contact-card[data-copy]').first();
    await card.focus();
    await page.keyboard.press('Enter');
    if (result === 'true') {
      await expect(card.locator('.copy-hint')).toHaveText('复制成功');
    } else {
      await expect(page.locator('#rayToast')).toHaveText('复制失败，请手动复制');
      await expect(card).not.toHaveClass(/copied/);
    }
    await expect(page.locator('textarea')).toHaveCount(0);
    await expect(card).toBeFocused();
  });
}
test('首页最近记录与目录一致，摘录入口可到达对应笔记', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '内容来源与目标地址只需检查一次');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const index = await (await request.get('/search-index.json')).json() as Array<{ type: string; href: string; title: string }>;
  const lanpu = index.find((item) => item.href === '/photos.html#series-lanpu')!;
  const latest = [lanpu, ...['essay', 'note'].map((type) => index.find((item) => item.type === type)!)];
  for (const entry of latest) {
    await page.goto('/index.html#recent', { waitUntil: 'domcontentloaded' });
    const link = page.locator(`#recent a[href="${entry.href}"]:not([inert])`);
    await expect(link).toHaveAttribute('href', entry.href);
    await link.click();
    await expect(page).toHaveURL(new URL(entry.href, page.url()).href);
    const hash = new URL(entry.href, page.url()).hash;
    if (hash) await expect(page.locator(hash)).toBeInViewport();
  }
});

test('首页照片每三秒轮播，悬停显示箭头并暂停，移开后恢复', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '桌面端鼠标操作仅检查一次');
  await page.goto('/index.html#recent', { waitUntil: 'domcontentloaded' });
  const track = page.locator('#recent-track');
  const active = track.locator('a:not([inert]) img');
  const previous = page.getByRole('button', { name: '上一张照片' });
  const next = page.getByRole('button', { name: '下一张照片' });
  const entries = page.locator('.recent-text .recent-entry');
  await track.scrollIntoViewIfNeeded();
  await expect(entries).toHaveCount(2);
  const text = await entries.allTextContents();
  await expect(next).toHaveCSS('opacity', '0');
  await expect(active).toHaveAttribute('src', /lanpu-1-600\.webp$/);
  await expect(active).toHaveAttribute('src', /lanpu-2-600\.webp$/, { timeout: 6500 });
  expect(await entries.allTextContents()).toEqual(text);
  await expect(page.locator('.recent-text [inert]')).toHaveCount(0);
  await track.hover();
  await expect(previous).toHaveCSS('opacity', '1');
  await expect(next).toHaveCSS('opacity', '1');
  // 等过一个播放周期，确认仅悬停即可暂停。
  await page.waitForTimeout(3200);
  await expect(active).toHaveAttribute('src', /lanpu-2-600\.webp$/);
  await previous.click();
  await expect(active).toHaveAttribute('src', /lanpu-1-600\.webp$/);
  await previous.click();
  await expect(active).toHaveAttribute('src', /lanpu-10-600\.webp$/);
  await previous.focus();
  await page.keyboard.press('Tab');
  await expect(next).toBeFocused();
  // 鼠标点击已有键盘焦点的箭头后，移开时仍应隐藏箭头并恢复轮播。
  await next.click();
  await expect(active).toHaveAttribute('src', /lanpu-1-600\.webp$/);
  await next.hover();
  await page.waitForTimeout(3200);
  await expect(active).toHaveAttribute('src', /lanpu-1-600\.webp$/);
  await page.mouse.move(1, 1);
  await expect(next).toHaveCSS('opacity', '0');
  await expect(active).toHaveAttribute('src', /lanpu-2-600\.webp$/, { timeout: 6500 });
});

test('首页照片和固定文字在桌面并排、手机上下排列', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/index.html#recent', { waitUntil: 'domcontentloaded' });
  const next = page.getByRole('button', { name: '下一张照片' });
  await expect(next).toBeAttached();
  const photo = (await page.locator('.recent-photo').boundingBox())!;
  const text = (await page.locator('.recent-text').boundingBox())!;
  if (testInfo.project.use.isMobile) {
    expect(text.y).toBeGreaterThan(photo.y + photo.height);
    expect(text.x).toBeCloseTo(photo.x, 0);
  } else {
    expect(text.x).toBeGreaterThan(photo.x + photo.width);
    expect(text.y).toBeCloseTo(photo.y, 0);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  if (testInfo.project.use.isMobile) {
    await expect(next).toHaveCSS('opacity', '1');
    await next.tap();
  } else {
    await page.getByRole('button', { name: '上一张照片' }).focus();
    await page.keyboard.press('Tab');
    await expect(next).toBeFocused();
    await expect(next).toHaveCSS('opacity', '1');
    await page.keyboard.press('Enter');
  }
  await expect(page.locator('#recent-track a:not([inert]) img')).toHaveAttribute('src', /lanpu-2-600\.webp$/);
});

test('首页首屏只准备轮播首图，滚到照片时才准备下一张', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', '在常见手机宽度验证首屏图片请求');
  const photos = new Set<string>();
  await page.route('https://cloud.umami.is/**', (route) => route.abort());
  page.on('request', (request) => {
    const match = new URL(request.url()).pathname.match(/^\/photos\/lanpu\/lanpu-(\d+)-/);
    if (match) photos.add(match[1]);
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  const track = page.locator('#recent-track');
  await expect(track.locator('img')).toHaveCount(1);
  expect([...photos].every((index) => index === '1')).toBe(true);

  await track.scrollIntoViewIfNeeded();
  await expect.poll(() => photos.has('2')).toBe(true);
  await expect(track.locator('img')).toHaveCount(2);
  expect([...photos].sort()).toEqual(['1', '2']);
});

test('联系卡片在平板宽度保持单列，桌面仍为三列', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '只在一个浏览器检查布局切换');
  await page.setViewportSize({ width: 769, height: 900 });
  await page.goto('/index.html#contact', { waitUntil: 'domcontentloaded' });
  const grid = page.locator('.contact-grid');
  await expect(grid).toHaveCSS('grid-template-columns', /^\S+px$/);
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(grid).toHaveCSS('grid-template-columns', /^\S+px \S+px \S+px$/);
});

test('首页按屏幕宽度只请求一张匹配的背景，预加载不会额外下载桌面原图', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (/\/assets\/ray-photo(?:-mobile)?\.[a-f0-9]+\.webp$/.test(new URL(request.url()).pathname)) requests.push(request.url());
  });
  await page.goto('/index.html', { waitUntil: 'networkidle' });
  const mobile = (page.viewportSize()?.width || 0) <= 768;
  const image = page.locator('.hero-bg-img');
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBe(mobile ? 990 : 2400);
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatch(mobile ? /ray-photo-mobile\./ : /ray-photo\./);
});
