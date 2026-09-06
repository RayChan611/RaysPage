import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

async function openSearch(page: Page) {
  await page.goto('/essays.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#quickSearchTrigger').click();
  await expect(page.locator('#quickSearchInput')).toBeFocused();
  await expect(page.locator('.quick-search-result').first()).toBeVisible();
}

test('全文、描述和作者可以检索，结果显示命中片段', async ({ page, request }) => {
  const index = await (await request.get('/search-index.json')).json();
  const essay = index.find((item: { href: string }) => item.href === '/essay-embers-remain.html');
  expect(essay.content).toContain('ORDI');
  expect(essay.content).not.toMatch(/<\/?(?:p|div|section)\b|class=/);
  const note = index.find((item: { href: string }) => item.href === '/note-katwu-lenny.html');
  expect(note.author).toBe('Cat Wu · Anthropic');

  await openSearch(page);
  for (const [query, href] of [
    ['ORDI', '/essay-embers-remain.html'],
    ['秦观', '/essay-qingsimeng.html'],
    ['欧阳修', '/essay-youqingchi.html'],
    ['Anthropic', '/note-katwu-lenny.html'],
  ]) {
    await page.locator('#quickSearchInput').fill(query);
    const result = page.locator(`.quick-search-result[href="${href}"]`);
    await expect(result).toBeVisible();
    await expect(result.locator('.quick-search-result-description')).toContainText(query);
    expect((await result.locator('.quick-search-result-description').innerText()).length).toBeLessThanOrEqual(102);
  }
});

test('输入法选字回车不会打开结果，确认后正常回车仍可打开', async ({ page }) => {
  await openSearch(page);
  const input = page.locator('#quickSearchInput');
  await input.fill('轻似梦');
  await expect(page.locator('.quick-search-result')).toHaveCount(1);

  // 分别覆盖组合事件状态、标准 isComposing 和 Safari 的 229 兼容路径。
  for (const mode of ['composition', 'isComposing', 'safari229']) {
    const prevented = await input.evaluate((element, eventMode) => {
      if (eventMode === 'composition') {
        element.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      }
      const event = new KeyboardEvent('keydown', {
        key: 'Enter', bubbles: true, cancelable: true,
        isComposing: eventMode === 'isComposing',
        keyCode: eventMode === 'safari229' ? 229 : 13,
      });
      element.dispatchEvent(event);
      if (eventMode === 'composition') {
        element.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: '轻似梦' }));
      }
      return event.defaultPrevented;
    }, mode);
    expect(prevented).toBe(false);
    await expect(page.locator('#quickSearch')).toHaveAttribute('aria-hidden', 'false');
    await expect(input).toBeFocused();
    await expect(page).toHaveURL(/\/essays\.html$/);
  }
  await input.press('Enter');
  await expect(page).toHaveURL(/\/essay-qingsimeng\.html$/);
});

