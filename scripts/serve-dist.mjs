import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, join, relative, resolve } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT || 4322);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.xml': 'application/xml; charset=utf-8',
};

async function loadFile(file) {
  try {
    const info = await stat(file);
    const resolvedFile = info.isDirectory() ? join(file, 'index.html') : file;
    return { file: resolvedFile, body: await readFile(resolvedFile) };
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'ENOTDIR') return null;
    throw error;
  }
}

createServer(async (request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  if (pathname === '/') pathname = '/index.html';
  const requestedFile = join(root, pathname);
  const relativeFile = relative(root, requestedFile);
  if (relativeFile.startsWith('..') || isAbsolute(relativeFile)) {
    response.writeHead(403).end('Forbidden');
    return;
  }

  try {
    let status = 200;
    let result = await loadFile(requestedFile);
    if (!result) {
      status = 404;
      result = await loadFile(join(root, '404.html'));
    }

    // `npm run build` 重建 dist 时会出现短暂空窗。本地预览若恰好收到请求，
    // 应返回可重试响应，而不是因未处理的文件流错误而崩溃。
    if (!result) {
      response.writeHead(503, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'Retry-After': '1',
      }).end('Build output is temporarily unavailable.');
      return;
    }

    response.writeHead(status, {
      'Content-Type': mimeTypes[extname(result.file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    if (request.method === 'HEAD') response.end();
    else response.end(result.body);
  } catch (error) {
    console.error('Static preview request failed:', error.message);
    if (!response.headersSent) {
      response.writeHead(500, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      });
    }
    response.end('Internal server error.');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving dist at http://127.0.0.1:${port}`);
});
