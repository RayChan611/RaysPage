import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { encryptResume, type ResumePayload } from '../site/src/lib/resume-vault';

// 仅用于自动化的虚构资料和访问码，不包含真实简历或真实访问码。
const accessCode = 'ABCD-EFGH-JKLM-NPQR-STUV-WXYZ';
const pdf = Buffer.from('%PDF-1.4\n% 简历下载测试\n%%EOF');
const payload: ResumePayload = {
  profile: {
    name: '简历测试者', role: '示例岗位', details: ['示例地点'],
    sections: [{
      title: '工作经历', entries: [{
        title: '示例公司', subtitle: '示例职位', location: '示例城市', period: '2024 - 2026',
        points: [{ label: '项目经历', body: '<img src=x onerror="window.resumeInjected=true">仅作为文字显示。' }],
      }],
    }],
  },
  document: { name: '示例简历.pdf', data: pdf.toString('base64') },
};
let encrypted: Buffer;

test.beforeAll(async () => { encrypted = Buffer.from(await encryptResume(payload, accessCode)); });
test.beforeEach(async ({ page }) => {
  await page.route('**/private/resume.enc', (route) => route.fulfill({ body: encrypted, contentType: 'application/octet-stream' }));
});

async function unlock(page: import('@playwright/test').Page) {
  await page.locator('#resumeCode').fill(accessCode);
  await page.getByRole('button', { name: /查看简历/ }).click();
  await expect(page.locator('#resumeView')).toBeVisible();
}

test('入口保持低调，未解锁页面和搜索输出不包含简历，且不加载第三方统计', async ({ page, request }) => {
  await page.goto('/index.html', { waitUntil: 'domcontentloaded' });
  const link = page.locator('.footer-sign');
  await expect(link).toHaveAttribute('href', '/resume.html');
  await expect(link).toHaveAttribute('rel', 'nofollow');
  await link.click();
  await expect(page).toHaveURL(/\/resume\.html$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('#resumeContent')).toBeEmpty();
  await expect(page.locator('#resumeDownload')).not.toHaveAttribute('href');
  await expect(page.locator('script[src*="umami"]')).toHaveCount(0);
  await expect(page.locator('#navLinks a[href="/resume.html"]')).toHaveCount(0);
  for (const path of ['/search-index.json', '/sitemap.xml', '/rss.xml']) {
    const response = await request.get(path);
    expect(await response.text()).not.toContain('/resume.html');
  }
  const actual = await request.get('/private/resume.enc');
  expect((await actual.body()).subarray(0, 8).toString()).toBe('RAYRES01');
  const original = await request.get('/private/resume.pdf');
  expect(original.status()).toBe(404);
});

test('错误访问码不暴露内容，正确解锁后可下载原 PDF，结束查看会清空正文和地址', async ({ page }) => {
  await page.goto('/resume.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#resumeCode').fill('ABCD-EFGH-JKLM-NPQR-STUV-WXY2');
  await page.getByRole('button', { name: /查看简历/ }).click();
  await expect(page.locator('#resumeStatus')).toContainText('访问码不正确');
  await expect(page.locator('#resumeContent')).toBeEmpty();
  await expect(page.locator('#resumeCode')).toBeFocused();
  await unlock(page);
  await expect(page.locator('#resumeContent h1')).toHaveText(payload.profile.name);
  await expect(page.locator('#resumeContent img')).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as Record<string, unknown>).resumeInjected)).toBeUndefined();
  expect(await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length }))).toEqual({ local: 0, session: 0 });
  await expect(page.locator('#resumeCode')).toHaveValue('');
  const [download] = await Promise.all([
    page.waitForEvent('download'), page.locator('#resumeDownload').click(),
  ]);
  expect(download.suggestedFilename()).toBe('示例简历.pdf');
  const path = await download.path();
  expect(createHash('sha256').update(await readFile(path!)).digest('hex'))
    .toBe(createHash('sha256').update(pdf).digest('hex'));
  await page.getByRole('button', { name: /结束查看/ }).click();
  await expect(page.locator('#resumeContent')).toBeEmpty();
  await expect(page.locator('#resumeDownload')).not.toHaveAttribute('href');
  await expect(page.locator('#resumeCode')).toBeFocused();
  await expect(page.locator('#resumeView')).toBeHidden();
});

