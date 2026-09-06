import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const origin = 'https://www.raychan.top';
const versionedName = /\.[a-f0-9]{12}\.(?:css|js)$/;
const walk = (directory) => readdirSync(directory).flatMap((name) => {
  const path = join(directory, name);
  return statSync(path).isDirectory() ? walk(path) : [path];
});

// 文件保留在原目录，CSS 中图片与字体的相对地址不因版本化改变。
// Astro 的 /_astro/ 已由其构建器版本化，这里只处理 public 的 CSS/JS。
/** @param {string} distRoot */
export function versionStaticAssets(distRoot) {
  const manifestPath = join(distRoot, 'asset-manifest.json');
  const previous = existsSync(manifestPath)
    ? JSON.parse(readFileSync(manifestPath, 'utf8'))
    : {};
  /** @type {Record<string, string>} */
  const manifest = {};
  const replacements = new Map();

  for (const directory of ['css', 'js']) {
    const assetRoot = join(distRoot, directory);
    if (!existsSync(assetRoot)) continue;
    for (const file of walk(assetRoot).sort()) {
      if (!/\.(?:css|js)$/.test(file) || versionedName.test(file)) continue;
      const content = readFileSync(file);
      const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
      const extension = extname(file);
      const versionedFile = `${file.slice(0, -extension.length)}.${hash}${extension}`;
      const original = `/${relative(distRoot, file).split('\\').join('/')}`;
      const versioned = `/${relative(distRoot, versionedFile).split('\\').join('/')}`;
      writeFileSync(versionedFile, content);
      manifest[original] = versioned;
      replacements.set(original, versioned);
      // 允许对同一构建目录重复运行，也能更新之前已经替换的引用。
      if (previous[original]) replacements.set(previous[original], versioned);
    }
  }

  for (const file of walk(distRoot).filter((entry) => entry.endsWith('.html'))) {
    const pageUrl = new URL(relative(distRoot, file).split('\\').join('/'), `${origin}/`);
    const html = readFileSync(file, 'utf8');
    const updated = html.replace(/\b(href|src)=(['"])([^'"]*)\2/g, (attribute, name, quote, reference) => {
      let url;
      try { url = new URL(reference, pageUrl); } catch { return attribute; }
      if (url.origin !== origin) return attribute;
      const versioned = replacements.get(url.pathname);
      return versioned ? `${name}=${quote}${versioned}${url.search}${url.hash}${quote}` : attribute;
    });
    if (updated !== html) writeFileSync(file, updated);
  }
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  return manifest;
}
