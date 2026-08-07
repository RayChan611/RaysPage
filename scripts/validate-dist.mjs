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

    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      validateLocalReference(file, match[1], pagePath);
    }

    for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
      const attributes = Object.fromEntries(
        [...match[0].matchAll(/([\w:-]+)="([^"]*)"/g)].map((item) => [item[1], item[2]])
      );
      const key = attributes.property || attributes.name;
      if (key === 'og:image' || key === 'twitter:image') {
        validateLocalReference(file, attributes.content, pagePath);
      }
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