test('自定义六位访问码可以解锁，输错仍保持锁定，且不区分大小写', async ({ page }) => {
  const customCode = 'DEMO42';
  const customEncrypted = Buffer.from(await encryptResume(payload, customCode));
  await page.unroute('**/private/resume.enc');
  await page.route('**/private/resume.enc', (route) => route.fulfill({ body: customEncrypted, contentType: 'application/octet-stream' }));
  await page.goto('/resume.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#resumeCode').fill('DEMO43');
  await page.getByRole('button', { name: /查看简历/ }).click();
  await expect(page.locator('#resumeStatus')).toContainText('访问码不正确');
  await expect(page.locator('#resumeContent')).toBeEmpty();
  await page.locator('#resumeCode').fill(customCode.toLowerCase());
  await page.getByRole('button', { name: /查看简历/ }).click();
  await expect(page.locator('#resumeContent h1')).toHaveText(payload.profile.name);
  await expect(page.locator('#resumeDownload')).toBeVisible();
  await expect(page.locator('#resumeCode')).toHaveValue('');
});

test('刷新、离开和十五分钟到期均需重新解锁', async ({ page }) => {
  await page.clock.install();
  await page.goto('/resume.html', { waitUntil: 'domcontentloaded' });
  await unlock(page);
  await page.clock.fastForward(15 * 60_000 + 1);
  await expect(page.locator('#resumeView')).toBeHidden();
  await expect(page.locator('#resumeStatus')).toContainText('本次查看已结束');
  await unlock(page);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#resumeView')).toBeHidden();
  await expect(page.locator('#resumeContent')).toBeEmpty();
  await unlock(page);
  await page.locator('.nav-logo').click();
  await expect(page).toHaveURL(/index\.html$/);
  await page.goBack({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#resumeView')).toBeHidden();
  await expect(page.locator('#resumeContent')).toBeEmpty();
});

test('网络失败可重试，篡改密文不能解锁，异常均不会显示半份简历', async ({ page }) => {
  await page.goto('/resume.html', { waitUntil: 'domcontentloaded' });
  await page.unroute('**/private/resume.enc');
  await page.route('**/private/resume.enc', (route) => route.abort());
  await page.locator('#resumeCode').fill(accessCode);
  await page.getByRole('button', { name: /查看简历/ }).click();
  await expect(page.locator('#resumeStatus')).toContainText('请检查网络后重试');
  await expect(page.locator('#resumeContent')).toBeEmpty();
  await page.unroute('**/private/resume.enc');
  const tampered = Buffer.from(encrypted);
  tampered[tampered.length - 1] ^= 1;
  await page.route('**/private/resume.enc', (route) => route.fulfill({ body: tampered }));
  await page.getByRole('button', { name: /查看简历/ }).click();
  await expect(page.locator('#resumeStatus')).toContainText('访问码不正确');
  await expect(page.locator('#resumeContent')).toBeEmpty();
  await page.unroute('**/private/resume.enc');
  await page.route('**/private/resume.enc', (route) => route.fulfill({ body: encrypted }));
  await unlock(page);
  await expect(page.locator('#resumeContent h1')).toHaveText(payload.profile.name);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});

test('只在提交完整访问码后读取密文，访问码不会出现在 URL 或请求正文', async ({ page }) => {
  const requests: import('@playwright/test').Request[] = [];
  page.on('request', (request) => requests.push(request));
  await page.goto('/resume.html', { waitUntil: 'domcontentloaded' });
  expect(requests.some((request) => request.url().includes('/private/'))).toBe(false);
  await page.locator('#resumeCode').fill('1234');
  await page.getByRole('button', { name: /查看简历/ }).click();
  await expect(page.locator('#resumeStatus')).toContainText('请检查访问码是否完整');
  expect(requests.some((request) => request.url().includes('/private/'))).toBe(false);
  await unlock(page);
  expect(requests.every((request) => !request.url().includes(accessCode) && !request.postData()?.includes(accessCode))).toBe(true);
  await expect(page).toHaveURL(/\/resume\.html$/);
});

test.describe('禁用脚本', () => {
  test.use({ javaScriptEnabled: false });
  test('输入和提交保持关闭，避免浏览器用普通表单泄漏访问码', async ({ page }) => {
    await page.goto('/resume.html');
    await expect(page.locator('#resumeCode')).toBeDisabled();
    await expect(page.locator('#resumeSubmit')).toBeDisabled();
    await expect(page.getByText('请启用 JavaScript 后输入访问码，或联系分享者获取 PDF。')).toBeVisible();
    await expect(page.locator('#resumeContent')).toBeEmpty();
  });
});
