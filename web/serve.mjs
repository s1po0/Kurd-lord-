// Dependency-free static server for the Sword Spirit web preview.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5173);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    return res.end();
  }
  try {
    const path = decodeURIComponent((req.url || '/').split('?')[0]);
    const relative = path === '/' ? 'index.html' : path.startsWith('/web/') ? path.slice(5) : null;
    if (relative === null) throw new Error('Not found');
    const filePath = resolve(ROOT, relative);
    if (!filePath.startsWith(ROOT + sep)) throw new Error('Not found');
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`Sword Spirit preview listening on port ${PORT}`);
});
