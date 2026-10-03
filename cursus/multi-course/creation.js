import { contextFor, assertWritePaths, REGISTRY_PATH } from './context.js';

const encoder = new TextEncoder();
const from64 = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
const to64 = bytes => {
  let text = '';
  for (let i = 0; i < bytes.length; i += 32768) text += String.fromCharCode(...bytes.subarray(i, i + 32768));
  return btoa(text);
};
const json = value => JSON.stringify(value, null, 2) + '\n';
const escape = value => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
export const freshSecurity = () => ({ version: 1, salt: to64(crypto.getRandomValues(new Uint8Array(24))), iterations: 600000 });

export async function derive(password, config, prefix = '', bits = false) {
  const material = await crypto.subtle.importKey('raw', encoder.encode(prefix + password), 'PBKDF2', false, [bits ? 'deriveBits' : 'deriveKey']);
  const params = { name: 'PBKDF2', hash: 'SHA-256', salt: from64(config.salt), iterations: config.iterations };
  return bits ? to64(new Uint8Array(await crypto.subtle.deriveBits(params, material, 256))) :
    crypto.subtle.deriveKey(params, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encrypt(value, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const bytes = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(value)));
  return { version: 1, algorithm: 'AES-GCM', iv: to64(iv), data: to64(new Uint8Array(bytes)) };
}
export async function matchesStudentPassword(password, config, envelope) {
  if (!config || !envelope) return false;
  try {
    await crypto.subtle.decrypt({ name: 'AES-GCM', iv: from64(envelope.iv) }, await derive(password, config), from64(envelope.data));
    return true;
  } catch { return false; }
}

