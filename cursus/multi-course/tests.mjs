import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { contextFor, assertWritePaths, lessonSlug } from './context.js';
import { prepareCourse, createCourse, derive, encrypt, freshSecurity, scaffold } from './creation.js';
import { installAtelierBoundary } from './atelier-boundary.js';

const filesToClean = [];
process.on('exit', () => { for (const path of filesToClean) try { unlinkSync(path); } catch {} });
const storage = () => { const map = new Map(); return { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) }; };
globalThis.localStorage = storage(); globalThis.sessionStorage = storage();
globalThis.location = { pathname: '/cursus/cursussen/online/beheer/', origin: 'http://localhost:8123', protocol: 'http:', hostname: 'localhost' };
globalThis.document = { querySelector: () => null };

// Minimal asynchronous IndexedDB adapter for actual student key persistence.
const databases = new Map();
globalThis.indexedDB = { open(name) {
  const request = {};
  setTimeout(() => {
    const first = !databases.has(name); if (first) databases.set(name, new Map());
    const stores = databases.get(name);
    request.result = { createObjectStore(store) { stores.set(store, new Map()); }, close() {}, transaction(store) {
      const tx = { objectStore() { return {
        put(value, key) { stores.get(store).set(key, value); setTimeout(() => tx.oncomplete?.(), 0); },
        delete(key) { stores.get(store).delete(key); setTimeout(() => tx.oncomplete?.(), 0); },
        get(key) { const r = {}; setTimeout(() => { r.result = stores.get(store).get(key); r.onsuccess?.(); }, 0); return r; }
      }; } }; return tx;
    } };
    if (first) request.onupgradeneeded?.(); request.onsuccess?.();
  }, 0); return request;
} };

async function adminFor(id) {
  globalThis.location.pathname = `/cursus/cursussen/${id}/beheer/`;
  const path = new URL(`.test-admin-${id}.mjs`, import.meta.url); filesToClean.push(path);
  const source = readFileSync(new URL('admin.js', import.meta.url), 'utf8') + '\nexport {Th as login,$x as publish,jx as order,dp as offline,Vx as changePassword,Hx as reset,Tx as restore,yx as newPage,bx as editorDb,trustedDeviceDb,pc as authStorage,ld as repoPrefix,Y as repoPath,Ix as parseSlug};';
  writeFileSync(path, source);
  const savedDocument = globalThis.document, savedWindow = globalThis.window; delete globalThis.document; delete globalThis.window;
  try { return await import(path.href); } finally { globalThis.document = savedDocument; globalThis.window = savedWindow; }
}
async function studentFor(id) {
  globalThis.window = {};
  globalThis.location.pathname = `/cursus/cursussen/${id}/`;
  const path = new URL(`.test-student-${id}.mjs`, import.meta.url); filesToClean.push(path);
  const source = readFileSync(new URL('student.js', import.meta.url), 'utf8').replace("'/cursus/multi-course/context.js'", "'./context.js'") + '\nexport {deriveKey,decryptJson,loadManifest,storeKey,readKey,clearKey,DB_NAME};';
  writeFileSync(path, source); return import(path.href);
}
async function originalAtelier() {
  const path = new URL('.test-original-atelier.mjs', import.meta.url); filesToClean.push(path);
  const source = readFileSync(new URL('../assets/AdminGate.j8ckIzFX.js', import.meta.url), 'utf8').replace('from"./index.CCgrM4u1.js"', 'from"../assets/index.CCgrM4u1.js"') + '\nexport {Tx as restore};';
  writeFileSync(path, source);
  const savedDocument = globalThis.document, savedWindow = globalThis.window; delete globalThis.document; delete globalThis.window;
  try { return await import(path.href); } finally { globalThis.document = savedDocument; globalThis.window = savedWindow; }
}

