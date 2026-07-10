/**
 * migrate-content.mjs
 * -------------------
 * One-off migration: turns the hand-written essay/note `.astro` pages into
 * Astro Content Collections (MDX).
 *
 *   - Listing pages (essays.astro / notes.astro) are parsed for card metadata
 *     (title, date, excerpt, tag, book name, detail link).
 *   - Each detail page (essay-*.astro / note-*.astro) is parsed for its
 *     `bodyHtml` (article markup) + meta (description, ogImage) + the
 *     per-page inlineStyles / inlineScripts.
 *   - Output: site/src/content/essays/*.mdx and site/src/content/notes/*.mdx
 *
 * Run:  node site/migrate-content.mjs
 *
 * Idempotent-ish: overwrites the content dir each run. Safe to re-run.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'); // rayspage-astro/
const PAGES = join(ROOT, 'site/src/pages');
const OUT = join(ROOT, 'site/src/content');

const ESSAYS_OUT = join(OUT, 'essays');
const NOTES_OUT = join(OUT, 'notes');

// Collected per-page assets we promote to shared files (task 27).
const collectedStyles = new Set();
const collectedBackLift = new Set();

function unescapeStr(s) {
  return s
    .replace(/\\"/g, '"')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '');
}

/**
 * Extract the string items of an inline `const x = ["...", "..."];` or
 * `x: ["...", ...]` array. A naive `[\s\S]*?]` / `];` boundary is unreliable
 * here: `inlineStyles` is not always followed by `];` (it may sit inside the
 * `meta` object as `inlineStyles: [...],`), and `inlineScripts` code contains
 * `]` chars of its own (e.g. `e[0]`). So we scan with a string-aware bracket
 * matcher that ignores brackets appearing inside string literals.
 */
function extractArrayItems(raw, keyword) {
  const start = raw.indexOf(keyword);
  if (start < 0) return [];
  const open = raw.indexOf('[', start);
  if (open < 0) return [];
  let depth = 0;
  let inStr = false;
  let esc = false;
  let i = open;
  for (; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
    } else {
      if (ch === '"') inStr = true;
      else if (ch === '[') depth++;
      else if (ch === ']') {
        depth--;
        if (depth === 0) break;
      }
    }
  }
  const lit = raw.slice(open, i + 1);
  return [...lit.matchAll(/"((?:[^"\\]|\\.)*)"/g)]
    .map((m) => unescapeStr(m[1]))
    .filter((s) => s.trim());
}

function read(file) {
  return readFileSync(file, 'utf8');
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * MDX/JSX requires void elements to be self-closing (`<br />`). The source
 * HTML uses HTML-style `<br>`, `<img ...>`, `<hr>`, `<input ...>` etc.
 * Normalise them so the MDX compiler doesn't choke on unclosed tags.
 */
function normalizeVoid(html) {
  return html.replace(
    /<(br|hr|img|input|meta|link|col|area|base|embed|source|track|wbr)((?:(?!\/>)[^>])*)>/gi,
    '<$1$2 />'
  );
}

/**
 * MDX compiles embedded HTML through its JSX parser (mdast-util-mdx-jsx), which
 * is stricter than the HTML parser. A known failure mode: when a line contains
 * several tags AND one of them opens but its content/close spans to the next
 * line (e.g. `<div class="dialogue"><div class="speaker">x</div><div class="text">`
 * with the `<p>` on the following line), the JSX parser misreads it as a
 * `<div>` opened inside a paragraph and throws
 * "Expected a closing tag for `<div>` ... before the end of `paragraph`".
 *
 * The reliable fix is to put every tag on its own line (pretty-print): split
 * after each non-self-closing `>` and before each `<`. This guarantees each
 * opening tag starts a fresh line, which the JSX parser handles correctly.
 * Whitespace between tags is collapsed by the browser, so output is identical.
 */
function stripBlankLines(html) {
  return html
    .replace(/(?<!\/)>/g, '>\n') // newline after each non-self-closing '>'
    .replace(/(?<!\n)</g, '\n<') // newline before each '<' not already at line start
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.trim() !== '')
    .join('\n');
}

