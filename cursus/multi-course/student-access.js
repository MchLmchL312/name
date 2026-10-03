import { contextFor } from './context.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const from64 = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));
const atelier = Object.freeze({ id: 'atelier', name: 'Ateliercursus', base: '/cursus', legacy: true });

async function fetchJson(path) {
  const response = await fetch(path, { cache: 'no-store' });
  if (!response.ok) throw new Error('De cursus kan op dit moment niet worden geladen. Probeer het later opnieuw.');
  return response.json();
}

async function matchPassword(password, course, readJson) {
  const [security, envelope] = await Promise.all([
    readJson(`${course.base}/content/security.json`),
    readJson(`${course.base}/content/protected/index.enc.json`)
  ]);
  if (security?.version !== 1 || !Number.isSafeInteger(security.iterations) || security.iterations < 1 ||
      security.iterations > 2000000 || typeof security.salt !== 'string' || envelope?.version !== 1 || envelope.algorithm !== 'AES-GCM') {
    throw new Error('De cursus kan op dit moment niet worden geladen. Probeer het later opnieuw.');
  }
  const material = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: from64(security.salt), iterations: security.iterations },
    material, { name: 'AES-GCM', length: 256 }, false, ['decrypt']
  );
  let plaintext;
  try {
    plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: from64(envelope.iv) }, key, from64(envelope.data));
  } catch (error) {
    if (error.name === 'OperationError') return null;
    throw error;
  }
  if (!Array.isArray(JSON.parse(decoder.decode(plaintext)))) throw new Error('De cursuslijst kan niet worden geladen.');
  return { course, key };
}

export async function findStudentCourses(password, readJson = fetchJson) {
  if (typeof password !== 'string' || password.length < 12) throw new Error('Gebruik het volledige cursuswachtwoord.');
  let registryUnavailable = false;
  let courses = [atelier];
  try {
    const registry = await readJson('/cursus/content/courses.json');
    if (registry?.version !== 1 || !Array.isArray(registry.courses)) throw new Error('Ongeldige cursuslijst.');
    const ids = new Set();
    const extra = registry.courses.filter(course => course.configured).map(course => {
      const context = contextFor(course.id);
      if (ids.has(context.id)) throw new Error('Dubbele cursus in de cursuslijst.');
      ids.add(context.id);
      return { id: context.id, name: course.name || context.id, base: context.base, legacy: false };
    });
    courses = [...courses, ...extra];
  } catch { registryUnavailable = true; }
  const results = await Promise.allSettled(courses.map(course => matchPassword(password, course, readJson)));
  return {
    matches: results.filter(result => result.status === 'fulfilled' && result.value).map(result => result.value),
    incomplete: registryUnavailable || results.some(result => result.status === 'rejected')
  };
}

export async function rememberStudentAccess(match) {
  // Atelier login remains entirely with the original runtime and its own storage.
  if (match.course.legacy) throw new Error('Ateliertoegang wordt door de bestaande login geopend.');
  const context = contextFor(match.course.id);
  if (match.course.base !== context.base) throw new Error('Het cursusadres komt niet overeen.');
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(context.storage + ':student', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('sleutels');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Sluit andere cursusvensters en probeer opnieuw.'));
  });
  try {
    await new Promise((resolve, reject) => {
      const transaction = db.transaction('sleutels', 'readwrite');
      transaction.objectStore('sleutels').put(match.key, 'seizoen');
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally { db.close(); }
  return `${context.base}/`;
}