export function studentHtml(id, name) {
  const { base } = contextFor(id);
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'self';script-src 'self';style-src 'self';img-src 'self' https: data: blob:;connect-src 'self';frame-src https://www.youtube-nocookie.com;object-src 'none';base-uri 'self';form-action 'self'"><title>${escape(name)} | Cursuslogin</title><link rel="stylesheet" href="/cursus/assets/BaseLayout.h51rZr0m.css"></head><body><header class="site-header compact"><div class="brand"><span>Machiel van Soest</span><small>${escape(name)}</small></div></header><main class="auth-shell" data-student-index><section class="auth-card"><p class="eyebrow">Alleen voor cursisten</p><h1>${escape(name)}</h1><div id="login-panel"><p>Vul het wachtwoord van deze cursus in.</p><form id="student-login-form"><div class="field"><label for="season-password">Cursuswachtwoord</label><input id="season-password" name="password" type="password" minlength="12" autocomplete="current-password" required></div><button class="button">Naar de lessen</button><p class="form-message" id="login-message" role="status"></p></form></div><div id="lesson-panel" class="hidden"><p>Kies een les:</p><button class="button secondary" id="student-logout" type="button">Uitloggen</button><div id="lesson-list" class="lesson-list"></div></div></section></main><script type="module" src="${base}/runtime/student.js"></script></body></html>`;
}
export function adminHtml(name) {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta http-equiv="Content-Security-Policy" content="default-src 'self';script-src 'self' 'unsafe-inline';style-src 'self' 'unsafe-inline';img-src 'self' data: blob: https:;connect-src 'self' https://api.github.com https://raw.githubusercontent.com;frame-src https://www.youtube-nocookie.com;object-src 'none';base-uri 'self';form-action 'self' https://github.com"><title>Lesbeheer · ${escape(name)}</title><link rel="stylesheet" href="/cursus/assets/BaseLayout.h51rZr0m.css"><link rel="stylesheet" href="/cursus/assets/index.HQVK_hTe.css"><link rel="stylesheet" href="/cursus/runtime/youtube-embed.css"><link rel="stylesheet" href="/cursus/multi-course/selector.css"></head><body class="admin-body"><div class="course-switch"><a href="/cursus/beheer/">← Andere cursus kiezen</a><a href="/cursus/beheer/?nieuw=1">+ Nieuwe cursus</a></div><div id="admin-gate" ssr></div><script type="module" src="/cursus/multi-course/admin-entry.js"></script></body></html>`;
}
export function scaffold(id, name) {
  const { repoBase } = contextFor(id);
  const file = (path, content) => ({ path: `${repoBase}/${path}`, content });
  return [file('index.html', studentHtml(id, name)), file('beheer/index.html', adminHtml(name)),
    file('course.json', json({ version: 1, id, name })), file('content/pages/index.json', '[]\n'),
    file('runtime/student.js', "import '/cursus/multi-course/student.js';\n"),
    file('runtime/public-nav.js', "import '/cursus/multi-course/public-nav.js';\n"),
    file('runtime/published.css', '@import url("/cursus/runtime/published.css");\n'),
    file('runtime/youtube-embed.css', '@import url("/cursus/runtime/youtube-embed.css");\n')];
}

export async function github(settings, path, options = {}) {
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}${path}`, {
    ...options, cache: 'no-store', headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${settings.token}`, 'X-GitHub-Api-Version': '2022-11-28', ...options.headers }
  });
  if (response.status === 404 && !options.method) return null;
  if (!response.ok) {
    const error = new Error(`GitHub gaf foutcode ${response.status}. Controleer de repository, branch en schrijfrechten.`);
    error.status = response.status; throw error;
  }
  return response.json();
}
export async function readRepo(settings, path) {
  const result = await github(settings, `/contents/${path}?ref=${encodeURIComponent(settings.branch)}`);
  if (!result) return null;
  if (result.encoding !== 'base64') throw new Error(`Onverwacht bestandsformaat: ${path}`);
  return JSON.parse(new TextDecoder().decode(from64(result.content.replace(/\s/g, ''))));
}

export async function prepareCourse(settings, input) {
  const context = contextFor(input.id);
  const name = input.name.trim();
  if (!name || name.length > 120) throw new Error('Vul een cursusnaam van maximaal 120 tekens in.');
  for (const password of [input.adminPassword, input.studentPassword]) {
    if (typeof password !== 'string' || password.length < 12) throw new Error('Gebruik wachtwoorden van minimaal 12 tekens.');
  }
  if (input.adminPassword !== input.adminRepeat || input.studentPassword !== input.studentRepeat) throw new Error('De herhaalde wachtwoorden komen niet overeen.');
  if (input.adminPassword === input.studentPassword) throw new Error('Gebruik verschillende wachtwoorden voor beheer en cursisten.');
  const legacyAuth = await readRepo(settings, 'cursus/content/admin-auth.json');
  if (!legacyAuth || await derive(input.ownerPassword, legacyAuth, 'machiel-beheer:', true) !== legacyAuth.verifier) {
    throw new Error('Het bestaande atelier-beheerwachtwoord is niet juist.');
  }
  const registry = await readRepo(settings, REGISTRY_PATH);
  if (!registry || registry.version !== 1 || !Array.isArray(registry.courses)) throw new Error('De cursuskeuze is nog niet beschikbaar op deze GitHub-branch.');
  const existing = registry.courses.find(course => course.id === input.id);
  if (existing?.configured || await readRepo(settings, `${context.repoBase}/content/admin-auth.json`)) throw new Error('Deze cursus bestaat al. Kies een ander cursusadres.');
  if (!existing && await github(settings, `/contents/${context.repoBase}?ref=${encodeURIComponent(settings.branch)}`)) throw new Error('Dit cursusadres is al in gebruik.');
  // Reject reuse of an existing course password, including the active atelier season.
  const bases = ['cursus', ...registry.courses.filter(course => course.configured).map(course => contextFor(course.id).repoBase)];
  for (const base of bases) {
    const [auth, security, manifest] = await Promise.all([
      readRepo(settings, `${base}/content/admin-auth.json`), readRepo(settings, `${base}/content/security.json`), readRepo(settings, `${base}/content/protected/index.enc.json`)
    ]);
    if (auth && await derive(input.adminPassword, auth, 'machiel-beheer:', true) === auth.verifier) throw new Error('Dit beheerwachtwoord wordt al voor een andere cursus gebruikt.');
    if (await matchesStudentPassword(input.studentPassword, security, manifest)) throw new Error('Dit cursistenwachtwoord wordt al voor een andere cursus gebruikt.');
  }
  const auth = { ...freshSecurity(), createdAt: new Date().toISOString() };
  auth.verifier = await derive(input.adminPassword, auth, 'machiel-beheer:', true);
  const security = freshSecurity();
  const now = new Date().toISOString();
  const files = [...scaffold(input.id, name),
    { path: `${context.repoBase}/content/admin-auth.json`, content: json(auth) },
    { path: `${context.repoBase}/content/security.json`, content: json(security) },
    { path: `${context.repoBase}/content/admin-drafts.enc.json`, content: json(await encrypt({ version: 1, updatedAt: now, pages: [] }, await derive(input.adminPassword, auth, 'machiel-beheer-inhoud:'))) },
    { path: `${context.repoBase}/content/protected/index.enc.json`, content: json(await encrypt([], await derive(input.studentPassword, security))) },
    { path: REGISTRY_PATH, content: json({ version: 1, courses: [...registry.courses.filter(course => course.id !== input.id), { id: input.id, name, configured: true }] }) }];
  assertWritePaths(files, context, true);
  return { files, context };
}

export async function createCourse(settings, input) {
  const operation = async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      // Capture the parent before preparing: a concurrent creation must cause a retry.
      const ref = `/git/ref/heads/${encodeURIComponent(settings.branch)}`;
      const parent = await github(settings, ref);
      if (!parent) throw new Error('De opgegeven GitHub-branch bestaat niet.');
      const { files, context } = await prepareCourse(settings, input);
      assertWritePaths(files, context, true);
      const commit = await github(settings, `/git/commits/${parent.object.sha}`);
      const tree = await github(settings, '/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: commit.tree.sha, tree: files.map(file => ({ path: file.path, mode: '100644', type: 'blob', content: file.content })) }) });
      const next = await github(settings, '/git/commits', { method: 'POST', body: JSON.stringify({ message: `Nieuwe cursus: ${input.name.trim()}`, tree: tree.sha, parents: [parent.object.sha] }) });
      try {
        await github(settings, `/git/refs/heads/${encodeURIComponent(settings.branch)}`, { method: 'PATCH', body: JSON.stringify({ sha: next.sha, force: false }) });
        return { sha: next.sha, context };
      } catch (error) {
        const current = await github(settings, ref);
        if (current?.object.sha === next.sha) return { sha: next.sha, context };
        if (![409, 422].includes(error.status) || attempt === 2) throw error;
      }
    }
  };
  const lock = `machiel-cursus-github-write:${settings.owner}/${settings.repo}/${settings.branch}`;
  return globalThis.navigator?.locks?.request ? navigator.locks.request(lock, { mode: 'exclusive' }, operation) : operation();
}
