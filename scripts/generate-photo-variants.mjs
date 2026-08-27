import { existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = resolve(projectRoot, 'site/public');
const force = process.argv.includes('--force');
const cwebp = process.env.CWEBP_PATH || 'cwebp';

const versionCheck = spawnSync(cwebp, ['-version'], { encoding: 'utf8' });
if (versionCheck.error || versionCheck.status !== 0) {
  console.error('未找到 cwebp。请先安装 WebP 工具，或通过 CWEBP_PATH 指定可执行文件。');
  process.exit(1);
}

const { photoSeries } = await import(new URL('../site/src/data/photos.ts', import.meta.url));
let generated = 0;
let skipped = 0;

for (const series of photoSeries) {
  for (const photo of series.photos) {
    if (!photo.medium || !photo.mediumWidth) continue;

    const source = resolve(publicRoot, photo.src.replace(/^\//, ''));
    const output = resolve(publicRoot, photo.medium.replace(/^\//, ''));
    if (!existsSync(source)) {
      console.error(`缺少照片原图：${photo.src}`);
      process.exitCode = 1;
      continue;
    }

    if (
      !force &&
      existsSync(output) &&
      statSync(output).mtimeMs >= statSync(source).mtimeMs
    ) {
      skipped += 1;
      continue;
    }

    mkdirSync(dirname(output), { recursive: true });
    const result = spawnSync(cwebp, [
      '-quiet',
      '-q', '82',
      '-m', '4',
      '-resize', String(photo.mediumWidth), '0',
      source,
      '-o', output,
    ], { encoding: 'utf8' });

    if (result.error || result.status !== 0) {
      console.error(`生成失败：${photo.medium}`);
      if (result.stderr) console.error(result.stderr.trim());
      process.exitCode = 1;
      continue;
    }

    generated += 1;
    console.log(`已生成 ${photo.medium}（${photo.mediumWidth}px）`);
  }
}

console.log(`照片响应式资源完成：新增/更新 ${generated} 张，跳过 ${skipped} 张。`);