const settings = { owner: 'test-owner', repo: 'test-repo', branch: 'main', token: 'test-token' };
const passwords = { atelier: ['atelier-admin-test', 'atelier-student-test'], online: ['online-admin-test', 'online-student-test'], extra: ['extra-admin-test', 'extra-student-test'] };
async function seedCourse(repo, base, [adminPassword, studentPassword]) {
  const auth = { ...freshSecurity(), createdAt: new Date().toISOString() };
  auth.verifier = await derive(adminPassword, auth, 'machiel-beheer:', true);
  const security = freshSecurity();
  const pairs = {
    'content/admin-auth.json': auth, 'content/security.json': security,
    'content/protected/index.enc.json': await encrypt([], await derive(studentPassword, security)),
    'content/admin-drafts.enc.json': await encrypt({ version: 1, updatedAt: new Date().toISOString(), pages: [] }, await derive(adminPassword, auth, 'machiel-beheer-inhoud:')),
    'content/pages/index.json': []
  };
  for (const [path, data] of Object.entries(pairs)) repo.files.set(`${base}/${path}`, JSON.stringify(data));
}
function mockRepo() {
  const repo = { files: new Map(), snapshots: new Map(), commits: new Map(), blobs: new Map(), writes: [], next: 1, head: '', onPatch: null };
  const sha = () => (repo.next++).toString(16).padStart(40, '0');
  repo.snapshot = () => {
    const tree = sha(), commit = sha(); repo.snapshots.set(tree, new Map(repo.files)); repo.commits.set(commit, { tree: { sha: tree } }); repo.head = commit; return commit;
  };
  repo.fetch = async (input, options = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url, location.origin);
    const result = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
    if (url.origin === location.origin) {
      const content = repo.files.get(url.pathname.slice(1)); return content === undefined ? result({}, 404) : new Response(content);
    }
    assert.equal(url.origin, 'https://api.github.com', 'No real network');
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    const path = decodeURIComponent(url.pathname.replace('/repos/test-owner/test-repo', ''));
    const body = options.body ? JSON.parse(options.body) : null;
    if (path.startsWith('/contents/')) {
      const key = path.slice('/contents/'.length), content = repo.files.get(key);
      if (content !== undefined) return result({ encoding: 'base64', content: Buffer.from(content).toString('base64') });
      const children = [...repo.files.keys()].filter(file => file.startsWith(key + '/') && !file.slice(key.length + 1).includes('/')).map(file => ({ path: file, name: file.slice(key.length + 1), type: 'file' }));
      return children.length || [...repo.files.keys()].some(file => file.startsWith(key + '/')) ? result(children) : result({}, 404);
    }
    if (path.startsWith('/git/ref/heads/')) return result({ object: { sha: repo.head } });
    if (path === '/git/blobs') { const id = sha(); repo.blobs.set(id, Buffer.from(body.content, 'base64').toString()); return result({ sha: id }); }
    if (path === '/git/trees' && options.method === 'POST') {
      const files = new Map(repo.snapshots.get(body.base_tree));
      repo.writes.push(body.tree.map(file => file.path));
      for (const file of body.tree) {
        if (file.sha === null) files.delete(file.path);
        else files.set(file.path, file.content ?? repo.blobs.get(file.sha));
      }
      const id = sha(); repo.snapshots.set(id, files); return result({ sha: id });
    }
    if (path.startsWith('/git/trees/')) {
      const files = repo.snapshots.get(path.slice('/git/trees/'.length));
      const tree = [...files].map(([path, content]) => { const id = sha(); repo.blobs.set(id, content); return { path, mode: '100644', type: 'blob', sha: id }; });
      return result({ tree });
    }
    if (path === '/git/commits' && options.method === 'POST') { const id = sha(); repo.commits.set(id, { tree: { sha: body.tree }, parents: body.parents }); return result({ sha: id }); }
    if (path.startsWith('/git/commits/')) return result(repo.commits.get(path.slice('/git/commits/'.length)));
    if (path.startsWith('/git/refs/heads/') && options.method === 'PATCH') {
      if (repo.onPatch) { const callback = repo.onPatch; repo.onPatch = null; callback(); return result({}, 409); }
      const commit = repo.commits.get(body.sha);
      if (commit.parents[0] !== repo.head) return result({}, 409);
      repo.head = body.sha; repo.files = new Map(repo.snapshots.get(commit.tree.sha)); return result({ object: { sha: repo.head } });
    }
    throw new Error(`Unexpected mock request: ${options.method || 'GET'} ${path}`);
  };
  return repo;
}

