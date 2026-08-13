import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const keyPages = ['/index.html', '/essays.html', '/notes.html', '/photos.html', '/essay-embers-remain.html'];
const openPage = (page: Page, path: string) => page.goto(path, { waitUntil: 'domcontentloaded' });

test('navigation spacing follows the responsive stylesheet', async ({ page }, testInfo) => {
  await openPage(page, '/index.html');
  const layout = await page.locator('#nav').evaluate((nav) => ({
    paddingLeft: Number.parseFloat(getComputedStyle(nav).paddingLeft),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

  expect(layout.paddingLeft).toBe(testInfo.project.name === 'mobile' ? 24 : 64);
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
  await page.waitForTimeout(1700);
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

test('all photo cards are present in static markup and the lightbox interactions work', async ({ page, request }) => {
  const response = await request.get('/photos.html');
  const html = await response.text();
  expect((html.match(/class="gallery-item /g) || []).length).toBe(39);

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
  test.skip(testInfo.project.name === 'mobile', '移动端没有鼠标悬停状态');
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

test('reduced motion keeps in-site back-button history semantics', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openPage(page, '/essays.html');

  await Promise.all([
    page.waitForURL(/essay-embers-remain\.html$/),
    page.locator('a[href="essay-embers-remain.html"]').click(),
  ]);
  await Promise.all([
    page.waitForURL(/essay-youqingchi\.html$/),
    page.locator('a.article-pagination-link--next').click(),
  ]);

  await page.locator('a.note-back-fixed').click();
  await page.waitForURL(/essay-embers-remain\.html$/);
});

test('key pages have no serious accessibility violations or horizontal overflow', async ({ page }) => {
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
