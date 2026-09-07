import { expect, test } from '@playwright/test';

test('RC 的展开与收回按真实字宽同步，不挤动右侧导航', async ({ page, browserName }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop' || browserName !== 'chromium', '精确跳时在 Chromium 验证；WebKit 使用真实鼠标逐帧采样');
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  const logo = page.locator('.nav-logo');
  const collapsed = await logo.boundingBox();
  const rightBefore = await page.locator('.nav-right').boundingBox();
  await logo.hover();
  const frames = await logo.evaluate((element) => {
    const parts = [...element.querySelectorAll('.nav-logo-expand, .nav-logo-expand2')];
    const animations = element.getAnimations({ subtree: true });
    animations.forEach((animation) => animation.pause());
    return [0, 0.25, 0.5, 0.75, 1].map((progress) => {
      animations.forEach((animation) => {
        animation.currentTime = Number(animation.effect!.getTiming().duration) * progress;
      });
      return {
        width: element.getBoundingClientRect().width,
        left: element.getBoundingClientRect().left,
        parts: parts.map((part) => ({
          width: part.getBoundingClientRect().width,
          textWidth: part.firstElementChild!.scrollWidth,
          opacity: Number(getComputedStyle(part).opacity),
          delay: getComputedStyle(part).transitionDelay,
          duration: getComputedStyle(part).transitionDuration,
          properties: getComputedStyle(part).transitionProperty,
        })),
      };
    });
  });
  expect(frames[0].width).toBeCloseTo(collapsed!.width, 0);
  expect(frames[4].width).toBeGreaterThan(collapsed!.width + 40);
  for (const [index, frame] of frames.entries()) {
    expect(frame.left).toBe(collapsed!.x);
    if (index > 0) expect(frame.width).toBeGreaterThan(frames[index - 1].width);
    for (const part of frame.parts) {
      expect(part.delay.split(',').every((delay) => Number.parseFloat(delay) === 0)).toBe(true);
      expect(new Set(part.duration.split(',').map((duration) => duration.trim())).size).toBe(1);
      expect(part.properties).toBe('grid-template-columns, opacity');
      expect(part.width / part.textWidth).toBeCloseTo(part.opacity, 1);
    }
  }
  const rightAfter = await page.locator('.nav-right').boundingBox();
  expect(rightAfter!.x).toBeCloseTo(rightBefore!.x, 1);
  expect(rightAfter!.width).toBeCloseTo(rightBefore!.width, 1);
  await logo.evaluate((element) => element.getAnimations({ subtree: true }).forEach((animation) => animation.finish()));
  await page.mouse.move(400, 180);
  await expect.poll(async () => (await logo.boundingBox())!.width).toBeCloseTo(collapsed!.width, 0);
});

test('RC 快速移入移出从当前帧反向，不跳到完全展开或收起', async ({ page, browserName }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop' || browserName !== 'chromium', '精确跳时在 Chromium 验证；WebKit 使用真实鼠标逐帧采样');
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  const logo = page.locator('.nav-logo');
  const collapsed = (await logo.boundingBox())!.width;
  await logo.hover();
  const before = await logo.evaluate((element) => {
    element.getAnimations({ subtree: true }).forEach((animation) => {
      animation.pause();
      animation.currentTime = 60;
    });
    return element.getBoundingClientRect().width;
  });
  await page.mouse.move(400, 180);
  const reversed = await logo.evaluate((element) => {
    element.getAnimations({ subtree: true }).forEach((animation) => {
      animation.pause();
      animation.currentTime = 0;
    });
    return element.getBoundingClientRect().width;
  });
  expect(before).toBeGreaterThan(collapsed + 5);
  expect(reversed).toBeCloseTo(before, 0);
  await logo.evaluate((element) => element.getAnimations({ subtree: true }).forEach((animation) => animation.finish()));
  await expect.poll(async () => (await logo.boundingBox())!.width).toBeCloseTo(collapsed, 0);
  await logo.hover();
  await expect(logo.locator('.nav-logo-expand2')).toHaveCSS('opacity', '1');
});

test('RC 真实鼠标展开与收回持续平滑，快速反向后仍能稳定归位', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', '真实鼠标轨迹在桌面浏览器验证');
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  const logo = page.locator('.nav-logo');
  const initial = (await logo.boundingBox())!;
  const right = (await page.locator('.nav-right').boundingBox())!;
  for (const eventName of ['pointerenter', 'pointerleave']) {
    const recording = page.evaluate((event) => new Promise<Array<{ width: number; navLeft: number }>>((resolve) => {
      const element = document.querySelector('.nav-logo')!;
      const nav = document.querySelector('.nav-right')!;
      element.addEventListener(event, () => {
        const start = performance.now();
        const frames: Array<{ width: number; navLeft: number }> = [];
        const sample = () => {
          frames.push({ width: element.getBoundingClientRect().width, navLeft: nav.getBoundingClientRect().left });
          if (performance.now() - start < 420) requestAnimationFrame(sample);
          else resolve(frames);
        };
        sample();
      }, { once: true });
    }), eventName);
    if (eventName === 'pointerenter') await logo.hover();
    else await page.mouse.move(400, 180);
    const frames = await recording;
    expect(frames.some((frame) => frame.width > initial.width + 2 && frame.width < initial.width + 50)).toBe(true);
    for (let index = 0; index < frames.length; index += 1) {
      expect(frames[index].navLeft).toBeCloseTo(right.x, 1);
      if (index === 0) continue;
      if (eventName === 'pointerenter') expect(frames[index].width).toBeGreaterThanOrEqual(frames[index - 1].width - 0.1);
      else expect(frames[index].width).toBeLessThanOrEqual(frames[index - 1].width + 0.1);
    }
  }
  // 真实时间线中途反向，不通过修改 currentTime 干扰浏览器的过渡状态。
  for (let cycle = 0; cycle < 3; cycle += 1) {
    await page.mouse.move(initial.x + 5, initial.y + 10);
    await page.waitForTimeout(60);
    await page.mouse.move(400, 180);
    await page.waitForTimeout(60);
  }
  await expect.poll(async () => (await logo.boundingBox())!.width).toBeCloseTo(initial.width, 0);
  await expect(logo.locator('.nav-logo-expand2')).toHaveCSS('opacity', '0');
});

test('键盘可展开 RC 并返回首页，减少动态效果时不等待动画', async ({ page, browserName }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/photos.html', { waitUntil: 'domcontentloaded' });
  const logo = page.locator('.nav-logo');
  // macOS WebKit 默认 Tab 跳过链接，Option + Tab 才遍历包括链接的全部控件。
  const tabKey = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.keyboard.press(tabKey);
  await page.keyboard.press(tabKey);
  await expect(logo).toBeFocused();
  await expect(logo.locator('.nav-logo-expand')).toHaveCSS('opacity', '1');
  await expect(logo.locator('.nav-logo-expand2')).toHaveCSS('opacity', '1');
  const activeAnimations = await logo.evaluate((element) => element.getAnimations({ subtree: true })
    .filter((animation) => animation.playState === 'running').length);
  expect(activeAnimations).toBe(0);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/index\.html$/);
});

test('手机触摸 RC 直接回首页，不留下悬停展开态', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.use.isMobile, '触摸语义在手机上下文验证');
  await page.goto('/photos.html', { waitUntil: 'domcontentloaded' });
  await page.locator('.nav-logo').tap();
  await expect(page).toHaveURL(/index\.html$/);
  await expect(page.locator('.nav-logo-expand')).toHaveCSS('opacity', '0');
  await expect(page.locator('.nav-logo-expand2')).toHaveCSS('opacity', '0');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
