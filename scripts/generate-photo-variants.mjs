import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = resolve(projectRoot, 'site/public');
const force = process.argv.includes('--force');
const cwebp = process.env.CWEBP_PATH || 'cwebp';
const webpinfo = process.env.WEBPINFO_PATH || 'webpinfo';

const versionCheck = spawnSync(cwebp, ['-version'], { encoding: 'utf8' });
if (versionCheck.error || versionCheck.status !== 0) {
  console.error('未找到 cwebp。请先安装 WebP 工具，或通过 CWEBP_PATH 指定可执行文件。');
  process.exit(1);
}

const infoVersionCheck = spawnSync(webpinfo, ['-version'], { encoding: 'utf8' });
if (infoVersionCheck.error || infoVersionCheck.status !== 0) {
  console.error('未找到 webpinfo。请安装 WebP 工具，或通过 WEBPINFO_PATH 指定可执行文件。');
  process.exit(1);
}

function readWebpWidth(file) {
  if (!existsSync(file)) return undefined;

  const result = spawnSync(webpinfo, [file], { encoding: 'utf8' });
  if (result.error || result.status !== 0) return undefined;

  const match = result.stdout.match(/\bWidth:\s+(\d+)/);
  return match ? Number(match[1]) : undefined;
}

const { photoSeries } = await import(new URL('../site/src/data/photos.ts', import.meta.url));
let generated = 0;
let skipped = 0;

for (const series of photoSeries) {
  for (const photo of series.photos) {
    const source = resolve(publicRoot, photo.src.replace(/^\//, ''));
    if (!existsSync(source)) {
      console.error(`缺少照片原图：${photo.src}`);
      process.exitCode = 1;
      continue;
    }

    const variants = [
      { src: photo.small, width: photo.smallWidth },
      { src: photo.compact, width: photo.compactWidth },
      { src: photo.thumb, width: photo.thumbWidth },
      ...(photo.medium && photo.mediumWidth
        ? [{ src: photo.medium, width: photo.mediumWidth }]
        : []),
    ];

    for (const variant of variants) {
      const output = resolve(publicRoot, variant.src.replace(/^\//, ''));
      const outputWidth = readWebpWidth(output);
      if (
        !force &&
        outputWidth === variant.width
      ) {
        skipped += 1;
        continue;
      }

      mkdirSync(dirname(output), { recursive: true });
      const result = spawnSync(cwebp, [
        '-quiet',
        '-q', '82',
        '-m', '4',
        '-resize', String(variant.width), '0',
        source,
        '-o', output,
      ], { encoding: 'utf8' });

      if (result.error || result.status !== 0) {
        console.error(`生成失败：${variant.src}`);
        if (result.stderr) console.error(result.stderr.trim());
        process.exitCode = 1;
        continue;
      }

      const generatedWidth = readWebpWidth(output);
      if (generatedWidth !== variant.width) {
        console.error(
          `尺寸校验失败：${variant.src} 预期 ${variant.width}px，实际 ${generatedWidth ?? '无法读取'}px`,
        );
        process.exitCode = 1;
        continue;
      }

      generated += 1;
      console.log(`已生成 ${variant.src}（${variant.width}px）`);
    }
  }
}

console.log(`照片响应式资源完成：新增/更新 ${generated} 张，跳过 ${skipped} 张。`);
