import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const keyPages = ['/index.html', '/essays.html', '/notes.html', '/photos.html', '/essay-embers-remain.html'];

test('navigation spacing follows the responsive stylesheet', async ({ page }, testInfo) => {
  await page.goto('/index.html');
  const layout = await page.locator('#nav').evaluate((nav) => ({
    paddingLeft: Number.parseFloat(getComputedStyle(nav).paddingLeft),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }));

  expect(layout.paddingLeft).toBe(testInfo.project.name === 'mobile' ? 24 : 64);
  expect(layout.overflow).toBeLessThanOrEqual(1);
});

test('quick search is inert as soon as it starts closing', async ({ page }) => {
  await page.goto('/index.html');
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

  await page.goto('/photos.html');
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

test('reduced motion renders final content and does not install a broken canvas resize path', async ({ page }) => {
  const errors: Error[] = [];
  page.on('pageerror', (error) => errors.push(error));
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.goto('/index.html');
  await expect(page.locator('#hero-tagline')).toHaveText('Ground-up rebuild.Capabilities. Mindset. Vision.');

  await page.goto('/essays.html');
  await expect(page.locator('#hero-sparkle-canvas')).toHaveCSS('display', 'none');
  await page.evaluate(() => window.dispatchEvent(new Event('resize')));
  await page.waitForTimeout(200);
  expect(errors).toEqual([]);
});

test('key pages have no serious accessibility violations or horizontal overflow', async ({ page }) => {
  for (const path of keyPages) {
    await page.goto(path);
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
    await page.goto(path);
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
