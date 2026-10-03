// Disposable local editor fixture. No real credentials, repository writes or lesson files.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scaffold, freshSecurity, derive, encrypt } from './creation.js';
const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const base = 'cursus/cursussen/editor-test';
const files = new Map(scaffold('editor-test', 'Editorcontrole').map(file => [file.path, file.content]));
const auth = { ...freshSecurity(), createdAt: new Date().toISOString() };
auth.verifier = await derive('editor-test-admin', auth, 'machiel-beheer:', true);
files.set(`${base}/content/admin-auth.json`, JSON.stringify(auth));
files.set(`${base}/content/admin-drafts.enc.json`, JSON.stringify(await encrypt({ version: 1, pages: [], updatedAt: new Date().toISOString() }, await derive('editor-test-admin', auth, 'machiel-beheer-inhoud:'))));
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.css': 'text/css; charset=utf-8' };
createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://127.0.0.1:8124');
    if (!url.pathname.startsWith('/cursus/')) throw new Error('Outside fixture');
    let fixture = url.pathname.slice(1); if (fixture.endsWith('/')) fixture += 'index.html';
    let content = files.get(fixture);
    let extension = extname(fixture);
    if (content === undefined) {
      const path = resolve(root, decodeURIComponent(url.pathname.slice('/cursus/'.length)));
      if (!(path === root || path.startsWith(root + sep)) || path.slice(root.length).split(sep).some(part => part.startsWith('.'))) throw new Error('Outside fixture');
      const finalPath = (await stat(path)).isDirectory() ? resolve(path, 'index.html') : path;
      content = await readFile(finalPath); extension = extname(finalPath);
    }
    response.writeHead(200, { 'Content-Type': mime[extension] || 'application/octet-stream', 'Cache-Control': 'no-store' }); response.end(content);
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(8124, '127.0.0.1', () => console.log('Disposable editor fixture: http://127.0.0.1:8124/cursus/cursussen/editor-test/beheer/'));
