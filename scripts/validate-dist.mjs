import { spawnSync } from 'node:child_process';
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
  ];

  for (const output of requiredOutputs) {
    if (!existsSync(join(distRoot, output))) failures.push(`missing required output dist/${output}`);
  }

  const htmlFiles = walk(distRoot).filter((file) => file.endsWith('.html'));
  for (const file of htmlFiles) {
    const pagePath = relative(distRoot, file).split('\\').join('/');
    const html = readFileSync(file, 'utf8');
    validateHtmlStructure(file, html);

    for (const reference of attributeValues(html, 'href|src|poster')) {
      validateLocalReference(file, reference, pagePath);
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
  const globalHeaders = edgeConfig.headers?.find((rule) => rule.source === '/*')?.headers || [];
  const htmlHeaders = edgeConfig.headers?.find((rule) => rule.source === '/*.html')?.headers || [];
  const globalKeys = new Set(globalHeaders.map((header) => header.key.toLowerCase()));
  const requiredHeaders = [
    'strict-transport-security',
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy',
    'permissions-policy',
  ];
  for (const key of requiredHeaders) {
    if (!globalKeys.has(key)) failures.push(`edgeone.json is missing ${key}`);
  }
  const cacheControl = htmlHeaders.find((header) => header.key.toLowerCase() === 'cache-control');
  if (!cacheControl?.value.includes('max-age=0')) {
    failures.push('edgeone.json HTML cache rule must include max-age=0');
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
