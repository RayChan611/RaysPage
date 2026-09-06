import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distRoot = join(repoRoot, 'dist');
const siteOrigin = 'https://www.raychan.top';
const failures = [];

function walk(directory) {
  return readdirSync(directory).flatMap((name) => {
    const entry = join(directory, name);
    return statSync(entry).isDirectory() ? walk(entry) : [entry];
  });
}

function attributeValues(markup, attributePattern) {
  const values = [];
  const pattern = new RegExp(`\\b(?:${attributePattern})\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'gi');
  for (const match of markup.matchAll(pattern)) values.push(match[1] ?? match[2] ?? '');
  return values;
}

function parseAttributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)]
      .map((item) => [item[1], item[2] ?? item[3] ?? ''])
  );
}

function validateHtmlStructure(file, html) {
  const source = relative(repoRoot, file);
  const count = (pattern) => [...html.matchAll(pattern)].length;
  const requiredPairs = [
    ['html', /<html\b/gi, /<\/html\s*>/gi],
    ['head', /<head\b/gi, /<\/head\s*>/gi],
    ['body', /<body\b/gi, /<\/body\s*>/gi],
  ];

  if (!/^\s*<!doctype html>/i.test(html)) failures.push(`${source} -> missing HTML doctype`);
  for (const [name, opening, closing] of requiredPairs) {
    if (count(opening) !== 1 || count(closing) !== 1) {
      failures.push(`${source} -> expected exactly one <${name}> element`);
    }
  }
  if (count(/<main\b/gi) !== 1 || count(/<\/main\s*>/gi) !== 1) {
    failures.push(`${source} -> expected exactly one <main> landmark`);
  }

  const htmlClose = /<\/html\s*>/i.exec(html);
  const bodyClose = /<\/body\s*>/i.exec(html);
  if (htmlClose && html.slice(htmlClose.index + htmlClose[0].length).trim()) {
    failures.push(`${source} -> content appears after </html>`);
  }
  if (htmlClose && bodyClose && bodyClose.index > htmlClose.index) {
    failures.push(`${source} -> </body> appears after </html>`);
  }

  const seenIds = new Set();
  for (const id of attributeValues(html, 'id')) {
    if (seenIds.has(id)) failures.push(`${source} -> duplicate id="${id}"`);
    seenIds.add(id);
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if (attributes.src === '') failures.push(`${source} -> image has an empty src attribute`);
    if (/^(?:青岛|三亚|F1 2025 上海)系列照片\s+\d+$/i.test(attributes.alt || '')) {
      failures.push(`${source} -> image uses a generic numbered alt description`);
    }
  }

  for (const match of html.matchAll(/<button\b[^>]*>/gi)) {
    const attributes = parseAttributes(match[0]);
    if (!attributes.type) failures.push(`${source} -> button is missing an explicit type attribute`);
  }

  const blockElement = 'address|article|aside|blockquote|div|dl|fieldset|footer|form|h[1-6]|header|hr|main|nav|ol|p|pre|section|table|ul';
  const invalidBlockNesting = new RegExp(`<(p|h[1-6])\\b[^>]*>\\s*<(${blockElement})\\b`, 'gi');
  for (const match of html.matchAll(invalidBlockNesting)) {
    failures.push(`${source} -> invalid <${match[2]}> inside <${match[1]}>`);
  }
}

function validateSrcset(file, srcset, pagePath) {
  if (!srcset || srcset.trim().startsWith('data:')) return;
  for (const candidate of srcset.split(',')) {
    const reference = candidate.trim().split(/\s+/, 1)[0];
    if (reference) validateLocalReference(file, reference, pagePath);
  }
}

function validateLocalReference(sourceFile, reference, pagePath) {
  if (!reference || reference.startsWith('#')) return;

  let url;
  try {
    url = new URL(reference, `${siteOrigin}/${pagePath}`);
  } catch {
    failures.push(`${relative(repoRoot, sourceFile)} -> invalid URL ${reference}`);
    return;
  }

  if (url.origin !== siteOrigin || !['http:', 'https:'].includes(url.protocol)) return;

  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    failures.push(`${relative(repoRoot, sourceFile)} -> invalid encoding ${reference}`);
    return;
  }

  if (pathname === '/') pathname = '/index.html';
  let target = join(distRoot, pathname);
  if (target.endsWith('/')) target = join(target, 'index.html');

  const relativeTarget = relative(distRoot, target);
  if (relativeTarget.startsWith('..') || !existsSync(target)) {
    failures.push(`${relative(repoRoot, sourceFile)} -> missing ${reference}`);
  }
}

if (!existsSync(distRoot)) {
  failures.push('dist/ does not exist; run npm run build first');
} else {
  const requiredOutputs = [
    'index.html',
    '404.html',
    'essays.html',
    'notes.html',
    'photos.html',
    'search-index.json',
    'rss.xml',
    'sitemap.xml',
    'asset-manifest.json',
  ];

  for (const output of requiredOutputs) {
    if (!existsSync(join(distRoot, output))) failures.push(`missing required output dist/${output}`);
  }

  const notFoundHtml = readFileSync(join(distRoot, '404.html'), 'utf8');
  const robotsMeta = [...notFoundHtml.matchAll(/<meta\b[^>]*>/gi)]
    .map((match) => parseAttributes(match[0]))
    .find((attributes) => attributes.name?.toLowerCase() === 'robots');
  if (!robotsMeta?.content?.toLowerCase().split(',').map((value) => value.trim()).includes('noindex')) {
    failures.push('dist/404.html -> robots 元信息必须包含 noindex');
  }

  for (const pageName of ['essays.html', 'notes.html']) {
    const html = readFileSync(join(distRoot, pageName), 'utf8');
    const backgroundTag = html.match(/<div\b[^>]*\bid=(?:"global-bg-effect"|'global-bg-effect')[^>]*>/i)?.[0];
    const attributes = backgroundTag ? parseAttributes(backgroundTag) : {};
    if (attributes['aria-hidden'] !== 'true') {
      failures.push(`dist/${pageName} -> 装饰背景必须设置 aria-hidden="true"`);
    }
  }

  const assetNames = readdirSync(join(distRoot, 'assets'));
  const heroAssets = assetNames.filter((name) => /^ray-photo\.[a-f0-9]{8}\.webp$/i.test(name));
  if (heroAssets.length !== 1) {
    failures.push('dist/assets -> 应且仅应存在一个带内容哈希的 ray-photo 主图');
  } else {
    const indexHtml = readFileSync(join(distRoot, 'index.html'), 'utf8');
    const expectedReference = `/assets/${heroAssets[0]}`;
    if (!indexHtml.includes(expectedReference)) {
      failures.push(`dist/index.html -> 缺少版本化主图引用 ${expectedReference}`);
    }
  }
  if (existsSync(join(distRoot, 'assets', 'ray-photo.webp'))) {
    failures.push('dist/assets/ray-photo.webp -> 必须移除未版本化的旧主图');
  }

  const htmlFiles = walk(distRoot).filter((file) => file.endsWith('.html'));
  let versionedAssets = {};
  try {
    versionedAssets = JSON.parse(readFileSync(join(distRoot, 'asset-manifest.json'), 'utf8'));
    for (const [original, versioned] of Object.entries(versionedAssets)) {
      const source = join(distRoot, original);
      const target = join(distRoot, versioned);
      if (!existsSync(source) || !existsSync(target)) {
        failures.push(`资源版本清单存在缺失文件：${original} -> ${versioned}`);
        continue;
      }
      const content = readFileSync(source);
      const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
      const expected = original.replace(/\.(css|js)$/, `.${hash}.$1`);
      if (versioned !== expected || !content.equals(readFileSync(target))) {
        failures.push(`资源版本与内容不匹配：${original} -> ${versioned}`);
      }
    }
    for (const directory of ['css', 'js']) {
      for (const file of walk(join(distRoot, directory))) {
        if (!/\.(?:css|js)$/.test(file) || /\.[a-f0-9]{12}\.(?:css|js)$/.test(file)) continue;
        const url = `/${relative(distRoot, file).split('\\').join('/')}`;
        if (!versionedAssets[url]) failures.push(`资源版本清单缺少 ${url}`);
      }
    }
  } catch (error) {
    failures.push(`资源版本清单无效：${error.message}`);
  }
  for (const file of htmlFiles) {
    const pagePath = relative(distRoot, file).split('\\').join('/');
    const html = readFileSync(file, 'utf8');
    validateHtmlStructure(file, html);

    for (const reference of attributeValues(html, 'href|src|poster')) {
      validateLocalReference(file, reference, pagePath);
      let url;
      try { url = new URL(reference, `${siteOrigin}/${pagePath}`); } catch { continue; }
      if (url.origin === siteOrigin && /^\/(?:css|js)\/.*\.(?:css|js)$/.test(url.pathname) &&
          !Object.values(versionedAssets).includes(url.pathname)) {
        failures.push(`${relative(repoRoot, file)} -> CSS/JS 引用没有内容版本号：${reference}`);
      }
    }
    for (const srcset of attributeValues(html, 'srcset|imagesrcset')) {
      validateSrcset(file, srcset, pagePath);
    }

    for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
      const attributes = parseAttributes(match[0]);
      const key = attributes.property || attributes.name;
      if (key === 'og:image' || key === 'twitter:image') {
        validateLocalReference(file, attributes.content, pagePath);
      }
    }
  }

  const cssFiles = walk(distRoot).filter((file) => file.endsWith('.css'));
  for (const file of cssFiles) {
    const pagePath = relative(distRoot, file).split('\\').join('/');
    const css = readFileSync(file, 'utf8');
    for (const match of css.matchAll(/url\(\s*(?:"([^"]+)"|'([^']+)'|([^)'"\s]+))\s*\)/gi)) {
      validateLocalReference(file, match[1] ?? match[2] ?? match[3], pagePath);
    }
  }

  for (const xmlName of ['rss.xml', 'sitemap.xml']) {
    const file = join(distRoot, xmlName);
    if (!existsSync(file)) continue;
    const xml = readFileSync(file, 'utf8');
    for (const match of xml.matchAll(/https:\/\/www\.raychan\.top\/[^<\s]*/g)) {
      validateLocalReference(file, match[0], xmlName);
    }
  }

  const jsRoot = join(repoRoot, 'site/public/js');
  for (const file of walk(jsRoot).filter((entry) => entry.endsWith('.js'))) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) {
      failures.push(`${relative(repoRoot, file)} -> JavaScript syntax error\n${result.stderr.trim()}`);
    }
  }

  console.log(`Validated ${htmlFiles.length} HTML pages and ${requiredOutputs.length} required outputs.`);
}

const repositoryFiles = spawnSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { cwd: repoRoot, encoding: 'utf8' }
);
if (repositoryFiles.status !== 0) {
  failures.push('could not inspect repository filenames for conflict copies');
} else {
  const conflictCopies = repositoryFiles.stdout
    .split('\0')
    .filter(Boolean)
    .filter((name) => /(?:^|\/)[^/]+ [2-9]\d*(?:\.[^/]+)?$/.test(name));
  for (const name of conflictCopies) failures.push(`${name} -> probable sync conflict copy`);
}

try {
  const edgeConfig = JSON.parse(readFileSync(join(repoRoot, 'edgeone.json'), 'utf8'));
  const immediateRevalidationCacheControl = 'public, max-age=0, must-revalidate';
  const stableAssetCacheControl = 'public, max-age=3600, stale-while-revalidate=86400';
  const globalHeaders = edgeConfig.headers?.find((rule) => rule.source === '/*')?.headers || [];
  const rootHeaders = edgeConfig.headers?.find((rule) => rule.source === '/')?.headers || [];
  const htmlHeaders = edgeConfig.headers?.find((rule) => rule.source === '/*.html')?.headers || [];
  const globalKeys = new Set(globalHeaders.map((header) => header.key.toLowerCase()));
  const requiredHeaders = [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy',
    'permissions-policy',
    'content-security-policy',
  ];
  for (const key of requiredHeaders) {
    if (!globalKeys.has(key)) failures.push(`edgeone.json is missing ${key}`);
  }
  const redirectToWww = edgeConfig.redirects?.find((redirect) => redirect.source === '$host');
  if (redirectToWww?.destination !== '$wwwhost' || redirectToWww?.statusCode !== 301) {
    failures.push('edgeone.json must permanently redirect the apex custom domain to www');
  }
  for (const [source, headers] of [
    ['/', rootHeaders],
    ['/*.html', htmlHeaders],
  ]) {
    const value = headers.find((header) => header.key.toLowerCase() === 'cache-control')?.value || '';
    if (value !== immediateRevalidationCacheControl) {
      failures.push(`edgeone.json ${source} HTML cache rule must revalidate immediately`);
    }
  }
  if (globalKeys.has('content-security-policy-report-only')) {
    failures.push('edgeone.json CSP must enforce rather than only report violations');
  }
  const csp = globalHeaders.find((header) => header.key.toLowerCase() === 'content-security-policy')?.value || '';
  for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'"]) {
    if (!csp.includes(directive)) failures.push(`edgeone.json CSP is missing ${directive}`);
  }
  if (csp.includes('fonts.googleapis.com') || csp.includes('fonts.gstatic.com')) {
    failures.push('edgeone.json CSP must not allow the removed external Google Fonts origins');
  }
  for (const source of [
    '/js/*',
    '/css/*',
    '/photos/*',
    '/images/*',
    '/assets/contact/*',
    '/assets/og/*',
  ]) {
    const headers = edgeConfig.headers?.find((rule) => rule.source === source)?.headers || [];
    const value = headers.find((header) => header.key.toLowerCase() === 'cache-control')?.value || '';
    if (value !== stableAssetCacheControl) {
      failures.push(`edgeone.json ${source} stable asset cache rule must use the short shared policy`);
    }
  }
  const searchHeaders = edgeConfig.headers?.find((rule) => rule.source === '/search-index.json')?.headers || [];
  const searchCacheControl = searchHeaders.find((header) => header.key.toLowerCase() === 'cache-control')?.value || '';
  if (searchCacheControl !== immediateRevalidationCacheControl) {
    failures.push('edgeone.json /search-index.json cache rule must revalidate immediately');
  }
} catch (error) {
  failures.push(`edgeone.json is invalid: ${error.message}`);
}

if (failures.length) {
  console.error('\nValidation failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('Static output validation passed.');
