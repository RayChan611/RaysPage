import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encryptResume, isValidAccessCode } from '../site/src/lib/resume-vault.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flags = ['--pdf', '--profile', '--code-file'];

try {
  if (args.length !== 6 || flags.some((flag) => !args.includes(flag))) {
    throw new Error('用法：node --experimental-strip-types scripts/pack-resume.mjs --pdf 项目外原件路径 --profile 项目外资料路径 --code-file 项目外访问码路径');
  }
  const paths = Object.fromEntries(flags.map((flag) => [flag, resolve(args[args.indexOf(flag) + 1])]));
  for (const path of Object.values(paths)) {
    const actual = existsSync(path) ? realpathSync(path) : resolve(realpathSync(dirname(path)), path.split('/').at(-1));
    const inside = relative(realpathSync(root), actual);
    if (!inside.startsWith('..') && !isAbsolute(inside)) throw new Error('原始简历、结构化资料和访问码必须放在项目目录之外。');
  }
  const pdf = readFileSync(paths['--pdf']);
  if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error('输入文件不是有效的 PDF。');
  const profile = JSON.parse(readFileSync(paths['--profile'], 'utf8'));
  const codeFile = paths['--code-file'];
  if (!existsSync(codeFile)) {
    // 默认仍生成长随机码；自定义短码更容易被离线猜中。
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const generated = Array.from(randomBytes(24), (byte) => alphabet[byte & 31]).join('');
    writeFileSync(codeFile, `${generated.match(/.{4}/g).join('-')}\n`, { mode: 0o600, flag: 'wx' });
  }
  chmodSync(codeFile, 0o600);
  const code = readFileSync(codeFile, 'utf8').trim();
  if (!isValidAccessCode(code)) throw new Error('访问码须为 6–64 位英文字母或数字，可用空格或连字符分组。');
  const output = await encryptResume({
    profile,
    document: { name: basename(paths['--pdf']), data: pdf.toString('base64') },
  }, code);
  const target = resolve(root, 'site/public/private/resume.enc');
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, output);
  console.log('已生成加密简历。原件、结构化资料和访问码均保留在项目外；访问码不会打印到日志。');
} catch (error) {
  // 不输出输入文件内容、解密资料或访问码。
  console.error(error instanceof SyntaxError ? '结构化资料不是有效的 JSON。' : error.message);
  process.exitCode = 1;
}