test('方向键移动真实焦点，回车与高亮打开同一条结果', async ({ page }) => {
  await openSearch(page);
  const links = page.locator('.quick-search-result');
  const secondHref = await links.nth(1).getAttribute('href');
  const secondUrl = new URL(secondHref!, page.url()).href;
  await page.keyboard.press('ArrowDown');
  await expect(links.first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(links.nth(1)).toBeFocused();
  await expect(links.nth(1)).toHaveClass(/is-active/);
  await expect(links.first()).not.toHaveClass(/is-active/);
  // 鼠标经过其他项不改变键盘即将打开的目标。
  await links.first().dispatchEvent('mousemove');
  await expect(links.nth(1)).toBeFocused();
  await expect(links.nth(1)).toHaveClass(/is-active/);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(secondUrl);
});

test('Tab 和 Shift Tab 完整经过关闭按钮、输入框与结果', async ({ page }) => {
  await openSearch(page);
  const input = page.locator('#quickSearchInput');
  const close = page.locator('.quick-search-close');
  const links = page.locator('.quick-search-result');
  await page.keyboard.press('Shift+Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(links.last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  for (let index = 0; index < await links.count(); index++) {
    await page.keyboard.press('Tab');
    await expect(links.nth(index)).toBeFocused();
  }
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await close.press('Enter');
  await expect(page.locator('#quickSearch')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#quickSearchTrigger')).toBeFocused();
});

test('无结果时关闭按钮仍在焦点循环中', async ({ page }) => {
  await openSearch(page);
  const input = page.locator('#quickSearchInput');
  const close = page.locator('.quick-search-close');
  await input.fill('没有对应内容的唯一搜索词-20260906');
  await expect(page.locator('.quick-search-result')).toHaveCount(0);
  await input.press('Tab');
  await expect(close).toBeFocused();
  await close.press('Tab');
  await expect(input).toBeFocused();
});

test('搜索片段按纯文本呈现，不执行索引中的 HTML', async ({ page }) => {
  await page.route('**/search-index.json*', (route) => route.fulfill({
    json: [{
      type: 'essay', title: '<b>安全文本</b>', href: '/essay-qingsimeng.html',
      description: '<img src=x onerror="window.searchInjected=true">',
      featured: true, keywords: [],
    }],
  }));
  await openSearch(page);
  const result = page.locator('.quick-search-result');
  await expect(result.locator('.quick-search-result-title')).toHaveText('<b>安全文本</b>');
  await expect(result.locator('.quick-search-result-description')).toContainText('<img src=x');
  await expect(result.locator('img, b, script')).toHaveCount(0);
  expect(await page.evaluate(() => 'searchInjected' in window)).toBe(false);
});

test('搜索对话框使用可访问的输入框和原生结果链接', async ({ page }) => {
  await openSearch(page);
  const audit = await new AxeBuilder({ page }).include('#quickSearch')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
  await expect(page.getByRole('searchbox', { name: '搜索文章、笔记、照片与页面' })).toBeVisible();
  await expect(page.locator('.quick-search-result').first()).toHaveAttribute('href', /\.html/);
});

test('全站搜索可打开被 Notes 列表过滤隐藏的同页摘录', async ({ page }) => {
  await page.goto('/notes.html', { waitUntil: 'domcontentloaded' });
  const listInput = page.locator('#searchInput');
  const target = page.locator('#note-extra-1');
  await listInput.fill('AI 交易时代');
  await expect(target).toHaveClass(/is-hidden/);
  await page.locator('#quickSearchTrigger').click();
  await page.locator('#quickSearchInput').fill('股票大作手');
  await page.locator('.quick-search-result[href="/notes.html#note-extra-1"]').click();
  await expect(page).toHaveURL(/\/notes\.html#note-extra-1$/);
  await expect(listInput).toHaveValue('');
  await expect(target).not.toHaveClass(/is-hidden/);
  await expect(target).not.toHaveAttribute('inert');
  await expect(target).toBeInViewport();
});

test('目录恢复事件同步重建筛选顺序并真正移除隐藏卡片占位', async ({ page }) => {
  await page.goto('/essays.html', { waitUntil: 'domcontentloaded' });
  const input = page.locator('#searchInput');
  await expect(input).toHaveAttribute('data-search-ready', 'true');
  // 先创建未执行的普通输入延迟任务，恢复事件应取消它。
  const restored = await input.evaluate((element) => {
    const field = element as HTMLInputElement;
    field.value = 'Trading';
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.value = 'Poetry';
    field.dispatchEvent(new Event('ray:restore-search'));
    const cards = Array.from(document.querySelectorAll<HTMLElement>('.essay-card'));
    return {
      titles: cards.filter((card) => !card.classList.contains('is-hidden'))
        .map((card) => card.querySelector('.essay-card-title')?.textContent),
      hiddenHeights: cards.filter((card) => card.classList.contains('is-hidden'))
        .map((card) => card.getBoundingClientRect().height),
    };
  });
  expect(restored.titles).toEqual(['轻似梦', '有情痴']);
  expect(restored.hiddenHeights.length).toBeGreaterThan(0);
  expect(restored.hiddenHeights.every((height) => height === 0)).toBe(true);
  await page.waitForTimeout(200);
  await expect(page.locator('.essay-card:not(.is-hidden) .essay-card-title')).toHaveText(['轻似梦', '有情痴']);
  await input.evaluate((element) => {
    (element as HTMLInputElement).value = '';
    element.dispatchEvent(new Event('ray:restore-search'));
  });
  await expect(page.locator('.essay-card.is-hidden')).toHaveCount(0);
  expect(await page.locator('.essay-card').evaluateAll((cards) => cards.every((card) => card.getBoundingClientRect().height > 0))).toBe(true);
});
