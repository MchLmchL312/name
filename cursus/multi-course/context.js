export const COURSE_ROOT = '/cursus/cursussen';
export const REGISTRY_PATH = 'cursus/content/courses.json';
const reserved = new Set(['atelier', 'offline', 'beheer', 'content', 'runtime', 'media', 'assets', 'index']);

export function validateId(id) {
  if (typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 64 || reserved.has(id)) {
    throw new Error('Kies een cursusadres met kleine letters, cijfers en streepjes. Dit adres is gereserveerd of ongeldig.');
  }
  return id;
}

export function contextFor(id) {
  validateId(id);
  const base = `${COURSE_ROOT}/${id}`;
  return Object.freeze({ id, base, repoBase: base.slice(1), storage: `machiel-cursus-v2:${id}` });
}

export function currentContext() {
  const match = globalThis.location.pathname.match(/^\/cursus\/cursussen\/([^/]+)(?:\/|$)/);
  if (!match) throw new Error('Geen afzonderlijke cursus geselecteerd.');
  return contextFor(match[1]);
}

export function assertWritePaths(files, context, allowRegistry = false) {
  for (const file of files) {
    const path = file.path;
    if (typeof path !== 'string' || path.includes('\\') || path.includes('%') || /[?#\u0000]/.test(path) ||
        path.split('/').some(part => !part || part === '.' || part === '..') ||
        !(path.startsWith(`${context.repoBase}/`) || (allowRegistry && path === REGISTRY_PATH))) {
      throw new Error(`Schrijven buiten de geselecteerde cursus is geblokkeerd: ${path}`);
    }
  }
}

export function validatePage(page) {
  const slug = page?.slug;
  if (typeof slug !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || reserved.has(slug)) {
    throw new Error('Dit lesadres is ongeldig of gereserveerd. Kies een ander lesadres.');
  }
}

export function lessonSlug(value, context) {
  let path = value.trim();
  if (/^https?:/.test(path)) {
    const url = new URL(path);
    if (url.origin !== globalThis.location.origin) throw new Error('Dit lesadres hoort bij een andere website.');
    path = url.pathname;
  }
  if (path.startsWith('/')) {
    if (!path.startsWith(`${context.base}/`)) throw new Error('Dit lesadres hoort bij een andere cursus.');
    path = path.slice(context.base.length + 1);
  }
  const slug = path.replace(/\/$/, '');
  validatePage({ slug });
  return slug;
}
