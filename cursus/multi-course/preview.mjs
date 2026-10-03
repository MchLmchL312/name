import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css; charset=utf-8', '.webp': 'image/webp' };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1:8123');
    if (!url.pathname.startsWith('/cursus/')) throw new Error('Outside preview');
    let path = resolve(root, decodeURIComponent(url.pathname.slice('/cursus/'.length)));
    if (!(path === root || path.startsWith(root + sep)) || path.slice(root.length).split(sep).some(part => part.startsWith('.'))) throw new Error('Outside preview');
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    response.writeHead(200, { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(await readFile(path));
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(8123, '127.0.0.1', () => console.log('Course preview: http://127.0.0.1:8123/cursus/beheer/'));
