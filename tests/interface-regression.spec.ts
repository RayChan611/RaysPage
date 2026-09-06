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
