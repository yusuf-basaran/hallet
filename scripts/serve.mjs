import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { buildSite } from './build.mjs';
let root = new URL('../dist/', import.meta.url).pathname;
const port = Number(process.env.PORT || 3000);
if (!process.env.SERVE_DIST) await buildSite({ root: new URL('../', import.meta.url).pathname, env: { SITE_ORIGIN: `http://127.0.0.1:${port}` } });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };
createServer(async (request, response) => {
  let path = new URL(request.url, 'http://localhost').pathname;
  if (['/index', '/index.html', '/dashboard.html', '/en.html', '/ru.html', '/en/', '/ru/'].includes(path)) {
    response.writeHead(308, { Location: path.startsWith('/dashboard') ? '/dashboard' : path.startsWith('/en') ? '/en' : path.startsWith('/ru') ? '/ru' : '/' });
    response.end();
    return;
  }
  if (path === '/') path = '/index.html';
  if (path === '/dashboard') path = '/dashboard.html';
  if (['/en', '/ru'].includes(path)) path += '.html';
  if (!/^\/(index\.html|dashboard\.html|en\.html|ru\.html|404\.html|google674aad00b94cd44d\.html|robots\.txt|sitemap\.xml|favicon\.svg|site\.webmanifest|assets\/brand\/[\w.-]+\.(?:svg|png|jpg)|(?:js|css)\/[\w.-]+)$/.test(path)) {
    response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'X-Robots-Tag': 'noindex, follow' });
    response.end(await readFile(join(root, '404.html')));
    return;
  }
  try {
    const content = await readFile(join(root, path));
    if (path === '/dashboard.html') response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    response.writeHead(200, { 'Content-Type': types[extname(path)], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    response.end(content);
  } catch {
    response.writeHead(404);
    response.end();
  }
}).listen(port, '127.0.0.1', () => console.log(`HALLET: http://127.0.0.1:${port}`));