function isoFromDotDate(dot) {
  // "2026.07.01" -> "2026-07-01"
  const m = dot.match(/(\d{4})\.(\d{2})\.(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : dot;
}

function extractDetail(raw) {
  const body = (raw.match(/const bodyHtml = "([\s\S]*?)";\s*\n/) || [])[1] || '';
  const title = (raw.match(/title:\s*"([^"]*)"/) || [])[1] || '';
  const description = (raw.match(/description:\s*"([^"]*)"/) || [])[1] || '';
  const ogImage = (raw.match(/ogImage:\s*"([^"]*)"/) || [])[1] || '';
  // inlineStyles / inlineScripts appear as `inlineStyles: [...]` or
  // `const inlineScripts = [...]`. Pull out each string literal safely.
  const inlineStyles = extractArrayItems(raw, 'inlineStyles');
  const inlineScripts = extractArrayItems(raw, 'inlineScripts');

  inlineStyles.forEach((s) => collectedStyles.add(s.trim()));
  inlineScripts.forEach((s) => s.includes('note-back-fixed') && collectedBackLift.add(s.trim()));

  return {
    body: stripBlankLines(normalizeVoid(unescapeStr(body))),
    titleClean: title.split(' | ')[0].trim(),
    description,
    ogImage,
  };
}

function writeMdx(dir, slug, frontmatter, body) {
  mkdirSync(dir, { recursive: true });
  const fm = Object.entries(frontmatter)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => {
      if (Array.isArray(v)) return `${k}: [${v.map((x) => JSON.stringify(x)).join(', ')}]`;
      if (typeof v === 'boolean' || typeof v === 'number') return `${k}: ${v}`;
      return `${k}: ${JSON.stringify(v)}`;
    })
    .join('\n');
  const content = `---\n${fm}\n---\n\n${body}\n`;
  writeFileSync(join(dir, `${slug}.mdx`), content, 'utf8');
  console.log(`  ✓ wrote ${join(dirname(dir).split('/').slice(-1)[0], slug + '.mdx')}`);
}

// ---------------------------------------------------------------------------
// ESSAYS
// ---------------------------------------------------------------------------
console.log('\n[essays]');
// Listing markup lives inside a JS string literal with escaped quotes — unescape
// before regex parsing so attribute quotes become real `"`.
const essaysListing = unescapeStr(read(join(PAGES, 'essays.astro')));
const essayCardRe = /<a href="essay-([a-z-]+)\.html" class="essay-card[^"]*">([\s\S]*?)<\/a>/g;
let m;
const essayCards = [];
while ((m = essayCardRe.exec(essaysListing)) !== null) {
  const inner = m[2];
  const date = (inner.match(/<span class="essay-date">([^<]*)<\/span>/) || [])[1] || '';
  const title = (inner.match(/<h3 class="essay-card-title">([\s\S]*?)<\/h3>/) || [])[1] || '';
  const excerpt = (inner.match(/<p class="essay-card-excerpt">([\s\S]*?)<\/p>/) || [])[1] || '';
  const tag = (inner.match(/<span class="essay-card-tag">([^<]*)<\/span>/) || [])[1] || '';
  essayCards.push({ slug: m[1], date, title: stripTags(title), excerpt: stripTags(excerpt), tag });
}

for (const card of essayCards) {
  const detailPath = join(PAGES, `essay-${card.slug}.astro`);
  if (!existsSync(detailPath)) {
    console.warn(`  ! missing detail page for essay-${card.slug}.astro, skipping`);
    continue;
  }
  const d = extractDetail(read(detailPath));
  writeMdx(ESSAYS_OUT, card.slug, {
    title: card.title || d.titleClean,
    date: isoFromDotDate(card.date),
    description: d.description,
    excerpt: card.excerpt,
    tags: card.tag ? [card.tag] : [],
    ogImage: d.ogImage,
  }, d.body);
}

