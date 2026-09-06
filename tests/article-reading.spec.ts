import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('目录标题延续到正文，返回时保留筛选、滚动位置与键盘焦点', async ({ page }) => {
  await page.goto('/essays.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#searchInput').fill('Poetry');
  const card = page.locator('[data-essay-link="qingsimeng"]');
  await expect(page.locator('[data-essay-link="embers-remain"]')).toHaveAttribute('inert', '');
  await card.scrollIntoViewIfNeeded();
  await expect.poll(() => card.evaluate((element) => Math.round(element.getBoundingClientRect().height))).toBeGreaterThan(50);
  const transitionName = await card.locator('h2').evaluate((element) => getComputedStyle(element).viewTransitionName);
  await card.click();
  await expect(page).toHaveURL(/essay-qingsimeng\.html$/);
  await expect(page.locator('h1')).toHaveCSS('view-transition-name', transitionName);
  await expect(page.locator('#navLinks a[href="essays.html"]')).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('#pageTransitionOverlay')).toBeHidden();
  await page.locator('.note-back-fixed').click();
  await expect(page).toHaveURL(/\/essays\.html$/);
  await expect(page.locator('#searchInput')).toHaveValue('Poetry');
  await expect(card).toBeFocused();
  await expect(card).toBeInViewport();
  await expect(page.locator('[data-essay-link="embers-remain"]')).toBeHidden();
  const state = await page.evaluate(() => JSON.parse(sessionStorage.getItem('ray:essay-position:v1')!));
  expect(await page.evaluate(() => scrollY)).toBeCloseTo(state.scroll, 0);
});

test('短句采用扉页，长文采用内页，窄屏保持完整可读', async ({ page }) => {
  for (const slug of ['no-belief', 'qingsimeng', 'trial', 'embers-remain']) {
    await page.goto(`/essay-${slug}.html`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.essay-body')).toHaveCSS('opacity', '1');
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const size = await page.locator('.essay-body').evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
    if (slug === 'embers-remain') {
      await expect(page.locator('body')).toHaveClass(/page-essay--article/);
      expect(size).toBeGreaterThanOrEqual(16.8);
      expect(size).toBeLessThanOrEqual(18);
    } else {
      await expect(page.locator('body')).toHaveClass(/page-essay--(quote|poem)/);
      expect(size).toBeGreaterThanOrEqual(21.6);
    }
  }
  await page.goto('/essay-qingsimeng.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.essay-quote-text br')).toHaveCount(1);
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(accessibility.violations).toEqual([]);
});

test('支持原生转场的浏览器实际捕获共享标题', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '原生转场能力只需检查一次');
  await page.addInitScript(() => {
    window.addEventListener('pagereveal', (event) => {
      const transition = (event as Event & { viewTransition?: ViewTransition }).viewTransition;
      if (transition) {
        transition.ready.then(() => sessionStorage.setItem('test:reading-transition', 'ready'));
      }
    });
  });
  await page.goto('/essays.html', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-essay-link="no-belief"]').click();
  await expect(page).toHaveURL(/essay-no-belief\.html$/);
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('test:reading-transition'))).toBe('ready');
  await expect(page.locator('.essay-hero-title')).toHaveCSS('opacity', '1');
});

test('禁用存储和减少动态效果时文章仍能普通往返', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('不可用', 'SecurityError'); } });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/essays.html', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-essay-link="no-belief"]').click();
  await expect(page.locator('.essay-body')).toContainText('不要有偏见');
  await page.locator('.note-back-fixed').click();
  await expect(page).toHaveURL(/\/essays\.html$/);
  expect(errors).toEqual([]);
});

test('目录先解析而搜索脚本迟到时，不提前消费恢复状态', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/essays.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#searchInput').fill('Poetry');
  await expect(page.locator('[data-essay-link="embers-remain"]')).toHaveAttribute('inert', '');
  await page.locator('[data-essay-link="qingsimeng"]').click();
  await expect(page).toHaveURL(/essay-qingsimeng\.html$/);
  let releaseSearch: () => void = () => {};
  const delayedSearch = new Promise<void>((resolve) => { releaseSearch = resolve; });
  await page.route(/\/js\/search(?:\.[a-f0-9]{12})?\.js$/, async (route) => {
    await delayedSearch;
    await route.continue();
  });
  const returning = page.locator('.note-back-fixed').click();
  try {
    await page.waitForURL(/\/essays\.html$/, { waitUntil: 'commit' });
    await page.locator('#searchInput').waitFor({ state: 'attached' });
    await expect(page.locator('#searchInput')).not.toHaveAttribute('data-search-ready', 'true');
    // 精确重现 DOM 已存在但 defer 搜索尚未初始化的原生页面呈现时刻。
    await page.evaluate(() => window.dispatchEvent(new Event('pagereveal')));
    expect(await page.evaluate(() => sessionStorage.getItem('ray:essay-return:v1'))).toBe('true');
  } finally {
    releaseSearch();
    await returning;
  }
  await expect(page.locator('#searchInput')).toHaveValue('Poetry');
  await expect(page.locator('[data-essay-link="embers-remain"]')).toBeHidden();
  await expect(page.locator('[data-essay-link="qingsimeng"]')).toBeFocused();
});
