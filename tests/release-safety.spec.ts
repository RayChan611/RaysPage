import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { versionStaticAssets } from '../scripts/version-static-assets.mjs';

test('资源版本由内容决定，重复处理和嵌套页面保持正确', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '构建逻辑只需检查一次');
  const root = mkdtempSync(join(tmpdir(), 'rayspage-asset-version-'));
  try {
    for (const directory of ['css', 'js/vendor', 'nested']) mkdirSync(join(root, directory), { recursive: true });
    writeFileSync(join(root, 'css/site.css'), 'body { background: url(../images/paper.webp); }');
    writeFileSync(join(root, 'js/vendor/test.min.js'), 'window.assetVersion = 1;');
    writeFileSync(join(root, 'index.html'), '<link href="/css/site.css"><script src="/js/vendor/test.min.js"></script>');
    writeFileSync(join(root, '404.html'), '<link href="/css/site.css"><script src="https://example.org/script.js"></script>');
    writeFileSync(join(root, 'nested/page.html'), '<link href="../css/site.css"><script src="../js/vendor/test.min.js?v=1#ready"></script>');

    const initial = versionStaticAssets(root);
    expect(initial['/css/site.css']).toMatch(/^\/css\/site\.[a-f0-9]{12}\.css$/);
    expect(readFileSync(join(root, initial['/css/site.css']), 'utf8')).toContain('../images/paper.webp');
    expect(readFileSync(join(root, 'nested/page.html'), 'utf8')).toContain(`${initial['/js/vendor/test.min.js']}?v=1#ready`);
    expect(readFileSync(join(root, '404.html'), 'utf8')).toContain('https://example.org/script.js');
    const firstPage = readFileSync(join(root, 'index.html'), 'utf8');
    const firstManifest = readFileSync(join(root, 'asset-manifest.json'), 'utf8');
    expect(versionStaticAssets(root)).toEqual(initial);
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toBe(firstPage);
    expect(readFileSync(join(root, 'asset-manifest.json'), 'utf8')).toBe(firstManifest);

    writeFileSync(join(root, 'css/site.css'), 'body { color: #eee; }');
    const changed = versionStaticAssets(root);
    expect(changed['/css/site.css']).not.toBe(initial['/css/site.css']);
    expect(changed['/js/vendor/test.min.js']).toBe(initial['/js/vendor/test.min.js']);
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toContain(changed['/css/site.css']);
    expect(readFileSync(join(root, 'index.html'), 'utf8')).not.toContain(initial['/css/site.css']);
  } finally {
    // 只移除本测试通过 mkdtemp 创建的专用目录。
    rmSync(root, { recursive: true, force: true });
  }
});

test('发布页面实际请求带内容版本号的样式与脚本，包含 404', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '所有产物资源只需检查一次');
  const response = await request.get('/asset-manifest.json');
  expect(response.ok()).toBe(true);
  const manifest = await response.json() as Record<string, string>;
  expect(Object.keys(manifest).length).toBeGreaterThan(10);
  for (const [original, versioned] of Object.entries(manifest)) {
    const asset = await request.get(versioned);
    expect(asset.ok(), versioned).toBe(true);
    const hash = createHash('sha256').update(await asset.body()).digest('hex').slice(0, 12);
    expect(versioned).toBe(original.replace(/\.(css|js)$/, `.${hash}.$1`));
  }
  for (const path of ['/index.html', '/essays.html', '/photos.html', '/essay-qingsimeng.html', '/404.html']) {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    const references = await page.locator('script[src], link[rel="stylesheet"]').evaluateAll((elements) =>
      elements.map((element) => element.getAttribute('src') || element.getAttribute('href') || '')
        .filter((url) => /^\/(css|js)\//.test(url))
    );
    expect(references.length).toBeGreaterThan(0);
    expect(references.every((url) => Object.values(manifest).includes(url)), path).toBe(true);
  }
});

test('WebKit 手机首页经历逐字阶段，并在减少动态效果时显示静态文案', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-webkit', 'Safari 类浏览器的手机核心验收');
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const tagline = page.locator('#hero-tagline');
  await expect.poll(() => tagline.evaluate((element) => ({
    active: element.classList.contains('typewriter-active'),
    complete: (element.textContent || '').includes('Capabilities. Mindset. Vision.'),
  }))).toEqual({ active: true, complete: false });
  await expect(tagline).toHaveText('Ground-up rebuild.Capabilities. Mindset. Vision.', { timeout: 10_000 });

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(tagline).toHaveText('Ground-up rebuild.Capabilities. Mindset. Vision.');
  await expect(tagline).not.toHaveClass(/typewriter-pending|typewriter-active|typing/);
  await expect(tagline).toHaveCSS('opacity', '1');
});

test('WebKit 手机可使用横屏菜单、搜索、文章往返和照片浏览', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-webkit', 'Safari 类浏览器的手机核心验收');
  test.setTimeout(45_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 667, height: 320 });
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#navMobileBtn').click();
  await page.locator('#navLinks a[href="essays.html"]').click();
  await expect(page).toHaveURL(/essays\.html$/);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#quickSearchTrigger').click();
  await page.locator('#quickSearchInput').fill('秦观');
  await page.locator('#quickSearchResults a').first().click();
  await expect(page).toHaveURL(/essay-qingsimeng\.html$/);
  await page.locator('a.note-back-fixed').click();
  await expect(page).toHaveURL(/essays\.html$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);

  await page.goto('/photos.html', { waitUntil: 'domcontentloaded' });
  await page.locator('.gallery-item').first().click();
  await expect(page.locator('#lightbox')).toHaveClass(/active/);
  await expect(page.locator('#lightboxImg')).toBeVisible();
  await page.locator('#lightbox').click({ position: { x: 8, y: 8 } });
  await expect(page.locator('#lightbox')).toHaveAttribute('aria-hidden', 'true');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
