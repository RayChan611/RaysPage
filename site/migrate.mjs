import fs from 'node:fs';
import path from 'node:path';

const SRC = '/Users/ray/PersonalProject/RaysPage';
const OUT = '/Users/ray/PersonalProject/rayspage-astro/site/src/pages';
// Scripts handled globally by BaseLayout (do NOT re-emit per page).
const GLOBAL = ['unpkg.com/lenis', 'js/components.js', 'js/smooth-scroll.js', 'js/cursor.js', 'js/nav.js'];

const currentFor = (f) => {
  if (f === 'index.html') return 'home';
  if (f === 'essays.html') return 'essays';
  if (f === 'notes.html') return 'notes';
  if (f === 'photos.html') return 'photos';
  return 'other';
};

function genPage(f, html) {
  const m = (re) => { const x = html.match(re); return x ? x[1] : ''; };
  const title = m(/<title>([\s\S]*?)<\/title>/);
  const description = m(/<meta name="description" content="([^"]*)"/);
  const canonical = m(/<link rel="canonical" href="([^"]*)"/);
  const og = {};
  for (const x of html.matchAll(/<meta property="og:([^"]+)" content="([^"]*)"/g)) og[x[1]] = x[2];
  const tw = {};
  for (const x of html.matchAll(/<meta name="twitter:([^"]+)" content="([^"]*)"/g)) tw[x[1]] = x[2];
  const ogType = og['type'] || 'website';
  const ogImage = og['image'] || 'https://www.raychan.top/assets/og/default.png';
  const ogUrl = og['url'] || canonical;
  const twitterImage = tw['image'] || ogImage;

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
  let body = bodyMatch ? bodyMatch[1] : '';

  // page-specific external scripts: scan the WHOLE document (head + body).
  // Exclude globals + umami (both handled by BaseLayout).
  const pageScripts = [];
  const _seen = new Set();
  for (const mm of html.matchAll(/<script[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/g)) {
    const s = mm[1].trim();
    if (GLOBAL.some((g) => s.includes(g))) continue;
    if (s.includes('umami')) continue;
    if (_seen.has(s)) continue;
    _seen.add(s);
    pageScripts.push(s);
  }
  // strip all external script tags from body (prevent double-emit; they are
  // re-emitted via pageScripts below)
  body = body.replace(/<script[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/g, (mm, src) => {
    const s = src.trim();
    if (GLOBAL.some((g) => s.includes(g)) || s.includes('umami')) return '';
    return '';
  });

  // inline scripts (no src) — keep, emit as is:inline so the browser runs them
  const inlineScripts = [];
  body = body.replace(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g, (mm, code) => {
    if (!code.trim()) return '';
    inlineScripts.push(code.trim());
    return '';
  });

  // inline <style> blocks (page-specific custom CSS) — keep, emit as is:inline
  const inlineStyles = [];
  for (const mm of html.matchAll(/<style(?:\s[^>]*)?>([\s\S]*?)<\/style>/g)) {
    const code = mm[1].trim();
    if (!code) continue;
    inlineStyles.push(code);
  }

  // strip chrome slots / overlay / comments / body links
  body = body.replace(/<div id="cursor-slot">[\s\S]*?<\/div>/g, '');
  body = body.replace(/<div id="nav-slot">[\s\S]*?<\/div>/g, '');
  body = body.replace(/<div id="footer-slot">[\s\S]*?<\/div>/g, '');
  body = body.replace(/<div class="page-transition-overlay"[\s\S]*?<\/div>/g, '');
  body = body.replace(/<!--[\s\S]*?-->/g, '');
  body = body.replace(/<link[^>]*>/g, '');
  body = body.trim();

  const extraCss = [];
  for (const x of html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)) {
    const href = x[1];
    if (href.includes('css/style.css')) continue;
    extraCss.push(href);
  }

  if (f === '404.html') {
    return `---
const title = ${JSON.stringify(title)};
const description = ${JSON.stringify(description)};
const bodyHtml = ${JSON.stringify(body)};
const inlineScripts = ${JSON.stringify(inlineScripts)};
---
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" media="print" onload="this.media='all'" />
  <link rel="stylesheet" href="/css/404.css" />
</head>
<body>
  <Fragment set:html={bodyHtml} />
  {inlineScripts.map((c) => <script is:inline set:html={c}></script>)}
</body>
</html>
`;
  }

  const current = currentFor(f);
  const preloadPhoto = f === 'index.html';
  return `---
import BaseLayout from '../layouts/BaseLayout.astro';
const meta = {
  title: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
  canonical: ${JSON.stringify(canonical)},
  ogType: ${JSON.stringify(ogType)},
  ogImage: ${JSON.stringify(ogImage)},
  ogUrl: ${JSON.stringify(ogUrl)},
  twitterImage: ${JSON.stringify(twitterImage)},
  extraCss: ${JSON.stringify(extraCss)},
  current: ${JSON.stringify(current)},
  preloadPhoto: ${JSON.stringify(preloadPhoto)},
  inlineStyles: ${JSON.stringify(inlineStyles)},
};
const bodyHtml = ${JSON.stringify(body)};
const pageScripts = ${JSON.stringify(pageScripts)};
const inlineScripts = ${JSON.stringify(inlineScripts)};
---
<BaseLayout {...meta}>
  <Fragment set:html={bodyHtml} />
  {pageScripts.map((s) => <script is:inline defer src={'/' + s}></script>)}
  {inlineScripts.map((c) => <script is:inline set:html={c}></script>)}
</BaseLayout>
`;
}

const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.html'));
for (const f of files) {
  const html = fs.readFileSync(path.join(SRC, f), 'utf8');
  const name = f === 'index.html' ? 'index' : f.replace(/\.html$/, '');
  fs.writeFileSync(path.join(OUT, name + '.astro'), genPage(f, html));
  console.log('generated', name + '.astro');
}
console.log('DONE', files.length, 'pages');