test('Separate courses: real editor and student runtimes preserve atelier data', async () => {
  const repo = mockRepo();
  await seedCourse(repo, 'cursus', passwords.atelier);
  await seedCourse(repo, 'cursus/cursussen/online', passwords.online);
  await seedCourse(repo, 'cursus/cursussen/extra', passwords.extra);
  repo.files.set('cursus/index.html', 'ATELIER LOGIN SENTINEL');
  repo.files.set('cursus/media/existing/image.webp', 'ATELIER MEDIA SENTINEL');
  repo.files.set('cursus/content/courses.json', JSON.stringify({ version: 1, courses: [{ id: 'online', name: 'Online', configured: true }, { id: 'extra', name: 'Extra', configured: true }] }));
  const before = new Map([...repo.files].filter(([path]) => !path.startsWith('cursus/cursussen/')));
  repo.snapshot(); globalThis.fetch = repo.fetch;
  const online = await adminFor('online'), extra = await adminFor('extra');
  assert.notEqual(online.editorDb, extra.editorDb); assert.notEqual(online.authStorage, extra.authStorage); assert.notEqual(online.trustedDeviceDb, extra.trustedDeviceDb);
  await assert.rejects(online.login(passwords.atelier[0], false), /niet juist/);
  await assert.rejects(online.login(passwords.extra[0], false), /niet juist/);
  await online.login(passwords.online[0], false); await extra.login(passwords.extra[0], false);
  const page = { ...online.newPage(), title: 'Online les', slug: 'eerste-les', sortOrder: 0 };
  await assert.rejects(online.publish({ ...page, slug: 'index' }, settings, passwords.online[1]), /gereserveerd/);
  const published = await online.publish(page, settings, passwords.online[1]);
  assert.equal(published.page.status, 'published');
  assert.match(repo.files.get('cursus/cursussen/online/eerste-les/index.html'), /\/cursus\/cursussen\/online\/runtime\/student.js/);
  assert.equal(repo.files.has('cursus/eerste-les/index.html'), false);
  const student = await studentFor('online'), otherStudent = await studentFor('extra');
  const config = JSON.parse(repo.files.get('cursus/cursussen/online/content/security.json'));
  const key = await student.deriveKey(passwords.online[1], config);
  assert.equal((await student.loadManifest(key))[0].title, 'Online les');
  const wrongKey = await student.deriveKey(passwords.atelier[1], config);
  await assert.rejects(student.loadManifest(wrongKey), /niet juist/);
  await assert.rejects(otherStudent.loadManifest(key), /niet juist/);
  await student.storeKey(key); assert.equal(await otherStudent.readKey(), undefined);
  await otherStudent.storeKey(await otherStudent.deriveKey(passwords.extra[1], JSON.parse(repo.files.get('cursus/cursussen/extra/content/security.json'))));
  await otherStudent.clearKey(); assert.equal(await student.readKey(), key);
  assert.equal(databases.has('machiel-les-toegang'), false);
  const protectedVersion = repo.head;
  await online.order([{ ...published.page, sortOrder: 9 }], settings, passwords.online[1]);
  assert.equal((await student.loadManifest(key))[0].sortOrder, 9);
  await online.offline(published.page, settings, passwords.online[1]);
  assert.equal((await student.loadManifest(key)).length, 0);
  assert.equal(repo.files.has('cursus/cursussen/online/eerste-les/index.html'), false);
  await online.restore(settings, protectedVersion);
  assert.equal((await student.loadManifest(key)).length, 1);
  await online.changePassword(settings, passwords.online[1], 'online-student-new-password');
  await assert.rejects(student.loadManifest(key), /niet juist/);
  const changedConfig = JSON.parse(repo.files.get('cursus/cursussen/online/content/security.json'));
  assert.equal((await student.loadManifest(await student.deriveKey('online-student-new-password', changedConfig))).length, 1);
  await online.reset(settings, 'online-student-reset-password');
  assert.equal(repo.files.has('cursus/cursussen/online/content/protected/eerste-les.enc.json'), false);
  const emptyKey = await student.deriveKey('online-student-reset-password', JSON.parse(repo.files.get('cursus/cursussen/online/content/security.json')));
  assert.deepEqual(await student.loadManifest(emptyKey), []);
  await online.publish({ ...page, access: 'public', slug: 'openbare-les', sections: [{ id: 'section', columns: [{ id: 'column', width: 1, blocks: [{ id: 'heading', type: 'heading', level: 'h2', text: 'Openbare informatie' }] }] }] }, settings);
  assert.match(repo.files.get('cursus/cursussen/online/openbare-les/index.html'), /\/cursus\/cursussen\/online\/runtime\/public-nav.js/);
  for (const [path, content] of before) assert.equal(repo.files.get(path), content, `Atelier/registry unchanged: ${path}`);
  assert.ok(repo.writes.flat().every(path => path.startsWith('cursus/cursussen/online/')));
  repo.files.delete('cursus/cursussen/online/content/protected/index.enc.json');
  await assert.rejects(student.loadManifest(emptyKey), /nog niet geopend/);
});