// ---------------------------------------------------------------------------
// NOTES
// ---------------------------------------------------------------------------
console.log('\n[notes]');
const notesListing = unescapeStr(read(join(PAGES, 'notes.astro')));

// hasDetail cards: <a href="note-X.html" class="note-card note-card-link ..." style="...">
const noteDetailRe = /<a href="note-([a-z-]+)\.html" class="note-card[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
const noteStandaloneRe = /<article class="note-card[^"]*">([\s\S]*?)<\/article>/g;

const noteHasDetail = [];
while ((m = noteDetailRe.exec(notesListing)) !== null) {
  noteHasDetail.push({ slug: m[1], inner: m[2] });
}
const noteStandalone = [];
while ((m = noteStandaloneRe.exec(notesListing)) !== null) {
  noteStandalone.push({ inner: m[1] });
}
console.log(`  found ${noteHasDetail.length} detail-linked cards, ${noteStandalone.length} standalone excerpt cards`);

// Standalone cards get stable slugs (they never had detail URLs).
let extraN = 0;
for (const card of noteStandalone) {
  const book = (card.inner.match(/<span class="note-book-name">([\s\S]*?)<\/span>/) || [])[1] || '';
  const tag = (card.inner.match(/<span class="note-card-tag">([^<]*)<\/span>/) || [])[1] || '';
  const exStart = card.inner.indexOf('<div class="note-excerpt">');
  const excerptHtml = exStart >= 0 ? stripBlankLines(normalizeVoid(card.inner.slice(exStart))) : '';
  extraN += 1;
  writeMdx(NOTES_OUT, `extra-${extraN}`, {
    title: stripTags(book),
    book: stripTags(book),
    date: `2024-01-0${extraN}`, // placeholder — user should correct real dates
    excerpt: excerptHtml,
    tags: tag ? [tag] : [],
    hasDetail: false,
  }, excerptHtml);
}

for (const card of noteHasDetail) {
  const detailPath = join(PAGES, `note-${card.slug}.astro`);
  if (!existsSync(detailPath)) {
    console.warn(`  ! missing detail page for note-${card.slug}.astro, skipping`);
    continue;
  }
  const d = extractDetail(read(detailPath));
  const book = (card.inner.match(/<span class="note-book-name">([\s\S]*?)<\/span>/) || [])[1] || '';
  const tag = (card.inner.match(/<span class="note-card-tag">([^<]*)<\/span>/) || [])[1] || '';
  const exStart = card.inner.indexOf('<div class="note-excerpt">');
  const excerptHtml = exStart >= 0 ? stripBlankLines(normalizeVoid(card.inner.slice(exStart))) : '';
  writeMdx(NOTES_OUT, card.slug, {
    title: d.titleClean,
    book: stripTags(book),
    date: `2025-01-0${noteHasDetail.indexOf(card) + 1}`, // placeholder — user should correct
    description: d.description,
    excerpt: excerptHtml,
    tags: tag ? [tag] : [],
    ogImage: d.ogImage,
    hasDetail: true,
  }, d.body);
}

// ---------------------------------------------------------------------------
// Emit collected per-page assets for manual promotion into shared files.
// ---------------------------------------------------------------------------
const stylePath = join(ROOT, 'site', 'collected-inline-styles.css');
writeFileSync(stylePath, [...collectedStyles].join('\n\n/* --- */\n\n'), 'utf8');
console.log(`\n[collected] wrote ${stylePath} (${collectedStyles.size} unique style blocks)`);

const liftPath = join(ROOT, 'site', 'collected-back-lift.js');
writeFileSync(liftPath, [...collectedBackLift].join('\n\n'), 'utf8');
console.log(`[collected] wrote ${liftPath} (${collectedBackLift.size} back-lift script(s))`);

console.log('\nDONE. Next: review generated MDX, then run the listing/detail route rewrite.');
