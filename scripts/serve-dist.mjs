import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, relative, resolve } from 'node:path';

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

createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }

  if (pathname === '/') pathname = '/index.html';
  let file = join(root, pathname);
  if (relative(root, file).startsWith('..')) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');

  let status = 200;
  if (!existsSync(file) || !statSync(file).isFile()) {
    file = join(root, '404.html');
    status = 404;
  }

  response.writeHead(status, {
    'Content-Type': mimeTypes[extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-store',
  });
  if (request.method === 'HEAD') response.end();
  else createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving dist at http://127.0.0.1:${port}`);
});