test('Course creation requires owner authentication and keeps registry during concurrent writes', async () => {
  const repo = mockRepo(); await seedCourse(repo, 'cursus', passwords.atelier);
  repo.files.set('cursus/index.html', 'UNCHANGED ATELIER');
  repo.files.set('cursus/content/courses.json', JSON.stringify({ version: 1, courses: [{ id: 'online', name: 'Online cursus', configured: false }] }));
  for (const file of scaffold('online', 'Online cursus')) repo.files.set(file.path, file.content);
  const before = new Map([...repo.files].filter(([path]) => path !== 'cursus/content/courses.json' && !path.startsWith('cursus/cursussen/')));
  repo.snapshot(); globalThis.fetch = repo.fetch;
  const input = { id: 'online', name: 'Online cursus', adminPassword: passwords.online[0], adminRepeat: passwords.online[0], studentPassword: passwords.online[1], studentRepeat: passwords.online[1], ownerPassword: passwords.atelier[0] };
  await assert.rejects(prepareCourse(settings, { ...input, ownerPassword: 'incorrect-password' }), /beheerwachtwoord is niet juist/);
  await assert.rejects(prepareCourse(settings, { ...input, adminPassword: passwords.atelier[0], adminRepeat: passwords.atelier[0] }), /al voor een andere cursus/);
  await assert.rejects(prepareCourse(settings, { ...input, studentPassword: passwords.atelier[1], studentRepeat: passwords.atelier[1] }), /al voor een andere cursus/);
  await assert.rejects(prepareCourse(settings, { ...input, studentRepeat: 'does-not-match-test' }), /komen niet overeen/);
  repo.onPatch = () => {
    repo.files.set('cursus/content/courses.json', JSON.stringify({ version: 1, courses: [{ id: 'online', name: 'Online cursus', configured: false }, { id: 'parallel', name: 'Gelijktijdige cursus', configured: false }] }));
    repo.snapshot();
  };
  await createCourse(settings, input);
  const registry = JSON.parse(repo.files.get('cursus/content/courses.json'));
  assert.ok(registry.courses.find(course => course.id === 'parallel'));
  assert.equal(registry.courses.find(course => course.id === 'online').configured, true);
  await assert.rejects(prepareCourse(settings, input), /bestaat al/);
  const files = [...repo.files].filter(([path]) => path.startsWith('cursus/cursussen/online/'));
  for (const [, content] of files) for (const password of Object.values(input).filter(value => value.includes('test'))) assert.equal(content.includes(password), false, 'No plaintext passwords');
  const admin = await adminFor('created'); // A third namespace cannot read the newly created online auth.
  await assert.rejects(admin.login(passwords.online[0], false), /niet juist/);
  const auth = JSON.parse(repo.files.get('cursus/cursussen/online/content/admin-auth.json'));
  assert.equal(await derive(passwords.online[0], auth, 'machiel-beheer:', true), auth.verifier);
  for (const [path, content] of before) assert.equal(repo.files.get(path), content);
  assert.ok(repo.writes.flat().every(path => path.startsWith('cursus/cursussen/online/') || path === 'cursus/content/courses.json'));
  // A wholly new course uses the same isolated creation flow.
  const next = { ...input, id: 'later', name: 'Latere cursus', adminPassword: 'later-admin-password', adminRepeat: 'later-admin-password', studentPassword: 'later-student-password', studentRepeat: 'later-student-password' };
  await createCourse(settings, next);
  assert.ok(repo.files.has('cursus/cursussen/later/beheer/index.html'));
});

