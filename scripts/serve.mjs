// Local preview: builds the site, serves dist/ with clean URLs (/parfums → parfums.html)
// and rebuilds when src/ or data/ change. Bound to 127.0.0.1 only.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { watch } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2' };

await build();
let timer;
for (const dir of ['src', 'data']) {
  watch(resolve(root, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().then(() => console.log('Reconstruit.')).catch((e) => console.error(e.message)), 120);
  });
}

const port = Number(process.env.PORT || 4321);
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(dist, '.' + path);
    if (file !== dist && !file.startsWith(dist + sep)) { res.writeHead(403); res.end(); return; }
    const candidates = [file, `${file}.html`, resolve(file, 'index.html')];
    for (const candidate of candidates) {
      try {
        if ((await stat(candidate)).isFile()) {
          // Read before writing headers, so a file removed mid-rebuild can't leave a half-sent response.
          const body = await readFile(candidate);
          res.writeHead(200, { 'Content-Type': types[extname(candidate)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
          res.end(body);
          return;
        }
      } catch {}
    }
    const notFound = await readFile(resolve(dist, '404.html')).catch(() => 'Page introuvable');
    res.writeHead(404, { 'Content-Type': types['.html'] });
    res.end(notFound);
  } catch {
    if (!res.headersSent) res.writeHead(500);
    res.end();
  }
}).listen(port, '127.0.0.1', () => console.log(`LAKON : http://127.0.0.1:${port}`));
