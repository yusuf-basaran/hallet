import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
const root = new URL('../', import.meta.url).pathname;
const port = Number(process.env.PORT || 3000);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json' };
createServer(async (request, response) => {
  let path = new URL(request.url, 'http://localhost').pathname;
  if (['/index', '/index.html', '/dashboard.html'].includes(path)) {
    response.writeHead(308, { Location: path === '/dashboard.html' ? '/dashboard' : '/' });
    response.end();
    return;
  }
  if (path === '/') path = '/index.html';
  if (path === '/dashboard') path = '/dashboard.html';
  if (!/^\/(index\.html|dashboard\.html|favicon\.svg|site\.webmanifest|assets\/brand\/[\w.-]+\.(?:svg|png|jpg)|(?:js|css)\/[\w.-]+)$/.test(path)) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Sayfa bulunamadı.');
    return;
  }
  try {
    const content = await readFile(join(root, path));
    response.writeHead(200, { 'Content-Type': types[extname(path)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end();
  }
}).listen(port, '127.0.0.1', () => console.log(`HALLET: http://127.0.0.1:${port}`));