test('Boundary blocks path traversal, sibling writes and reserved lesson addresses', () => {
  const context = contextFor('online');
  for (const path of ['cursus/index.html', 'cursus/content/security.json', 'cursus/cursussen/extra/index.html', 'cursus/cursussen/online/../extra/index.html', 'cursus/cursussen/online/%2e%2e/file', 'cursus/cursussen/online//file']) assert.throws(() => assertWritePaths([{ path }], context));
  assert.throws(() => contextFor('atelier')); assert.throws(() => contextFor('../atelier'));
  assert.equal(lessonSlug('/cursus/cursussen/online/les-een/', context), 'les-een');
  assert.equal(lessonSlug('les-een', context), 'les-een');
  assert.throws(() => lessonSlug('/cursus/les-een/', context));
  assert.throws(() => lessonSlug('/cursus/cursussen/extra/les-een/', context));
  assert.throws(() => lessonSlug('beheer', context));
});

test('Atelier restore preserves new subsystem while retaining original lesson entries', async () => {
  const repo = mockRepo();
  for (const path of ['cursus/index.html', 'cursus/content/security.json', 'cursus/media/old.webp', 'cursus/beheer/index.html', 'cursus/cursussen/online/index.html', 'cursus/multi-course/admin.js', 'cursus/content/courses.json']) repo.files.set(path, `DATA ${path}`);
  const old = repo.snapshot();
  repo.files.set('cursus/index.html', 'NEW ATELIER CONTENT');
  repo.files.set('cursus/cursussen/online/index.html', 'NEW ONLINE CONTENT');
  repo.files.set('cursus/cursussen/online/content/protected/new.enc.json', 'NEW ONLINE ENVELOPE');
  repo.files.set('cursus/multi-course/admin.js', 'NEW SHARED RUNTIME');
  repo.files.set('cursus/content/courses.json', 'NEW REGISTRY');
  repo.files.set('cursus/beheer/index.html', 'NEW COURSE SELECTOR');
  repo.snapshot(); const newer = new Map(repo.files);
  globalThis.fetch = repo.fetch; installAtelierBoundary();
  const treeSha = repo.commits.get(old).tree.sha;
  const response = await fetch(`https://api.github.com/repos/test-owner/test-repo/git/trees/${treeSha}?recursive=1`, { headers: { Authorization: 'Bearer test-token' } });
  const tree = await response.json();
  assert.deepEqual(tree.tree.map(file => file.path).sort(), ['cursus/content/security.json', 'cursus/index.html', 'cursus/media/old.webp']);
  await assert.rejects(fetch('https://api.github.com/repos/test-owner/test-repo/git/trees', { method: 'POST', headers: { Authorization: 'Bearer test-token' }, body: JSON.stringify({ tree: [{ path: 'cursus/cursussen/online/index.html', content: 'bad' }] }) }), /andere cursus/);
  assert.deepEqual(repo.files, newer);
  const original = await originalAtelier(); await original.restore(settings, old);
  assert.equal(repo.files.get('cursus/index.html'), 'DATA cursus/index.html');
  for (const [path, content] of newer) {
    if (path.startsWith('cursus/cursussen/') || path.startsWith('cursus/multi-course/') || ['cursus/content/courses.json', 'cursus/beheer/index.html'].includes(path)) assert.equal(repo.files.get(path), content, `New subsystem survives atelier restore: ${path}`);
  }
  globalThis.fetch = repo.fetch;
});

test('Existing tracked atelier files have no changes outside the requested beheer entry', () => {
  const root = new URL('../', import.meta.url);
  const changed = execFileSync('git', ['-c', 'safe.directory=C:/Users/machi/Documents/GitHub/name', 'diff', '--name-only', '--', '.'], { cwd: root }).toString().trim().split(/\r?\n/).filter(Boolean);
  assert.deepEqual(changed, ['cursus/beheer/index.html']);
  for (const path of ['index.html', 'runtime/student.js', 'assets/AdminGate.j8ckIzFX.js', 'content/security.json', 'content/admin-auth.json']) assert.ok(readFileSync(new URL(path, root)).length > 0);
});
